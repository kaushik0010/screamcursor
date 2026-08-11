// frontend/src/App.jsx:
import { useEffect, useRef, useState } from 'react';
import { VisualEngine } from './engines/VisualEngine.js';
import { AudioEngine } from './engines/AudioEngine.js';
import { BaseFace } from './actors/BaseFace.js';
import screamFile from './assets/sounds/scream-man.mp3';
import { EventsOn, WindowSetSize, WindowCenter, WindowSetPosition, WindowHide, WindowShow } from '../wailsjs/runtime/runtime';

import { ToggleBoundlessMode, CheckSuperBundleStatus, ValidateLicense } from '../wailsjs/go/main/App.js';

import Dashboard from './components/Dashboard';
import { DemonFace } from './actors/DemonFace.js';
import demonScreamFile from './assets/sounds/scream-demon.mp3'; 
import { CatFace } from './actors/CatFace.js';
import catScreamFile from './assets/sounds/scream-frantic-cat.mp3';
import { WomanFace } from './actors/WomanFace.js';
import womanScreamFile from './assets/sounds/scream-woman.mp3';
import { FighterFace } from './actors/warriors/FighterFace.js';

// --- PHASE 3: THE FIGHTER IMPORT ---

export default function App() {
    const canvasRef = useRef(null);
    const engineInitialized = useRef(false);
    
    const audioRef = useRef(null);
    const visualRef = useRef(null);

    const lastMouseRef = useRef({ x: 0, y: 0, time: performance.now() });
    const isTransitioning = useRef(false);
    
    const [isDashboardOpen, setIsDashboardOpen] = useState(true);
    const [activeEntity, setActiveEntity] = useState('base'); 
    
    // --- PHASE 3: TARGET FORM STATE ---
    const [targetForm, setTargetForm] = useState('BASE');

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
        CheckSuperBundleStatus().then(status => {
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

        EventsOn('onForceOpenDashboard', () => {
            setIsDashboardOpen(true);
        });
    }, []);

    // --- ASSET SWAPPER ---
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
            // --- PHASE 3: LOAD THE FIGHTER ---
            visualRef.current.loadActor(new FighterFace());
            audioRef.current.loadSound(screamFile);
            
            // Give the engine a tiny 50ms buffer to load the mesh before passing the state
            setTimeout(() => {
                if (visualRef.current) visualRef.current.setTargetForm(targetForm);
            }, 50);
        }
    }, [activeEntity]);

    // --- PHASE 3: THE TRANSFORMATION TRIGGER ---
    useEffect(() => {
        if (visualRef.current) {
            visualRef.current.setTargetForm(targetForm);
        }
    }, [targetForm]);

    useEffect(() => {
        if (visualRef.current) {
            setTimeout(() => {
                visualRef.current.setMode(isDashboardOpen ? 'preview' : 'pet');
            }, 10);
        }
    }, [isDashboardOpen]);

    // --- PROTECT THE FULL SUPER ROSTER ---
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
        WindowSetSize(900, 500); 
            
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
                />
            )}
        </div>
    );
}