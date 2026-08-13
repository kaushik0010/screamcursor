// frontend/src/App.jsx
import { useEffect, useRef, useState } from 'react';
import { VisualEngine } from './engines/VisualEngine.js';
import { AudioEngine } from './engines/AudioEngine.js';
import { BaseFace } from './actors/BaseFace.js';
import screamFile from './assets/sounds/scream-man.mp3';
import { EventsOn, WindowSetSize, WindowCenter, WindowSetPosition, WindowHide, WindowShow } from '../wailsjs/runtime/runtime';

// Import ToggleAutoStart from the backend
import { ToggleBoundlessMode, ToggleAutoStart, CheckSuperBundleStatus, ValidateLicense, GetHighestPowerLevel, SavePowerLevel } from '../wailsjs/go/main/App.js';

import Dashboard from './components/Dashboard';
import { DemonFace } from './actors/DemonFace.js';
import demonScreamFile from './assets/sounds/scream-demon.mp3'; 
import { CatFace } from './actors/CatFace.js';
import catScreamFile from './assets/sounds/scream-frantic-cat.mp3';
import { WomanFace } from './actors/WomanFace.js';
import womanScreamFile from './assets/sounds/scream-woman.mp3';
import { FighterFace } from './actors/warriors/FighterFace.js';
import { PrinceFace } from './actors/warriors/PrinceFace.js';
import { BeastFace } from './actors/warriors/BeastFace.js';
import { BerserkerFace } from './actors/warriors/BerserkerFace.js';
import { AnomalyFace } from './actors/warriors/AnomalyFace.js';

const SUPER_ENTITIES = ['fighter', 'prince', 'beast', 'berserker', 'anomaly'];

