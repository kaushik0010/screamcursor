// frontend/src/components/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { CheckForUpdates, PerformSelfUpdate, GetAppVersion } from '../../wailsjs/go/main/App.js';

const SUPER_ENTITIES = ['fighter', 'prince', 'beast', 'berserker', 'anomaly'];
const BONUS_ENTITIES = ['sage', 'tyrant']; // The classified DLC additions
const ALL_PREMIUM_ENTITIES = [...SUPER_ENTITIES, ...BONUS_ENTITIES];

const MAX_POWER_MAP = {
    fighter: 5000,
    prince: 5000,
    beast: 5000,
    berserker: 1500,
    anomaly: 3000,
    sage: 3000,
    tyrant: 5000
};

const FORM_MAP = {
    fighter: [
        { name: 'BASE', level: 0 },
        { name: 'GOLD', level: 1 },
        { name: 'DIVINE_RED', level: 2 },
        { name: 'DIVINE_BLUE', level: 3 },
        { name: 'AUTONOMOUS', level: 4 }
    ],
    prince: [
        { name: 'BASE', level: 0 },
        { name: 'GOLD', level: 1 },
        { name: 'DIVINE_BLUE', level: 3 },
        { name: 'ULTRA_EGO', level: 4 }
    ],
    beast: [
        { name: 'BASE', level: 0 },
        { name: 'GOLD', level: 2 },
        { name: 'ULTIMATE_WHITE', level: 4 }
    ],
    berserker: [
        { name: 'BASE', level: 0 },
        { name: 'LEGENDARY_GREEN', level: 1 }
    ],
    anomaly: [
        { name: 'BASE', level: 0 },
        { name: 'GOLD', level: 1 },
        { name: 'DIVINE_ROSE', level: 3 }
    ],
    sage: [
        { name: 'BASE', level: 0 },
        { name: 'FORGED_ORANGE', level: 3 }
    ],
    tyrant: [
        { name: 'BASE', level: 0 },
        { name: 'GOLDEN', level: 3 },
        { name: 'OBSIDIAN', level: 4 }
    ]
};

const InfoTooltip = ({ text }) => (
    <div className="tooltip-container">
        <span className="tooltip-icon">?</span>
        <span className="tooltip-text">{text}</span>
    </div>
);

