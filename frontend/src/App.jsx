import { useEffect, useRef, useState } from 'react';
import { VisualEngine } from './engines/VisualEngine.js';
import { AudioEngine } from './engines/AudioEngine.js';
import { BaseFace } from './actors/BaseFace.js';
import screamFile from './assets/sounds/scream-man.mp3';
import { EventsOn, WindowSetSize, WindowCenter, WindowSetPosition } from '../wailsjs/runtime/runtime';
import { ToggleBoundlessMode } from '../wailsjs/go/main/App.js';
import Dashboard from './components/Dashboard';

export default function App() {
    const canvasRef = useRef(null);
    const engineInitialized = useRef(false);
    
    const audioRef = useRef(null);
    const visualRef = useRef(null);

    // --- NEW: PHYSICS REFERENCE FOR WEB FALLBACK ---
    const lastMouseRef = useRef({ x: 0, y: 0, time: performance.now() });

    const [isDashboardOpen, setIsDashboardOpen] = useState(true);

    const settingsRef = useRef({
        runInBackground: true,
        muteScream: false,
        invisibleMode: false,
        boundlessTracking: true
    });

    const [settings, setSettingsState] = useState(settingsRef.current);

    const setSettings = (updater) => {
        setSettingsState(prev => {
            const next = typeof updater === 'function' ? updater(prev) : updater;
            settingsRef.current = next; 
            
            if (prev.boundlessTracking !== next.boundlessTracking) {
                ToggleBoundlessMode(next.boundlessTracking);
            }
            return next;
        });
    };

    useEffect(() => {
        if (!canvasRef.current || engineInitialized.current) return;
        engineInitialized.current = true;

        WindowSetSize(900, 500);
        WindowCenter();

        visualRef.current = new VisualEngine(canvasRef.current);
        audioRef.current = new AudioEngine();
        
        audioRef.current.loadSound(screamFile);
        visualRef.current.loadActor(new BaseFace());

        const MIN_SPEED = 0.5;
        const MAX_SPEED = 5.0;

        // 1. THE NATIVE GO LISTENER (Used when Boundless is ON)
        EventsOn('onGlobalMouseUpdate', (data) => {
            const currentSettings = settingsRef.current;
            if (!currentSettings.invisibleMode) {
                visualRef.current.update(data);
            }

            if (!currentSettings.muteScream && data.speed > MIN_SPEED) {
                let volume = (data.speed - MIN_SPEED) / (MAX_SPEED - MIN_SPEED);
                volume = Math.max(0, Math.min(1, volume));
                audioRef.current.setVolume(volume);
            } else {
                audioRef.current.setVolume(0);
            }
        });
    }, []);

    useEffect(() => {
        if (visualRef.current) {
            setTimeout(() => {
                visualRef.current.setMode(isDashboardOpen ? 'preview' : 'pet');
            }, 10);
        }
    }, [isDashboardOpen]);

    const handleCloseDashboard = () => {
        setIsDashboardOpen(false);
        WindowSetSize(400, 400); 
        const screenWidth = window.screen.availWidth;
        const screenHeight = window.screen.availHeight;
        WindowSetPosition(screenWidth - 420, screenHeight - 420);
    };

    const handleOpenDashboard = () => {
        if (!isDashboardOpen) {
            setIsDashboardOpen(true);
            WindowSetSize(900, 500); 
            setTimeout(() => {
                WindowCenter();
            }, 50);
        }
    };

    // --- 2. THE WEB FALLBACK LISTENER (Used when Boundless is OFF) ---
    const handleWebMouseMove = (e) => {
        const currentSettings = settingsRef.current;
        
        // If Go is handling tracking, completely ignore this web event
        if (currentSettings.boundlessTracking) return;

        const now = performance.now();
        const dt = now - lastMouseRef.current.time;

        if (dt > 0) {
            // Calculate Distance
            const dx = e.screenX - lastMouseRef.current.x;
            const dy = e.screenY - lastMouseRef.current.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Calculate Speed (tuned multiplier to match Go backend feel)
            const speed = (distance / dt) * 2.5;

            const data = { x: e.clientX, y: e.clientY, speed: speed };

            // Update Engines manually
            if (!currentSettings.invisibleMode && visualRef.current) {
                visualRef.current.update(data);
            }

            if (!currentSettings.muteScream && audioRef.current) {
                const MIN_SPEED = 0.5;
                const MAX_SPEED = 5.0;
                if (speed > MIN_SPEED) {
                    let volume = (speed - MIN_SPEED) / (MAX_SPEED - MIN_SPEED);
                    volume = Math.max(0, Math.min(1, volume));
                    audioRef.current.setVolume(volume);
                } else {
                    audioRef.current.setVolume(0);
                }
            }
        }

        // Save state for the next frame
        lastMouseRef.current = { x: e.screenX, y: e.screenY, time: now };
    };

    // --- EMERGENCY MUTE FOR WEB FALLBACK ---
    // If the mouse leaves the window entirely, kill the audio instantly
    const handleWebMouseLeave = () => {
        if (!settingsRef.current.boundlessTracking && audioRef.current) {
            audioRef.current.setVolume(0);
        }
    };

    return (
        <div 
            id="app-container" 
            onMouseMove={handleWebMouseMove} 
            onMouseLeave={handleWebMouseLeave}
            style={{ width: '100vw', height: '100vh', position: 'relative' }}
        >
            <div 
                ref={canvasRef} 
                onDoubleClick={handleOpenDashboard}
                className={isDashboardOpen ? "canvas-preview-mode" : "canvas-pet-mode"}
                style={{ 
                    display: settings.invisibleMode ? 'none' : 'block',
                    '--wails-draggable': isDashboardOpen ? 'none' : 'drag' 
                }} 
            />
            
            {isDashboardOpen && (
                <Dashboard 
                    onClose={handleCloseDashboard} 
                    settings={settings} 
                    setSettings={setSettings} 
                />
            )}
        </div>
    );
}