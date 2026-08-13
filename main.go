package main

import (
	"embed"
	"os" // Added to read command line arguments

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/windows"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	app := NewApp()

	// --- PHASE 6: CHECK FOR BACKGROUND BOOT FLAG ---
	startHidden := false
	for _, arg := range os.Args {
		if arg == "--background-boot" {
			startHidden = true
			break
		}
	}

	err := wails.Run(&options.App{
		Title:  "Scream Cursor",
		Width:  1050,
		Height: 650,

		Frameless:        true,
		AlwaysOnTop:      true,
		StartHidden:      startHidden, // Tells Wails not to show the window if booted from Registry
		BackgroundColour: &options.RGBA{R: 0, G: 0, B: 0, A: 0},

		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		OnStartup: app.startup,
		Bind: []interface{}{
			app,
		},
		Windows: &windows.Options{
			WebviewIsTransparent:              true,
			WindowIsTranslucent:               true,
			BackdropType:                      windows.None,
			DisableFramelessWindowDecorations: true,
			DisableWindowIcon:                 true,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
