// frontend/src/components/Dashboard.jsx
import React, { useState } from 'react';

const SUPER_ENTITIES = ['fighter', 'prince', 'beast', 'berserker', 'anomaly'];

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
        { name: 'GOLD', level: 1 },
        { name: 'ULTIMATE_WHITE', level: 4 }
    ],
    berserker: [
        { name: 'BASE', level: 0 },
        { name: 'LEGENDARY_GREEN', level: 1 }
    ],
    anomaly: [
        { name: 'BASE', level: 0 },
        { name: 'DIVINE_ROSE', level: 3 }
    ]
};

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

    const powerPercentage = (powerMeter / 5000) * 100;

    return (
        <div className="dashboard-overlay">
            <div className="title-bar" style={{ '--wails-drop-target': 'drop' }}>
                <div className="title-drag-area" style={{ '--wails-draggable': 'drag' }}>
                    SCRM_CRSR // CONTROL_PANEL_V2.0
                </div>
                <button className="close-btn" onClick={onClose}>✕</button>
            </div>

            <div className="dashboard-content">
                {/* Left Side: Settings & Paywall */}
                <div className="settings-panel">
                    <h2 style={{marginTop: 0, marginBottom: '25px', fontSize: '14px', letterSpacing: '2px', color: '#e5e5e5'}}>PREFERENCES</h2>
                    
                    <div className="setting-row">
                        <label>Run in Background (System Tray)</label>
                        <div className={`brutalist-switch ${settings.runInBackground ? 'on' : ''}`} onClick={() => handleToggle('runInBackground')} />
                    </div>
                    <div className="setting-row">
                        <label>Mute Scream (Face Only)</label>
                        <div className={`brutalist-switch ${settings.muteScream ? 'on' : ''}`} onClick={() => handleToggle('muteScream')} />
                    </div>
                    <div className="setting-row">
                        <label>Invisible Mode (Scream Only)</label>
                        <div className={`brutalist-switch ${settings.invisibleMode ? 'on' : ''}`} onClick={() => handleToggle('invisibleMode')} />
                    </div>
                    <div className="setting-row">
                        <label>Boundless OS Tracking</label>
                        <div className={`brutalist-switch ${settings.boundlessTracking ? 'on' : ''}`} onClick={() => handleToggle('boundlessTracking')} />
                    </div>

                    <div className="license-panel" style={{ marginTop: '40px', padding: '15px', background: '#000', border: isPremium ? '1px solid #10b981' : '1px solid #ef4444' }}>
                        <h3 style={{ margin: '0 0 10px 0', fontSize: '12px', color: isPremium ? '#10b981' : '#ef4444', letterSpacing: '1px' }}>
                            {isPremium ? 'STATUS: PREMIUM UNLOCKED' : 'STATUS: FREE TIER'}
                        </h3>
                        {!isPremium && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <p style={{ margin: 0, fontSize: '11px', color: '#888' }}>Enter license key to unlock the Super Fighter Bundle.</p>
                                <input 
                                    type="text" 
                                    placeholder="XXX-YYY-ZZZ" 
                                    value={licenseInput}
                                    onChange={(e) => setLicenseInput(e.target.value)}
                                    style={{ padding: '10px', background: '#09090b', border: '1px solid #333', color: '#e5e5e5', fontFamily: '"Space Mono", monospace', outline: 'none' }}
                                />
                                <button 
                                    onClick={handleKeySubmit}
                                    disabled={isVerifying || !licenseInput.trim()}
                                    style={{ padding: '10px', background: '#ef4444', color: '#000', border: 'none', cursor: 'pointer', opacity: isVerifying ? 0.5 : 1, fontFamily: '"Space Mono", monospace', fontWeight: 'bold' }}
                                >
                                    {isVerifying ? 'VERIFYING...' : 'UNLOCK_PREMIUM'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Side: Preview, Meter & Roster */}
                <div className="right-column" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', padding: '20px' }}>
                    
                    <div className="preview-hole" style={{ flexShrink: 0, height: '250px', marginBottom: '10px' }}>
                        [ CAM 01 : ENTITY_STREAM ]
                    </div>

                    {/* --- THE FIX: CONDITIONALLY RENDER THE POWER METER --- */}
                    {SUPER_ENTITIES.includes(activeEntity) && (
                        <div style={{ flexShrink: 0, marginBottom: '20px', padding: '10px', background: '#111', border: '2px solid #333' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ fontSize: '10px', color: '#eab308' }}>POWER_LEVEL // DETECTED</span>
                                <span style={{ fontSize: '12px', color: '#fff', fontWeight: 'bold' }}>{powerMeter} / 5000</span>
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

                    <div className="carousel-panel" style={{ flexGrow: 1, overflowY: 'auto', paddingBottom: '60px', paddingRight: '10px' }}>
                        
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
                        <div className="entity-grid">
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

                        {SUPER_ENTITIES.includes(activeEntity) && (
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
    );
}