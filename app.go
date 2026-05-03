package main

import (
	"context"
	"math"
	"os"
	"syscall"
	"time"
	"unsafe"

	"github.com/getlantern/systray"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

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
	systray.SetIcon(getDummyIcon())
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

// A tiny 1x1 transparent PNG to prevent the app from crashing before we add a real icon
func getDummyIcon() []byte {
	return []byte{
		137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82,
		0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0, 31, 21, 196, 137, 0,
		0, 0, 11, 73, 68, 65, 84, 8, 215, 99, 96, 0, 2, 0, 0, 5, 0,
		1, 226, 38, 5, 155, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130,
	}
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