// --- GLOBAL ROSTER DICTIONARY ---
const ENTITY_THRESHOLDS = {
    fighter: [
        { level: 0, form: 'BASE', required: 0 }, 
        { level: 1, form: 'GOLD', required: 500 },
        { level: 2, form: 'DIVINE_RED', required: 1500 },
        { level: 3, form: 'DIVINE_BLUE', required: 3000 },
        { level: 4, form: 'AUTONOMOUS', required: 5000 }
    ],
    prince: [
        { level: 0, form: 'BASE', required: 0 },
        { level: 1, form: 'GOLD', required: 500 },
        { level: 3, form: 'DIVINE_BLUE', required: 3000 },
        { level: 4, form: 'ULTRA_EGO', required: 5000 }
    ],
    beast: [
        { level: 0, form: 'BASE', required: 0 },
        { level: 2, form: 'GOLD', required: 1500 },
        { level: 4, form: 'ULTIMATE_WHITE', required: 5000 }
    ],
    berserker: [
        { level: 0, form: 'BASE', required: 0 },
        { level: 1, form: 'LEGENDARY_GREEN', required: 1500 }
    ],
    anomaly: [
        { level: 0, form: 'BASE', required: 0 },
        { level: 1, form: 'GOLD', required: 500 },
        { level: 3, form: 'DIVINE_ROSE', required: 3000 }
    ]
};

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

    const [unlockedLevel, setUnlockedLevel] = useState(0); 
    const [powerMeter, setPowerMeter] = useState(0);
    
    const powerRef = useRef(0);
    const maxUnlockedRef = useRef(0);
    const lastInteractionTime = useRef(Date.now());
    const currentRenderedForm = useRef('BASE');

    const settingsRef = useRef({
        runInBackground: true,
        autoStart: false, // Added autoStart to default state
        muteScream: false,
        invisibleMode: false,
        boundlessTracking: true,
        enableMicInput: false 
    });

    const [settings, setSettingsState] = useState(settingsRef.current);

    const setSettings = (updater) => {
        setSettingsState(prev => {
            const next = typeof updater === 'function' ? updater(prev) : updater;
            settingsRef.current = next; 
            
            if (prev.boundlessTracking !== next.boundlessTracking) {
                ToggleBoundlessMode(next.boundlessTracking);
            }
            
            // Intercept autoStart toggle and hit the Registry Backend
            if (prev.autoStart !== next.autoStart) {
                ToggleAutoStart(next.autoStart).catch(err => console.error("Failed to set Registry auto-start:", err));
            }
            
            return next;
        });
    };

    useEffect(() => {
        if (!audioRef.current) return;

        if (settings.enableMicInput) {
            audioRef.current.enableMic().then(success => {
                if (!success) {
                    setInterceptorMessage('MIC ACCESS DENIED BY OS OR BROWSER.');
                    setTimeout(() => setInterceptorMessage(''), 4000);
                    setSettings(prev => ({ ...prev, enableMicInput: false }));
                } else {
                    setInterceptorMessage('MIC ENABLED. SCREAM TO CHARGE KI.');
                    setTimeout(() => setInterceptorMessage(''), 4000);
                }
            });
        } else {
            audioRef.current.disableMic();
        }
    }, [settings.enableMicInput]);

    useEffect(() => {
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

            const CHARGE_MIN_SPEED = 2.5; 
            const CHARGE_MULTIPLIER = 0.6; 

            if (!currentSettings.enableMicInput && data.speed > CHARGE_MIN_SPEED) {
                powerRef.current = Math.min(5000, powerRef.current + (data.speed * CHARGE_MULTIPLIER));
                lastInteractionTime.current = Date.now();
            }
        });

        EventsOn('onForceOpenDashboard', () => {
            setIsDashboardOpen(true);
        });
    }, []);

    // --- THE UNIVERSAL POWER ENGINE LOOP ---
    useEffect(() => {
        const powerInterval = setInterval(() => {
            if (!SUPER_ENTITIES.includes(activeEntity)) return;

            const now = Date.now();
            const timeSinceLastAction = now - lastInteractionTime.current;
            
            // 1. Hold & Decay
            if (timeSinceLastAction > 120000) {
                powerRef.current = Math.max(0, powerRef.current - 5); 
            }

            // 2. Microphone DSP Injection 
            if (audioRef.current && settingsRef.current.enableMicInput) {
                const micData = audioRef.current.getScreamData();
                
                if (micData.isScreaming) {
                    powerRef.current = Math.min(5000, powerRef.current + (micData.intensity * 25));
                    lastInteractionTime.current = Date.now();
                    
                    if (visualRef.current) {
                        visualRef.current.update({
                            x: lastMouseRef.current.x,
                            y: lastMouseRef.current.y,
                            speed: micData.intensity * 5.0 
                        });
                    }
                }
            }

            // 3. Determine current form dynamically
            let achievedLevel = 0;
            let achievedForm = 'BASE';
            const thresholds = ENTITY_THRESHOLDS[activeEntity];
            
            if (thresholds) {
                for (let i = thresholds.length - 1; i >= 0; i--) {
                    if (powerRef.current >= thresholds[i].required) {
                        achievedLevel = thresholds[i].level;
                        achievedForm = thresholds[i].form;
                        break;
                    }
                }
            }

            // 4. Trigger Transformation
            if (currentRenderedForm.current !== achievedForm) {
                currentRenderedForm.current = achievedForm;
                if (visualRef.current) {
                    visualRef.current.setTargetForm(achievedForm);
                }
            }

            // 5. Save Global Progression
            if (achievedLevel > maxUnlockedRef.current) {
                maxUnlockedRef.current = achievedLevel;
                setUnlockedLevel(achievedLevel); 
                SavePowerLevel(achievedLevel);   
                setInterceptorMessage(`NEW RECORD: LEVEL ${achievedLevel} UNLOCKED!`);
                setTimeout(() => setInterceptorMessage(''), 4000);
            }

            // 6. Sync UI
            setPowerMeter(Math.floor(powerRef.current));

        }, 100);

        return () => clearInterval(powerInterval);
    }, [activeEntity]);

    // --- THE ASSET SWAPPER & RESET MANAGER ---
    useEffect(() => {
        if (!visualRef.current || !audioRef.current) return;

        powerRef.current = 0; 
        setPowerMeter(0);
        currentRenderedForm.current = 'BASE';
        setTargetForm('BASE');

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
        } else if (activeEntity === 'prince') {
            visualRef.current.loadActor(new PrinceFace());
            audioRef.current.loadSound(screamFile);
        } else if (activeEntity === 'beast') {
            visualRef.current.loadActor(new BeastFace());
            audioRef.current.loadSound(screamFile);
        } else if (activeEntity === 'berserker') {
            visualRef.current.loadActor(new BerserkerFace());
            audioRef.current.loadSound(screamFile);
        } else if (activeEntity === 'anomaly') {
            visualRef.current.loadActor(new AnomalyFace());
            audioRef.current.loadSound(screamFile); 
        }

        setTimeout(() => {
            if (visualRef.current) visualRef.current.setTargetForm('BASE');
        }, 50);
        
    }, [activeEntity]);

    useEffect(() => {
        if (visualRef.current) {
            setTimeout(() => {
                visualRef.current.setMode(isDashboardOpen ? 'preview' : 'pet');
            }, 10);
        }
    }, [isDashboardOpen]);

    useEffect(() => {
        const handleFocusLost = () => {
            if (!isPremium && SUPER_ENTITIES.includes(activeEntity)) {
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

        if (!isPremium && SUPER_ENTITIES.includes(activeEntity)) {
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

            const CHARGE_MIN_SPEED = 2.5; 
            const CHARGE_MULTIPLIER = 0.6; 

            if (!currentSettings.enableMicInput && speed > CHARGE_MIN_SPEED) {
                powerRef.current = Math.min(5000, powerRef.current + (speed * CHARGE_MULTIPLIER));
                lastInteractionTime.current = Date.now();
            }
        }
        
        lastMouseRef.current = { x: e.clientX, y: e.clientY, time: now };
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
                    powerMeter={powerMeter}
                    unlockedLevel={unlockedLevel}     
                />
            )}
        </div>
    );
}