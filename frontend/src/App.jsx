// frontend/src/App.jsx
import { useEffect, useRef, useState } from 'react';
import { VisualEngine } from './engines/VisualEngine.js';
import { AudioEngine } from './engines/AudioEngine.js';
import { BaseFace } from './actors/BaseFace.js';
import screamFile from './assets/sounds/scream-man.mp3';
import { EventsOn, WindowSetSize, WindowCenter, WindowSetPosition, WindowHide, WindowShow, Quit } from '../wailsjs/runtime/runtime';

import { ToggleBoundlessMode, ToggleAutoStart, CheckSuperBundleStatus, ValidateLicense, GetHighestPowerLevel, SavePowerLevel } from '../wailsjs/go/main/App.js';

import Dashboard from './components/Dashboard.jsx';
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
import warriorScreamFile from './assets/sounds/scream-warrior.mp3';

// --- PHASE 9: IMPORTING THE CLASSIFIED BONUS ENTITIES ---
import { SageFace } from './actors/warriors/SageFace.js';
import { TyrantFace } from './actors/warriors/TyrantFace.js';
import sageScreamFile from './assets/sounds/scream-sage.mp3'; 
import tyrantScreamFile from './assets/sounds/scream-tyrant.mp3'; 

const SUPER_ENTITIES = ['fighter', 'prince', 'beast', 'berserker', 'anomaly', 'sage', 'tyrant'];

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
    ],
    sage: [
        { level: 0, form: 'BASE', required: 0 },
        { level: 3, form: 'FORGED_ORANGE', required: 3000 }
    ],
    tyrant: [
        { level: 0, form: 'BASE', required: 0 },
        { level: 3, form: 'GOLDEN', required: 3000 },
        { level: 4, form: 'OBSIDIAN', required: 5000 }
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
        autoStart: false,
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
            
            if (timeSinceLastAction > 120000) {
                powerRef.current = Math.max(0, powerRef.current - 5); 
            }

            if (audioRef.current && settingsRef.current.enableMicInput) {
                const micData = audioRef.current.getScreamData();
                
                if (micData.isScreaming) {
                    powerRef.current = Math.min(5000, powerRef.current + (micData.intensity * 45));
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

            if (currentRenderedForm.current !== achievedForm) {
                currentRenderedForm.current = achievedForm;
                if (visualRef.current) {
                    visualRef.current.setTargetForm(achievedForm);
                }
            }

            if (achievedLevel > maxUnlockedRef.current) {
                maxUnlockedRef.current = achievedLevel;
                setUnlockedLevel(achievedLevel); 
                SavePowerLevel(achievedLevel);   
                setInterceptorMessage(`NEW RECORD: LEVEL ${achievedLevel} UNLOCKED!`);
                setTimeout(() => setInterceptorMessage(''), 4000);
            }

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
            audioRef.current.loadSound(warriorScreamFile);
        } else if (activeEntity === 'prince') {
            visualRef.current.loadActor(new PrinceFace());
            audioRef.current.loadSound(warriorScreamFile);
        } else if (activeEntity === 'beast') {
            visualRef.current.loadActor(new BeastFace());
            audioRef.current.loadSound(warriorScreamFile);
        } else if (activeEntity === 'berserker') {
            visualRef.current.loadActor(new BerserkerFace());
            audioRef.current.loadSound(warriorScreamFile);
        } else if (activeEntity === 'anomaly') {
            visualRef.current.loadActor(new AnomalyFace());
            audioRef.current.loadSound(warriorScreamFile); 
        } else if (activeEntity === 'sage') {
            visualRef.current.loadActor(new SageFace());
            audioRef.current.loadSound(sageScreamFile); 
        } else if (activeEntity === 'tyrant') {
            visualRef.current.loadActor(new TyrantFace());
            audioRef.current.loadSound(tyrantScreamFile); 
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

        if (!settingsRef.current.runInBackground) {
            Quit();
            return;
        }

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

    // --- HUD HOTKEYS ---
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Only trigger if dashboard is closed (Pet Mode)
            if (!isDashboardOpen && e.key.toLowerCase() === 'm') {
                setSettings(prev => ({ ...prev, enableMicInput: !prev.enableMicInput }));
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isDashboardOpen]);

    // --- HUD CALCULATIONS ---
    const thresholds = ENTITY_THRESHOLDS[activeEntity];
    let maxPower = 5000;
    let nextThreshold = null;
    let hypeText = '';

    if (thresholds) {
        maxPower = thresholds[thresholds.length - 1].required || 5000;
        for (let i = 0; i < thresholds.length; i++) {
            if (thresholds[i].required > powerMeter) {
                nextThreshold = thresholds[i].required;
                break;
            }
        }
    }

    const powerPercentage = Math.min(100, (powerMeter / maxPower) * 100);

    if (nextThreshold) {
        const gap = nextThreshold - powerMeter;
        if (gap <= 200 && gap > 0) {
            hypeText = 'LIMIT BREAK IMMINENT!';
        } else if (gap <= 500 && gap > 0) {
            hypeText = 'VERY CLOSE...';
        } else if (gap <= 1000 && gap > 0) {
            hypeText = 'LITTLE MORE!';
        }
    } else if (SUPER_ENTITIES.includes(activeEntity)) {
        hypeText = 'MAX POWER!';
    }

    return (
        <div 
            id="app-container" 
            onMouseMove={handleWebMouseMove} 
            onMouseLeave={handleWebMouseLeave}
            style={{ width: '100vw', height: '100vh', position: 'relative' }}
        >
            <style>{`
                @keyframes hud-flicker {
                    0% { opacity: 1; } 50% { opacity: 0.8; } 52% { opacity: 1; } 54% { opacity: 0.5; } 56% { opacity: 1; } 100% { opacity: 1; }
                }
            `}</style>
            
            <div 
                ref={canvasRef} 
                onDoubleClick={handleOpenDashboard}
                className={isDashboardOpen ? "canvas-preview-mode" : "canvas-pet-mode"}
                style={{ 
                    display: settings.invisibleMode ? 'none' : 'block',
                    '--wails-draggable': isDashboardOpen ? 'none' : 'drag' 
                }} 
            />

            {/* --- DESKTOP PET HUD OVERLAY --- */}
            {!isDashboardOpen && SUPER_ENTITIES.includes(activeEntity) && !settings.invisibleMode && (
                <div style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    pointerEvents: 'none', 
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '20px',
                    zIndex: 10
                }}>
                    {/* Top-Right: Quick Mic Indicator */}
                    <div style={{ alignSelf: 'flex-end' }}>
                        <div
                            style={{
                                background: settings.enableMicInput ? '#ef4444' : 'rgba(17, 17, 17, 0.7)',
                                color: settings.enableMicInput ? '#fff' : '#aaa',
                                border: `1px solid ${settings.enableMicInput ? '#ef4444' : '#444'}`,
                                padding: '6px 12px',
                                fontFamily: '"Space Mono", monospace',
                                fontSize: '10px',
                                fontWeight: 'bold',
                                backdropFilter: 'blur(4px)',
                                transition: 'all 0.2s',
                                userSelect: 'none'
                            }}
                        >
                            [ MIC: {settings.enableMicInput ? 'ON' : 'OFF'} (Press M) ]
                        </div>
                    </div>

                    {/* Bottom-Right: Power Meter & Hype Text */}
                    <div style={{ alignSelf: 'flex-end', display: 'flex', alignItems: 'flex-end', gap: '15px' }}>
                        <div style={{
                            color: hypeText === 'LIMIT BREAK IMMINENT!' || hypeText === 'MAX POWER!' ? '#ef4444' : '#eab308',
                            fontFamily: '"Space Mono", monospace',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            textShadow: '0 2px 4px rgba(0,0,0,1)',
                            textTransform: 'uppercase',
                            marginBottom: '4px',
                            animation: hypeText ? 'hud-flicker 2s infinite' : 'none'
                        }}>
                            {hypeText}
                        </div>

                        {/* Vertical Meter */}
                        <div style={{
                            width: '10px',
                            height: '140px',
                            background: 'rgba(0,0,0,0.6)',
                            border: '1px solid #444',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'flex-end',
                            backdropFilter: 'blur(2px)'
                        }}>
                            <div style={{
                                width: '100%',
                                height: `${powerPercentage}%`,
                                background: powerPercentage > 80 ? '#ef4444' : powerPercentage > 40 ? '#eab308' : '#10b981',
                                transition: 'height 0.1s ease-out'
                            }} />
                        </div>
                    </div>
                </div>
            )}
            
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