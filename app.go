package main

import (
	"bytes"
	"context"
	_ "embed"
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

	"github.com/getlantern/systray"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

//go:embed tray-icon.ico
var iconBytes []byte

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

// Dodo Payments API Structs
type ValidateRequest struct {
	LicenseKey string `json:"license_key"`
}

type ValidateResponse struct {
	Valid bool `json:"valid"`
}

// --- PHASE 1 OVERHAUL: NEW SUPER BUNDLE STRUCT ---
type LicenseData struct {
	HasSuperBundle    bool   `json:"hasSuperBundle"`
	LicenseKey        string `json:"licenseKey"`
	HighestPowerLevel int    `json:"highestPowerLevel"`
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
				runtime.WindowSetSize(a.ctx, 900, 500)
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

// --- PHASE 1 OVERHAUL: NEW VALIDATION & SAVE LOGIC ---

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
			// Wipe the old save format and strictly apply the Super Bundle
			licenseData := LicenseData{
				HasSuperBundle:    true,
				LicenseKey:        key,
				HighestPowerLevel: 0, // Everyone starts at Base Form
			}
			fileData, _ := json.MarshalIndent(licenseData, "", "  ")
			os.WriteFile(savePath, fileData, 0644) 
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
		// If unmarshalling fails, it means they have the old legacy JSON structure. 
		// Return false to lock them out of the new Super Bundle features.
		return false
	}

	return licenseData.HasSuperBundle
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
		// Only overwrite the file if they actually achieved a new high score
		if level > licenseData.HighestPowerLevel {
			licenseData.HighestPowerLevel = level
			newFileData, _ := json.MarshalIndent(licenseData, "", "  ")
			os.WriteFile(savePath, newFileData, 0644)
		}
	}
}