package main

import (
	"bytes"
	"context"
	_ "embed" // <-- Added the underscore! // <-- 1. NEW IMPORT FOR EMBEDDING FILES
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

// 2. THE EMBED DIRECTIVE
// This tells the Go compiler to grab 'tray-icon.ico' from the same folder
// and inject it directly into the binary as 'iconBytes'.
//
//go:embed tray-icon.ico
var iconBytes []byte

// Dynamically load the native Windows User32 library
var (
	moduser32  = syscall.NewLazyDLL("user32.dll")
	procGetPos = moduser32.NewProc("GetCursorPos")
)

// POINT struct must exactly match the C-struct Windows expects
type POINT struct {
	X int32
	Y int32
}

// Struct to bundle position and speed data for the frontend
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

// Local File Save Struct
type LicenseData struct {
	IsPremium  bool   `json:"isPremium"`
	LicenseKey string `json:"licenseKey"`
}

func NewApp() *App {
	return &App{}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	a.isBoundless = true // Default to true for testing

	// 1. Launch the stealth tracker in a background goroutine
	go a.startStealthTracker()

	// 2. Boot the System Tray on a parallel background thread
	go systray.Run(a.onTrayReady, a.onTrayExit)
}

// --- SYSTEM TRAY LOGIC ---

func (a *App) onTrayReady() {
	// 3. PASS THE EMBEDDED BYTES TO THE SYSTEM TRAY
	systray.SetIcon(iconBytes)
	systray.SetTitle("Scream Cursor")
	systray.SetTooltip("Scream Cursor - Running in Background")

	mOpen := systray.AddMenuItem("Open Control Panel", "Restore the dashboard UI")
	systray.AddSeparator()
	mQuit := systray.AddMenuItem("Quit", "Completely close the application")

	// Listen for tray clicks
	go func() {
		for {
			select {
			case <-mOpen.ClickedCh:
				// 1. Force the OS Window back to center and resize
				runtime.WindowSetSize(a.ctx, 900, 500)
				runtime.WindowCenter(a.ctx)
				runtime.WindowShow(a.ctx)

				// 2. Fire an event to React to open the Dashboard Component!
				runtime.EventsEmit(a.ctx, "onForceOpenDashboard")

			case <-mQuit.ClickedCh:
				// Kill the background tray and the Wails app entirely
				systray.Quit()
				runtime.Quit(a.ctx)
				os.Exit(0)
			}
		}
	}()
}

func (a *App) onTrayExit() {
	// Clean up any OS resources here if needed
}

// --- BOUNDLESS OS TRACKING LOGIC ---

func (a *App) startStealthTracker() {
	for {
		if a.isBoundless {
			var pt POINT

			// Native syscall to get position
			ret, _, _ := procGetPos.Call(uintptr(unsafe.Pointer(&pt)))

			if ret != 0 { // If success
				currentTime := time.Now().UnixMilli()

				// Calculate distance and speed
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

// ToggleBoundlessMode allows your React Dashboard to turn this feature on or off
func (a *App) ToggleBoundlessMode(enabled bool) {
	a.isBoundless = enabled
}

// Helper function to get the hidden save path (AppData on Win, Application Support on Mac)
func (a *App) getSaveFilePath() (string, error) {
	configDir, err := os.UserConfigDir()
	if err != nil {
		return "", err
	}

	// Creates a "ScreamCursor" folder in the OS config directory
	appDir := filepath.Join(configDir, "ScreamCursor")
	if err := os.MkdirAll(appDir, os.ModePerm); err != nil {
		return "", err
	}

	return filepath.Join(appDir, "scream_license.json"), nil
}

// ValidateLicense is called from React when the user pastes their key
func (a *App) ValidateLicense(key string) (bool, error) {
	// 1. Prepare the request to Dodo Payments
	reqBody := ValidateRequest{LicenseKey: key}
	jsonBody, _ := json.Marshal(reqBody)

	// Note: We are using the TEST endpoint here!
	resp, err := http.Post("https://test.dodopayments.com/licenses/validate", "application/json", bytes.NewBuffer(jsonBody))
	if err != nil {
		return false, fmt.Errorf("network error: %v", err)
	}
	defer resp.Body.Close()

	// 2. Read the response
	body, _ := io.ReadAll(resp.Body)
	var dodoResp ValidateResponse
	if err := json.Unmarshal(body, &dodoResp); err != nil {
		return false, fmt.Errorf("failed to parse response")
	}

	// 3. If valid, save it to the user's computer forever!
	if dodoResp.Valid {
		savePath, err := a.getSaveFilePath()
		if err == nil {
			licenseData := LicenseData{IsPremium: true, LicenseKey: key}
			fileData, _ := json.MarshalIndent(licenseData, "", "  ")
			os.WriteFile(savePath, fileData, 0644) // Writes the hidden JSON file
		}
	}

	return dodoResp.Valid, nil
}

// CheckPremiumStatus runs when the app boots up to see if they are already Premium
func (a *App) CheckPremiumStatus() bool {
	savePath, err := a.getSaveFilePath()
	if err != nil {
		return false
	}

	// Check if the file exists
	fileData, err := os.ReadFile(savePath)
	if err != nil {
		return false // No file found, they are on the free tier
	}

	// File found! Read it.
	var licenseData LicenseData
	if err := json.Unmarshal(fileData, &licenseData); err != nil {
		return false
	}

	return licenseData.IsPremium
}