export default function Dashboard({ 
    onClose, 
    settings, 
    setSettings, 
    activeEntity, 
    setActiveEntity,
    isPremium,
    interceptorMessage,
    onValidateKey,
    targetForm, 
    setTargetForm,
    powerMeter,
    unlockedLevel
}) {
    const [licenseInput, setLicenseInput] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    
    // OTA Updater State
    const [currentVersion, setCurrentVersion] = useState('v2.0.0');
    const [updateInfo, setUpdateInfo] = useState({ available: false, newVersion: '', releaseNotes: '' });
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateError, setUpdateError] = useState('');

    useEffect(() => {
        // Fetch current version for the title bar
        GetAppVersion().then(setCurrentVersion).catch(console.error);
        
        // Silently check GitHub for a new release
        CheckForUpdates().then(info => {
            if (info && info.available) {
                setUpdateInfo(info);
            }
        }).catch(err => console.error("OTA Check Failed:", err));
    }, []);

    const handleToggle = (key) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleKeySubmit = async () => {
        if (!licenseInput.trim()) return;
        setIsVerifying(true);
        await onValidateKey(licenseInput.trim());
        setIsVerifying(false);
        setLicenseInput('');
    };

    const handleEntitySelect = (entity) => {
        setActiveEntity(entity);
        setTargetForm('BASE');
    };

    const handlePerformUpdate = async () => {
        setIsUpdating(true);
        setUpdateError('');
        try {
            const success = await PerformSelfUpdate();
            if (!success) {
                setUpdateError('UPDATE FAILED: Manual download required.');
                setIsUpdating(false);
            }
        } catch (err) {
            setUpdateError(`SYS_ERROR: ${err.message}`);
            setIsUpdating(false);
        }
    };

    const maxPower = MAX_POWER_MAP[activeEntity] || 5000;
    const powerPercentage = Math.min(100, (powerMeter / maxPower) * 100);

    return (
        <>
            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 8px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #09090b; border-left: 1px solid #333; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #eab308; border-radius: 0px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #ef4444; }
                
                .tooltip-container { position: relative; display: inline-flex; align-items: center; margin-left: 8px; cursor: help; }
                .tooltip-icon { background: #333; color: #aaa; border-radius: 50%; width: 14px; height: 14px; display: inline-flex; justify-content: center; align-items: center; font-size: 10px; font-weight: bold; border: 1px solid #555; transition: background 0.2s, color 0.2s; }
                .tooltip-container:hover .tooltip-icon { background: #eab308; color: #000; border-color: #eab308; }
                .tooltip-text { visibility: hidden; width: 160px; background-color: #111; color: #e5e5e5; text-align: center; border: 1px solid #444; padding: 6px; position: absolute; z-index: 10; bottom: 150%; left: 50%; transform: translateX(-50%); font-size: 9px; line-height: 1.4; opacity: 0; transition: opacity 0.2s; pointer-events: none; box-shadow: 0px 4px 6px rgba(0,0,0,0.5); }
                .tooltip-container:hover .tooltip-text { visibility: visible; opacity: 1; }
                
                .bonus-glitch { animation: subtle-flicker 4s infinite; }
                @keyframes subtle-flicker {
                    0% { opacity: 1; } 50% { opacity: 0.8; } 52% { opacity: 1; } 54% { opacity: 0.6; } 56% { opacity: 1; } 100% { opacity: 1; }
                }
            `}</style>

            <div className="dashboard-overlay">
                <div className="title-bar" style={{ '--wails-drop-target': 'drop' }}>
                    <div className="title-drag-area" style={{ '--wails-draggable': 'drag' }}>
                        SCRM_CRSR // CONTROL_PANEL_{currentVersion.toUpperCase()}
                    </div>
                    <button className="close-btn" onClick={onClose}>✕</button>
                </div>

                <div className="dashboard-content">
                    <div className="settings-panel custom-scrollbar" style={{ overflowY: 'auto' }}>
                        
                        {updateInfo.available && (
                            <div style={{ padding: '15px', marginBottom: '20px', background: '#022c22', border: '1px solid #10b981' }}>
                                <h3 style={{ margin: '0 0 10px 0', color: '#10b981', fontSize: '12px', letterSpacing: '1px' }}>
                                    SYS_UPDATE // v{updateInfo.newVersion} DETECTED
                                </h3>
                                <div style={{ background: '#000', padding: '8px', marginBottom: '15px', fontSize: '10px', color: '#a7f3d0', whiteSpace: 'pre-wrap', maxHeight: '100px', overflowY: 'auto' }} className="custom-scrollbar">
                                    {updateInfo.releaseNotes || 'Critical system updates and feature expansions.'}
                                </div>
                                <button 
                                    onClick={handlePerformUpdate} disabled={isUpdating}
                                    style={{ width: '100%', padding: '10px', background: isUpdating ? '#064e3b' : '#10b981', color: '#000', border: 'none', cursor: isUpdating ? 'wait' : 'pointer', fontFamily: '"Space Mono", monospace', fontWeight: 'bold' }}
                                >
                                    {isUpdating ? 'DOWNLOADING & INSTALLING...' : 'INITIATE_UPDATE'}
                                </button>
                                {updateError && <div style={{ color: '#ef4444', fontSize: '10px', marginTop: '10px', fontWeight: 'bold' }}>{updateError}</div>}
                            </div>
                        )}

                        <h2 style={{marginTop: 0, marginBottom: '25px', fontSize: '14px', letterSpacing: '2px', color: '#e5e5e5'}}>PREFERENCES</h2>
                        
                        <div className="setting-row">
                            <label style={{ display: 'flex', alignItems: 'center' }}>Run in Background <InfoTooltip text="Keeps the app running invisibly in your system tray when you close this window." /></label>
                            <div className={`brutalist-switch ${settings.runInBackground ? 'on' : ''}`} onClick={() => handleToggle('runInBackground')} />
                        </div>
                        <div className="setting-row">
                            <label style={{ display: 'flex', alignItems: 'center' }}>Run on System Startup <InfoTooltip text="Automatically launches the app silently in the background every time you turn on your PC." /></label>
                            <div className={`brutalist-switch ${settings.autoStart ? 'on' : ''}`} onClick={() => handleToggle('autoStart')} />
                        </div>
                        <div className="setting-row">
                            <label style={{ display: 'flex', alignItems: 'center' }}>Mute Scream (Face Only) <InfoTooltip text="Disables the screaming sound effect. The 3D face will still react visually to your mouse." /></label>
                            <div className={`brutalist-switch ${settings.muteScream ? 'on' : ''}`} onClick={() => handleToggle('muteScream')} />
                        </div>
                        <div className="setting-row">
                            <label style={{ display: 'flex', alignItems: 'center' }}>Invisible Mode <InfoTooltip text="Hides the 3D face entirely. The app runs as a pure audio background process." /></label>
                            <div className={`brutalist-switch ${settings.invisibleMode ? 'on' : ''}`} onClick={() => handleToggle('invisibleMode')} />
                        </div>
                        <div className="setting-row">
                            <label style={{ display: 'flex', alignItems: 'center' }}>Boundless OS Tracking <InfoTooltip text="Reads mouse movements across your entire screen, not just inside the app window." /></label>
                            <div className={`brutalist-switch ${settings.boundlessTracking ? 'on' : ''}`} onClick={() => handleToggle('boundlessTracking')} />
                        </div>
                        <div className="setting-row" style={{ marginTop: '15px', borderTop: '1px solid #333', paddingTop: '15px' }}>
                            <label style={{ color: '#eab308', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>Enable Mic Input <InfoTooltip text="Uses your real microphone. Yell to charge your Ki meter instead of shaking the mouse!" /></label>
                            <div className={`brutalist-switch ${settings.enableMicInput ? 'on' : ''}`} onClick={() => handleToggle('enableMicInput')} />
                        </div>

                        <div className="license-panel" style={{ marginTop: '40px', padding: '15px', background: '#000', border: isPremium ? '1px solid #10b981' : '1px solid #ef4444' }}>
                            <h3 style={{ margin: '0 0 10px 0', fontSize: '12px', color: isPremium ? '#10b981' : '#ef4444', letterSpacing: '1px' }}>
                                {isPremium ? 'STATUS: PREMIUM UNLOCKED' : 'STATUS: FREE TIER'}
                            </h3>
                            {!isPremium && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <p style={{ margin: 0, fontSize: '11px', color: '#888' }}>Enter license key to unlock the Super Fighter Bundle.</p>
                                    <input 
                                        type="text" placeholder="XXX-YYY-ZZZ" value={licenseInput} onChange={(e) => setLicenseInput(e.target.value)}
                                        style={{ padding: '10px', background: '#09090b', border: '1px solid #333', color: '#e5e5e5', fontFamily: '"Space Mono", monospace', outline: 'none' }}
                                    />
                                    <button 
                                        onClick={handleKeySubmit} disabled={isVerifying || !licenseInput.trim()}
                                        style={{ padding: '10px', background: '#ef4444', color: '#000', border: 'none', cursor: 'pointer', opacity: isVerifying ? 0.5 : 1, fontFamily: '"Space Mono", monospace', fontWeight: 'bold' }}
                                    >
                                        {isVerifying ? 'VERIFYING...' : 'UNLOCK_PREMIUM'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="right-column custom-scrollbar" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', padding: '20px' }}>
                        
                        <div className="preview-hole" style={{ flexShrink: 0, height: '250px', marginBottom: '10px' }}>
                            [ CAM 01 : ENTITY_STREAM ]
                        </div>

                        {ALL_PREMIUM_ENTITIES.includes(activeEntity) && (
                            <div style={{ flexShrink: 0, marginBottom: '20px', padding: '10px', background: '#111', border: '2px solid #333' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '10px', color: '#eab308' }}>POWER_LEVEL // DETECTED</span>
                                    <span style={{ fontSize: '12px', color: '#fff', fontWeight: 'bold' }}>{powerMeter} / {maxPower}</span>
                                </div>
                                <div style={{ height: '12px', background: '#000', border: '1px solid #444', position: 'relative', overflow: 'hidden' }}>
                                    <div 
                                        style={{ 
                                            height: '100%', 
                                            width: `${powerPercentage}%`, 
                                            background: powerPercentage > 80 ? '#ef4444' : powerPercentage > 40 ? '#eab308' : '#10b981',
                                            transition: 'width 0.1s ease-out'
                                        }} 
                                    />
                                </div>
                            </div>
                        )}

                        <div className="carousel-panel custom-scrollbar" style={{ flexGrow: 1, overflowY: 'auto', paddingBottom: '60px', paddingRight: '10px' }}>
                            
                            {interceptorMessage && (
                                <div className="glitch-text" style={{ padding: '10px', marginBottom: '10px', background: '#ef4444', color: '#000', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                                    {interceptorMessage}
                                </div>
                            )}
                            
                            <h2 style={{ margin: '0 0 10px 0', fontSize: '10px', letterSpacing: '1px', color: '#888', borderBottom: '1px dashed #333', paddingBottom: '5px' }}>// FREE_TIER</h2>
                            <div className="entity-grid" style={{ marginBottom: '20px' }}>
                                {['base', 'demon', 'cat', 'woman'].map(e => (
                                    <button key={e} className={`entity-btn ${activeEntity === e ? 'active' : ''}`} onClick={() => handleEntitySelect(e)}>[ {e.toUpperCase()} ]</button>
                                ))}
                            </div>

                            <h2 style={{ margin: '0 0 10px 0', fontSize: '10px', letterSpacing: '1px', color: '#eab308', borderBottom: '1px dashed #eab308', paddingBottom: '5px' }}>// SUPER_ROSTER (DLC)</h2>
                            <div className="entity-grid" style={{ marginBottom: '20px' }}>
                                {SUPER_ENTITIES.map(entity => (
                                    <button 
                                        key={entity}
                                        className={`entity-btn ${activeEntity === entity ? 'active' : ''} ${!isPremium ? 'locked' : ''}`}
                                        onClick={() => handleEntitySelect(entity)}
                                        style={isPremium ? { borderColor: '#eab308', color: activeEntity === entity ? '#000' : '#eab308', background: activeEntity === entity ? '#eab308' : 'transparent' } : {}}
                                    >
                                        {!isPremium && '🔒 '}[ {entity.toUpperCase()} ]
                                    </button>
                                ))}
                            </div>

                            <h2 className="bonus-glitch" style={{ margin: '0 0 10px 0', fontSize: '10px', letterSpacing: '2px', color: '#9333ea', borderBottom: '1px dashed #9333ea', paddingBottom: '5px' }}>// CLASSIFIED_BONUS</h2>
                            <div className="entity-grid">
                                {BONUS_ENTITIES.map(entity => (
                                    <button 
                                        key={entity}
                                        className={`entity-btn ${activeEntity === entity ? 'active' : ''} ${!isPremium ? 'locked' : ''}`}
                                        onClick={() => handleEntitySelect(entity)}
                                        style={isPremium ? { borderColor: '#9333ea', color: activeEntity === entity ? '#fff' : '#9333ea', background: activeEntity === entity ? '#9333ea' : 'transparent' } : {}}
                                    >
                                        {!isPremium && '🔒 '}[ {entity.toUpperCase()} ]
                                    </button>
                                ))}
                            </div>

                            {ALL_PREMIUM_ENTITIES.includes(activeEntity) && (
                                <div style={{ marginTop: '20px', padding: '15px', background: '#111', border: '1px solid #333' }}>
                                    <h3 style={{ margin: '0 0 10px 0', fontSize: '10px', letterSpacing: '1px', color: '#e5e5e5' }}>TARGET_FORM_SELECTOR</h3>
                                    <p style={{ margin: '0 0 10px 0', fontSize: '9px', color: '#666' }}>Progress higher to unlock new states.</p>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                        {FORM_MAP[activeEntity].map(f => {
                                            const isLocked = f.level > unlockedLevel;
                                            return (
                                                <button 
                                                    key={f.name}
                                                    disabled={isLocked}
                                                    onClick={() => setTargetForm(f.name)}
                                                    style={{
                                                        background: isLocked ? '#222' : targetForm === f.name ? '#eab308' : '#000',
                                                        color: isLocked ? '#444' : targetForm === f.name ? '#000' : '#888',
                                                        border: `1px solid ${isLocked ? '#222' : targetForm === f.name ? '#eab308' : '#333'}`,
                                                        padding: '5px 10px',
                                                        fontSize: '9px',
                                                        fontFamily: '"Space Mono", monospace',
                                                        cursor: isLocked ? 'not-allowed' : 'pointer',
                                                        borderRadius: '0'
                                                    }}
                                                >
                                                    {isLocked ? '🔒 LOCKED' : f.name}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                            <div style={{ height: '40px' }} />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}