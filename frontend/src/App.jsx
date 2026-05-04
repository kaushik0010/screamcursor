// frontend/src/App.jsx:
import { useEffect, useRef, useState } from 'react';
import { VisualEngine } from './engines/VisualEngine.js';
import { AudioEngine } from './engines/AudioEngine.js';
import { BaseFace } from './actors/BaseFace.js';
import screamFile from './assets/sounds/scream-man.mp3';
import { EventsOn, WindowSetSize, WindowCenter, WindowSetPosition, WindowHide, WindowShow } from '../wailsjs/runtime/runtime';

// --- UPDATED WAILS IMPORTS TO INCLUDE PAYWALL LOGIC ---
import { ToggleBoundlessMode, CheckPremiumStatus, ValidateLicense } from '../wailsjs/go/main/App.js';

import Dashboard from './components/Dashboard';
// Add these right below your other imports
import { DemonFace } from './actors/DemonFace.js';
import demonScreamFile from './assets/sounds/scream-demon.mp3'; 

import { CatFace } from './actors/CatFace.js';
import catScreamFile from './assets/sounds/scream-frantic-cat.mp3';

import { WomanFace } from './actors/WomanFace.js';
import womanScreamFile from './assets/sounds/scream-woman.mp3';

export default function App() {
    const canvasRef = useRef(null);
    const engineInitialized = useRef(false);
    
    const audioRef = useRef(null);
    const visualRef = useRef(null);

    // --- NEW: PHYSICS REFERENCE FOR WEB FALLBACK ---
    const lastMouseRef = useRef({ x: 0, y: 0, time: performance.now() });

    // --- NEW: INTERACTION LOCK TO BLOCK SPAM CLICKS ---
    const isTransitioning = useRef(false);

    const [isDashboardOpen, setIsDashboardOpen] = useState(true);

    const [activeEntity, setActiveEntity] = useState('base'); // 'base', 'demon', or 'cat'

    // --- NEW: PREMIUM STATE & INTERCEPTOR MESSAGING ---
    const [isPremium, setIsPremium] = useState(false);
    const [interceptorMessage, setInterceptorMessage] = useState('');

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
        // --- NEW: CHECK PREMIUM STATUS ON BOOT ---
        CheckPremiumStatus().then(status => {
            setIsPremium(status);
        }).catch(err => console.error(err));

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

        // 2. THE SYSTEM TRAY RESCUE LISTENER
        EventsOn('onForceOpenDashboard', () => {
            setIsDashboardOpen(true);
        });
    }, []);


    // --- THE ASSET SWAPPER ---
    useEffect(() => {
        // Ensure engines are booted before trying to load assets
        if (!visualRef.current || !audioRef.current) return;

        if (activeEntity === 'base') {
            visualRef.current.loadActor(new BaseFace());
            audioRef.current.loadSound(screamFile);
        } else if (activeEntity === 'demon') {
            visualRef.current.loadActor(new DemonFace());
            audioRef.current.loadSound(demonScreamFile);
        } else if (activeEntity === 'cat') {
            visualRef.current.loadActor(new CatFace());
            audioRef.current.loadSound(catScreamFile);
        } else if (activeEntity === 'woman') {
            visualRef.current.loadActor(new WomanFace());
            audioRef.current.loadSound(womanScreamFile);
        }
        // Cat logic will go here next!
        
    }, [activeEntity]);

    useEffect(() => {
        if (visualRef.current) {
            setTimeout(() => {
                visualRef.current.setMode(isDashboardOpen ? 'preview' : 'pet');
            }, 10);
        }
    }, [isDashboardOpen]);

    // --- THE STEALTH INTERCEPTOR (Focus Lost) ---
    // Prevents free users from minimizing the app to bypass the paywall and hear premium screams
    useEffect(() => {
        const handleFocusLost = () => {
            // If they background the app while trying to sneak a premium face
            if (!isPremium && activeEntity !== 'base') {
                setActiveEntity('base'); // Instantly revert them to the free tier
                
                // Set a cheeky message so when they open it back up, they know they were caught
                setInterceptorMessage('NICE TRY. PREMIUM BUNDLE REQUIRED FOR BACKGROUND USE.');
                setTimeout(() => setInterceptorMessage(''), 4000);
            }
        };

        // Listen for the OS minimizing the window or clicking away
        window.addEventListener('blur', handleFocusLost);
        
        // Cleanup the listener
        return () => window.removeEventListener('blur', handleFocusLost);
    }, [isPremium, activeEntity]);

    
    // --- THE SHAPE SHIFTING LOGIC & INTERCEPTOR ---
    
    const handleCloseDashboard = () => {
        // If the window is currently moving, IGNORE THE CLICK entirely.
        if (isTransitioning.current) return; 

        // --- THE INTERCEPTOR (TEASE PAYWALL) ---
        // If they try to unleash a premium face without owning the bundle, block it!
        if (!isPremium && activeEntity !== 'base') {
            setActiveEntity('base');
            setInterceptorMessage('ERROR: THE UNHINGED BUNDLE IS REQUIRED TO UNLEASH THIS ENTITY.');
            
            // Clear the warning text after 4 seconds
            setTimeout(() => setInterceptorMessage(''), 4000);
            return; 
        }
        
        isTransitioning.current = true; // Lock the doors
        setIsDashboardOpen(false);

        if (settingsRef.current.invisibleMode) {
            WindowHide();
            isTransitioning.current = false; // Unlock
            return; 
        }

        WindowSetSize(400, 400); 
        
        setTimeout(() => {
            const screenWidth = window.screen.availWidth;
            const screenHeight = window.screen.availHeight;
            WindowSetPosition(screenWidth - 420, screenHeight - 420);
            isTransitioning.current = false; // Unlock
        }, 100);
    };

    const handleOpenDashboard = () => {
        // If it's already open, or currently moving, IGNORE THE CLICK.
        if (isTransitioning.current || isDashboardOpen) return;
        
        isTransitioning.current = true; // Lock the doors
        setIsDashboardOpen(true);
            
        WindowShow(); 
        WindowSetSize(900, 500); 
            
        setTimeout(() => {
            WindowCenter();
            isTransitioning.current = false; // Unlock
        }, 100);
    };

    // --- NEW: THE LICENSE VALIDATION HANDLER ---
    const handleValidateKey = async (key) => {
        try {
            const isValid = await ValidateLicense(key);
            if (isValid) {
                setIsPremium(true);
                setInterceptorMessage('LICENSE ACCEPTED. PREMIUM ENTITIES UNLOCKED.');
                setTimeout(() => setInterceptorMessage(''), 4000);
                return true;
            } else {
                setInterceptorMessage('INVALID LICENSE KEY. ACCESS DENIED.');
                setTimeout(() => setInterceptorMessage(''), 4000);
                return false;
            }
        } catch (err) {
            console.error(err);
            setInterceptorMessage('NETWORK ERROR. FAILED TO VERIFY LICENSE.');
            setTimeout(() => setInterceptorMessage(''), 4000);
            return false;
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
                    activeEntity={activeEntity}
                    setActiveEntity={setActiveEntity}
                    isPremium={isPremium}
                    interceptorMessage={interceptorMessage}
                    onValidateKey={handleValidateKey}   
                />
            )}
        </div>
    );
}