package main

import (
	"bytes"
	"context"
	"crypto/sha256"
	_ "embed"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"math"
	"net/http"
	"os"
	"path/filepath"
	"syscall"
	"time"
	"unsafe"

	"github.com/creativeprojects/go-selfupdate"
	"github.com/denisbrodbeck/machineid"
	"github.com/getlantern/systray"
	"github.com/wailsapp/wails/v2/pkg/runtime"
	"golang.org/x/sys/windows/registry"
)

//go:embed tray-icon.ico
var iconBytes []byte

// Constants
const (
	appSecretSalt     = "SCRM_CRSR_SUPER_BUNDLE_SALT_9982"
	CurrentAppVersion = "v2.0.0"
	GitHubRepo        = "kaushik0010/screamcursor"
)

var (
	moduser32  = syscall.NewLazyDLL("user32.dll")
	procGetPos = moduser32.NewProc("GetCursorPos")
)

type POINT struct {
	X int32
	Y int32
}

type MouseData struct {
	X     float64 `json:"x"`
	Y     float64 `json:"y"`
	Speed float64 `json:"speed"`
}

type App struct {
	ctx           context.Context
	isBoundless   bool
	lastMouseX    int32
	lastMouseY    int32
	lastMouseTime int64
}

type ValidateRequest struct {
	LicenseKey string `json:"license_key"`
}

type ValidateResponse struct {
	Valid bool `json:"valid"`
}

type LicenseData struct {
	Signature         string `json:"signature"`
	LicenseKey        string `json:"licenseKey"`
	HighestPowerLevel int    `json:"highestPowerLevel"`
}

type UpdateInfo struct {
	Available    bool   `json:"available"`
	NewVersion   string `json:"newVersion"`
	ReleaseNotes string `json:"releaseNotes"`
}

func NewApp() *App {
	return &App{}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	a.isBoundless = true

	go a.startStealthTracker()
	go systray.Run(a.onTrayReady, a.onTrayExit)
}

func (a *App) onTrayReady() {
	systray.SetIcon(iconBytes)
	systray.SetTitle("Scream Cursor")
	systray.SetTooltip("Scream Cursor - Running in Background")

	mOpen := systray.AddMenuItem("Open Control Panel", "Restore the dashboard UI")
	systray.AddSeparator()
	mQuit := systray.AddMenuItem("Quit", "Completely close the application")

	go func() {
		for {
			select {
			case <-mOpen.ClickedCh:
				runtime.WindowSetSize(a.ctx, 1050, 650)
				runtime.WindowCenter(a.ctx)
				runtime.WindowShow(a.ctx)
				runtime.EventsEmit(a.ctx, "onForceOpenDashboard")

			case <-mQuit.ClickedCh:
				systray.Quit()
				runtime.Quit(a.ctx)
				os.Exit(0)
			}
		}
	}()
}

func (a *App) onTrayExit() {
}

func (a *App) startStealthTracker() {
	for {
		if a.isBoundless {
			var pt POINT
			ret, _, _ := procGetPos.Call(uintptr(unsafe.Pointer(&pt)))

			if ret != 0 {
				currentTime := time.Now().UnixMilli()
				dx := float64(pt.X - a.lastMouseX)
				dy := float64(pt.Y - a.lastMouseY)
				distance := math.Sqrt(dx*dx + dy*dy)
				timeDiff := currentTime - a.lastMouseTime

				var speed float64 = 0
				if timeDiff > 0 {
					speed = distance / float64(timeDiff)
				}

				data := MouseData{
					X:     float64(pt.X),
					Y:     float64(pt.Y),
					Speed: speed,
				}
				runtime.EventsEmit(a.ctx, "onGlobalMouseUpdate", data)

				a.lastMouseX = pt.X
				a.lastMouseY = pt.Y
				a.lastMouseTime = currentTime
			}
		}
		time.Sleep(16 * time.Millisecond)
	}
}

func (a *App) ToggleBoundlessMode(enabled bool) {
	a.isBoundless = enabled
}

func (a *App) ToggleAutoStart(enabled bool) error {
	exePath, err := os.Executable()
	if err != nil {
		return err
	}

	runCmd := fmt.Sprintf(`"%s" --background-boot`, exePath)

	key, err := registry.OpenKey(registry.CURRENT_USER, `Software\Microsoft\Windows\CurrentVersion\Run`, registry.ALL_ACCESS)
	if err != nil {
		return err
	}
	defer key.Close()

	if enabled {
		return key.SetStringValue("ScreamCursor", runCmd)
	} else {
		err := key.DeleteValue("ScreamCursor")
		if err != registry.ErrNotExist {
			return err
		}
		return nil
	}
}

func (a *App) getSaveFilePath() (string, error) {
	configDir, err := os.UserConfigDir()
	if err != nil {
		return "", err
	}
	appDir := filepath.Join(configDir, "ScreamCursor")
	if err := os.MkdirAll(appDir, os.ModePerm); err != nil {
		return "", err
	}
	return filepath.Join(appDir, "scream_license.json"), nil
}

