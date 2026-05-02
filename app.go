package main

import (
	"context"
	"math"
	"syscall"
	"time"
	"unsafe"

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

	// Launch the stealth tracker in a background goroutine
	go a.startStealthTracker()
}

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

				// Emit bundled MouseData event
				// Frontend now receives (x, y, and speed) simultaneously.
				data := MouseData{
					X:     float64(pt.X),
					Y:     float64(pt.Y),
					Speed: speed,
				}
				runtime.EventsEmit(a.ctx, "onGlobalMouseUpdate", data)

				// Update last known stats
				a.lastMouseX = pt.X
				a.lastMouseY = pt.Y
				a.lastMouseTime = currentTime
			}
		}

		// Wait 16 milliseconds (~60fps polling rate)
		time.Sleep(16 * time.Millisecond)
	}
}

// ToggleBoundlessMode allows your React Dashboard to turn this feature on or off
func (a *App) ToggleBoundlessMode(enabled bool) {
	a.isBoundless = enabled
}
