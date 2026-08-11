// frontend/src/App.jsx:
import { useEffect, useRef, useState } from 'react';
import { VisualEngine } from './engines/VisualEngine.js';
import { AudioEngine } from './engines/AudioEngine.js';
import { BaseFace } from './actors/BaseFace.js';
import screamFile from './assets/sounds/scream-man.mp3';
import { EventsOn, WindowSetSize, WindowCenter, WindowSetPosition, WindowHide, WindowShow } from '../wailsjs/runtime/runtime';

// --- PHASE 4: IMPORT NEW SAVE STATE BINDINGS ---
import { ToggleBoundlessMode, CheckSuperBundleStatus, ValidateLicense, GetHighestPowerLevel, SavePowerLevel } from '../wailsjs/go/main/App.js';

import Dashboard from './components/Dashboard';
import { DemonFace } from './actors/DemonFace.js';
import demonScreamFile from './assets/sounds/scream-demon.mp3'; 
import { CatFace } from './actors/CatFace.js';
import catScreamFile from './assets/sounds/scream-frantic-cat.mp3';
import { WomanFace } from './actors/WomanFace.js';
import womanScreamFile from './assets/sounds/scream-woman.mp3';
import { FighterFace } from './actors/warriors/FighterFace.js'; 

// --- PHASE 4: PROGRESSION THRESHOLDS ---
const FIGHTER_THRESHOLDS = [
    { level: 0, form: 'BASE', required: 0 },
    { level: 1, form: 'GOLD', required: 500 },
    { level: 2, form: 'DIVINE_RED', required: 1500 },
    { level: 3, form: 'DIVINE_BLUE', required: 3000 },
    { level: 4, form: 'AUTONOMOUS', required: 5000 }
];