// Generates a SHA-256 hash using the physical machine ID, the license key, and a secret salt
func (a *App) generateHardwareSignature(licenseKey string) (string, error) {
	hwid, err := machineid.ID()
	if err != nil {
		return "", err
	}

	rawString := hwid + licenseKey + appSecretSalt
	hash := sha256.Sum256([]byte(rawString))

	return hex.EncodeToString(hash[:]), nil
}

func (a *App) ValidateLicense(key string) (bool, error) {
	reqBody := ValidateRequest{LicenseKey: key}
	jsonBody, _ := json.Marshal(reqBody)

	resp, err := http.Post("https://test.dodopayments.com/licenses/validate", "application/json", bytes.NewBuffer(jsonBody))
	if err != nil {
		return false, fmt.Errorf("network error: %v", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	var dodoResp ValidateResponse
	if err := json.Unmarshal(body, &dodoResp); err != nil {
		return false, fmt.Errorf("failed to parse response")
	}

	if dodoResp.Valid {
		savePath, err := a.getSaveFilePath()
		if err == nil {
			signature, sigErr := a.generateHardwareSignature(key)
			if sigErr == nil {
				licenseData := LicenseData{
					Signature:         signature,
					LicenseKey:        key,
					HighestPowerLevel: 0,
				}
				fileData, _ := json.MarshalIndent(licenseData, "", "  ")
				os.WriteFile(savePath, fileData, 0644)
			}
		}
	}

	return dodoResp.Valid, nil
}

func (a *App) CheckSuperBundleStatus() bool {
	savePath, err := a.getSaveFilePath()
	if err != nil {
		return false
	}
	fileData, err := os.ReadFile(savePath)
	if err != nil {
		return false
	}

	var licenseData LicenseData
	if err := json.Unmarshal(fileData, &licenseData); err != nil {
		return false
	}

	if licenseData.Signature == "" || licenseData.LicenseKey == "" {
		return false
	}

	expectedSignature, err := a.generateHardwareSignature(licenseData.LicenseKey)
	if err != nil {
		return false
	}

	return licenseData.Signature == expectedSignature
}

func (a *App) SavePowerLevel(level int) {
	savePath, err := a.getSaveFilePath()
	if err != nil {
		return
	}
	fileData, err := os.ReadFile(savePath)
	if err != nil {
		return
	}
	var licenseData LicenseData
	if err := json.Unmarshal(fileData, &licenseData); err == nil {
		if level > licenseData.HighestPowerLevel {
			licenseData.HighestPowerLevel = level
			newFileData, _ := json.MarshalIndent(licenseData, "", "  ")
			os.WriteFile(savePath, newFileData, 0644)
		}
	}
}

func (a *App) GetHighestPowerLevel() int {
	savePath, err := a.getSaveFilePath()
	if err != nil {
		return 0
	}
	fileData, err := os.ReadFile(savePath)
	if err != nil {
		return 0
	}
	var licenseData LicenseData
	if err := json.Unmarshal(fileData, &licenseData); err != nil {
		return 0
	}
	return licenseData.HighestPowerLevel
}

// --- OTA AUTO-UPDATER METHODS ---

func (a *App) CheckForUpdates() (UpdateInfo, error) {
	updater, err := selfupdate.NewUpdater(selfupdate.Config{})
	if err != nil {
		return UpdateInfo{}, fmt.Errorf("failed to create updater: %w", err)
	}

	latest, found, err := updater.DetectLatest(context.Background(), selfupdate.ParseSlug(GitHubRepo))
	if err != nil {
		return UpdateInfo{}, fmt.Errorf("error detecting latest version: %w", err)
	}

	if !found {
		return UpdateInfo{Available: false}, nil
	}

	if latest.GreaterThan(CurrentAppVersion) {
		return UpdateInfo{
			Available:    true,
			NewVersion:   latest.Version(),
			ReleaseNotes: latest.ReleaseNotes,
		}, nil
	}

	return UpdateInfo{Available: false}, nil
}

func (a *App) PerformSelfUpdate() (bool, error) {
	updater, err := selfupdate.NewUpdater(selfupdate.Config{})
	if err != nil {
		return false, fmt.Errorf("failed to initialize updater: %w", err)
	}

	latest, found, err := updater.DetectLatest(context.Background(), selfupdate.ParseSlug(GitHubRepo))
	if err != nil || !found {
		return false, fmt.Errorf("no update target found: %v", err)
	}

	exePath, err := os.Executable()
	if err != nil {
		return false, fmt.Errorf("could not locate current executable: %w", err)
	}

	if err := updater.UpdateTo(context.Background(), latest, exePath); err != nil {
		return false, fmt.Errorf("update failed: %w", err)
	}

	return true, nil
}

func (a *App) GetAppVersion() string {
	return CurrentAppVersion
}
