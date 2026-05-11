// frontend/src/components/Dashboard.jsx:
import React, { useState } from 'react';

export default function Dashboard({ 
    onClose, 
    settings, 
    setSettings, 
    activeEntity, 
    setActiveEntity,
    isPremium,
    interceptorMessage,
    onValidateKey 
}) {
    
    // --- LOCAL STATE FOR LICENSE INPUT ---
    const [licenseInput, setLicenseInput] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);

    const handleToggle = (key) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    // --- HANDLE KEY SUBMISSION ---
    const handleKeySubmit = async () => {
        if (!licenseInput.trim()) return;
        setIsVerifying(true);
        await onValidateKey(licenseInput.trim());
        setIsVerifying(false);
        setLicenseInput('');
    };

    return (
        <div className="dashboard-overlay">
            <div className="title-bar" style={{ '--wails-drop-target': 'drop' }}>
                <div className="title-drag-area" style={{ '--wails-draggable': 'drag' }}>
                    SCRM_CRSR // CONTROL_PANEL
                </div>
                <button className="close-btn" onClick={onClose}>✕</button>
            </div>

            <div className="dashboard-content">
                {/* Left Side: Settings */}
                <div className="settings-panel">
                    <h2 style={{marginTop: 0, marginBottom: '25px', fontSize: '14px', letterSpacing: '2px', color: '#e5e5e5'}}>PREFERENCES</h2>
                    
                    <div className="setting-row">
                        <label>Run in Background (System Tray)</label>
                        {/* THE NEW BRUTALIST SLIDING SWITCH */}
                        <div 
                            className={`brutalist-switch ${settings.runInBackground ? 'on' : ''}`}
                            onClick={() => handleToggle('runInBackground')}
                        />
                    </div>
                    <div className="setting-row">
                        <label>Mute Scream (Face Only)</label>
                        <div 
                            className={`brutalist-switch ${settings.muteScream ? 'on' : ''}`}
                            onClick={() => handleToggle('muteScream')}
                        />
                    </div>
                    <div className="setting-row">
                        <label>Invisible Mode (Scream Only)</label>
                        <div 
                            className={`brutalist-switch ${settings.invisibleMode ? 'on' : ''}`}
                            onClick={() => handleToggle('invisibleMode')}
                        />
                    </div>
                    <div className="setting-row">
                        <label>Boundless OS Tracking</label>
                        <div 
                            className={`brutalist-switch ${settings.boundlessTracking ? 'on' : ''}`}
                            onClick={() => handleToggle('boundlessTracking')}
                        />
                    </div>

                    {/* --- THE PAYWALL UI --- */}
                    <div className="license-panel" style={{ marginTop: '40px', padding: '15px', background: '#000', border: isPremium ? '1px solid #10b981' : '1px solid #ef4444' }}>
                        <h3 style={{ margin: '0 0 10px 0', fontSize: '12px', color: isPremium ? '#10b981' : '#ef4444', letterSpacing: '1px' }}>
                            {isPremium ? 'STATUS: PREMIUM UNLOCKED' : 'STATUS: FREE TIER'}
                        </h3>
                        
                        {!isPremium && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <p style={{ margin: 0, fontSize: '11px', color: '#888' }}>Enter license key to unlock the Unhinged Bundle.</p>
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

                {/* Right Side: The Shape-Shifter & Carousel */}
                <div className="right-column">
                    <div className="preview-hole">
                        [ CAM 01 : ENTITY PREVIEW ]
                    </div>

                    <div className="carousel-panel">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <h2 style={{ margin: 0, fontSize: '12px', letterSpacing: '1px', color: '#e5e5e5' }}>THE UNHINGED BUNDLE ($2)</h2>
                        </div>
                        
                        {/* --- THE INTERCEPTOR ERROR MESSAGE WITH GLITCH --- */}
                        {interceptorMessage && (
                            <div className="glitch-text" style={{ padding: '10px', marginBottom: '10px', background: '#ef4444', color: '#000', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                                {interceptorMessage}
                            </div>
                        )}
                        
                        <div className="entity-grid">
                            
                            {/* Base Face */}
                            <button 
                                className={`entity-btn ${activeEntity === 'base' ? 'active' : ''}`}
                                onClick={() => setActiveEntity('base')}
                            >
                                [ BASE_ENTITY ]
                            </button>

                            {/* Demon: The Predator */}
                            <button 
                                className={`entity-btn ${activeEntity === 'demon' ? 'active' : ''} ${!isPremium ? 'locked' : ''}`}
                                onClick={() => setActiveEntity('demon')}
                            >
                                {!isPremium && '🔒 '}[ THE_PREDATOR ]
                            </button>

                            {/* Cat: The Glitch */}
                            <button 
                                className={`entity-btn ${activeEntity === 'cat' ? 'active' : ''} ${!isPremium ? 'locked' : ''}`}
                                onClick={() => setActiveEntity('cat')}
                            >
                                {!isPremium && '🔒 '}[ GLITCH_CAT ]
                            </button>

                            {/* Woman: The Toon Banshee */}
                            <button 
                                className={`entity-btn ${activeEntity === 'woman' ? 'active' : ''} ${!isPremium ? 'locked' : ''}`}
                                onClick={() => setActiveEntity('woman')}
                            >
                                {!isPremium && '🔒 '}[ TOON_BANSHEE ]
                            </button>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}