export default function App() {
    const canvasRef = useRef(null);
    const engineInitialized = useRef(false);
    
    const audioRef = useRef(null);
    const visualRef = useRef(null);

    const lastMouseRef = useRef({ x: 0, y: 0, time: performance.now() });
    const isTransitioning = useRef(false);
    
    const [isDashboardOpen, setIsDashboardOpen] = useState(true);
    const [activeEntity, setActiveEntity] = useState('base'); 
    
    const [targetForm, setTargetForm] = useState('BASE');
    const [isPremium, setIsPremium] = useState(false);
    const [interceptorMessage, setInterceptorMessage] = useState('');

    // --- PHASE 4: PROGRESSION STATES ---
    const [unlockedLevel, setUnlockedLevel] = useState(0); 
    const [powerMeter, setPowerMeter] = useState(0); // Only for UI
    
    // Background math refs to prevent React lag
    const powerRef = useRef(0);
    const maxUnlockedRef = useRef(0);
    const lastInteractionTime = useRef(Date.now());
    const currentRenderedForm = useRef('BASE');

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
        // --- PHASE 4: BOOT LOADERS ---
        CheckSuperBundleStatus().then(status => {
            setIsPremium(status);
            if (status) {
                GetHighestPowerLevel().then(level => {
                    maxUnlockedRef.current = level;
                    setUnlockedLevel(level);
                }).catch(err => console.error("Save load error:", err));
            }
        }).catch(err => console.error(err));

        if (!canvasRef.current || engineInitialized.current) return;
        engineInitialized.current = true;

        WindowSetSize(1050, 650);
        WindowCenter();

        visualRef.current = new VisualEngine(canvasRef.current);
        audioRef.current = new AudioEngine();
        
        audioRef.current.loadSound(screamFile);
        visualRef.current.loadActor(new BaseFace());

        const MIN_SPEED = 0.5;
        const MAX_SPEED = 5.0;

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

            // --- PHASE 4: CHARGE POWER METER (Tuned for Difficulty) ---
            const CHARGE_MIN_SPEED = 2.5; // Requires violent shaking
            const CHARGE_MULTIPLIER = 0.6; // The grind multiplier

            if (data.speed > CHARGE_MIN_SPEED) {
                // Add power based on speed. Max power is 5000.
                powerRef.current = Math.min(5000, powerRef.current + (data.speed * CHARGE_MULTIPLIER));
                lastInteractionTime.current = Date.now();
            }
        });

        EventsOn('onForceOpenDashboard', () => {
            setIsDashboardOpen(true);
        });
    }, []);

    // --- PHASE 4: THE POWER ENGINE LOOP ---
    // Runs 10 times a second. Handles decay, transformations, and UI syncing.
    useEffect(() => {
        const powerInterval = setInterval(() => {
            if (activeEntity !== 'fighter') return;

            const now = Date.now();
            const timeSinceLastAction = now - lastInteractionTime.current;
            
            // 1. The 2-Minute Hold & Decay (120,000 ms = 2 minutes)
            if (timeSinceLastAction > 120000) {
                powerRef.current = Math.max(0, powerRef.current - 5); // Slowly drains power
            }

            // 2. Determine which form they are currently in based on raw power
            let achievedLevel = 0;
            let achievedForm = 'BASE';
            
            for (let i = FIGHTER_THRESHOLDS.length - 1; i >= 0; i--) {
                if (powerRef.current >= FIGHTER_THRESHOLDS[i].required) {
                    achievedLevel = FIGHTER_THRESHOLDS[i].level;
                    achievedForm = FIGHTER_THRESHOLDS[i].form;
                    break;
                }
            }

            // 3. Trigger Transformation if form changed
            if (currentRenderedForm.current !== achievedForm) {
                currentRenderedForm.current = achievedForm;
                if (visualRef.current) {
                    visualRef.current.setTargetForm(achievedForm);
                }
            }

            // 4. Check for New High Score (Save to hard drive)
            if (achievedLevel > maxUnlockedRef.current) {
                maxUnlockedRef.current = achievedLevel;
                setUnlockedLevel(achievedLevel); // Updates UI to unlock new buttons
                SavePowerLevel(achievedLevel);   // Writes to JSON file
                setInterceptorMessage(`NEW RECORD: LEVEL ${achievedLevel} UNLOCKED!`);
                setTimeout(() => setInterceptorMessage(''), 4000);
            }

            // 5. Sync the math to the React UI smoothly
            setPowerMeter(Math.floor(powerRef.current));

        }, 100); // 100ms interval = lightweight

        return () => clearInterval(powerInterval);
    }, [activeEntity]);

    useEffect(() => {
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
        } else if (activeEntity === 'fighter') {
            visualRef.current.loadActor(new FighterFace());
            audioRef.current.loadSound(screamFile);
            
            // Reset power when picking the fighter
            powerRef.current = 0; 
            currentRenderedForm.current = 'BASE';
            setTimeout(() => {
                if (visualRef.current) visualRef.current.setTargetForm('BASE');
            }, 50);
        }
    }, [activeEntity]);

    useEffect(() => {
        if (visualRef.current) {
            setTimeout(() => {
                visualRef.current.setMode(isDashboardOpen ? 'preview' : 'pet');
            }, 10);
        }
    }, [isDashboardOpen]);

    const premiumEntities = ['fighter', 'prince', 'beast', 'berserker', 'anomaly'];

    useEffect(() => {
        const handleFocusLost = () => {
            if (!isPremium && premiumEntities.includes(activeEntity)) {
                setActiveEntity('base'); 
                setInterceptorMessage('NICE TRY. SUPER FIGHTER BUNDLE REQUIRED FOR BACKGROUND USE.');
                setTimeout(() => setInterceptorMessage(''), 4000);
            }
        };

        window.addEventListener('blur', handleFocusLost);
        return () => window.removeEventListener('blur', handleFocusLost);
    }, [isPremium, activeEntity]);

    const handleCloseDashboard = () => {
        if (isTransitioning.current) return; 

        if (!isPremium && premiumEntities.includes(activeEntity)) {
            setActiveEntity('base');
            setInterceptorMessage('ERROR: THE SUPER FIGHTER BUNDLE IS REQUIRED TO UNLEASH THIS ENTITY.');
            setTimeout(() => setInterceptorMessage(''), 4000);
            return; 
        }
        
        isTransitioning.current = true; 
        setIsDashboardOpen(false);

        if (settingsRef.current.invisibleMode) {
            WindowHide();
            isTransitioning.current = false; 
            return; 
        }

        WindowSetSize(400, 400); 
        
        setTimeout(() => {
            const screenWidth = window.screen.availWidth;
            const screenHeight = window.screen.availHeight;
            WindowSetPosition(screenWidth - 420, screenHeight - 420);
            isTransitioning.current = false; 
        }, 100);
    };

    const handleOpenDashboard = () => {
        if (isTransitioning.current || isDashboardOpen) return;
        
        isTransitioning.current = true; 
        setIsDashboardOpen(true);
            
        WindowShow(); 
        WindowSetSize(1050, 650); 
            
        setTimeout(() => {
            WindowCenter();
            isTransitioning.current = false; 
        }, 100);
    };

    const handleValidateKey = async (key) => {
        try {
            const isValid = await ValidateLicense(key);
            if (isValid) {
                setIsPremium(true);
                setInterceptorMessage('LICENSE ACCEPTED. SUPER FIGHTER ROSTER UNLOCKED.');
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

    const handleWebMouseMove = (e) => {
        const currentSettings = settingsRef.current;
        if (currentSettings.boundlessTracking) return;

        const now = performance.now();
        const dt = now - lastMouseRef.current.time;

        if (dt > 0) {
            const dx = e.screenX - lastMouseRef.current.x;
            const dy = e.screenY - lastMouseRef.current.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const speed = (distance / dt) * 2.5;
            const data = { x: e.clientX, y: e.clientY, speed: speed };

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

            // --- PHASE 4: CHARGE POWER METER (Web Fallback Tuned) ---
            const CHARGE_MIN_SPEED = 2.5; 
            const CHARGE_MULTIPLIER = 0.6; 

            if (speed > CHARGE_MIN_SPEED) {
                powerRef.current = Math.min(5000, powerRef.current + (speed * CHARGE_MULTIPLIER));
                lastInteractionTime.current = Date.now();
            }
        }
        lastMouseRef.current = { x: e.screenX, y: e.screenY, time: now };
    };

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
                    targetForm={targetForm}           
                    setTargetForm={setTargetForm}
                    // --- PASSING NEW STATE TO DASHBOARD ---
                    powerMeter={powerMeter}
                    unlockedLevel={unlockedLevel}     
                />
            )}
        </div>
    );
}