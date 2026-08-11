// frontend/src/components/Dashboard.jsx
import React, { useState } from 'react';

// --- PHASE 2: LORE & PROGRESSION MAPS ---
const SUPER_ENTITIES = ['fighter', 'prince', 'beast', 'berserker', 'anomaly'];

const FORM_MAP = {
    fighter: ['BASE', 'GOLD', 'DIVINE_RED', 'DIVINE_BLUE', 'AUTONOMOUS'],
    prince: ['BASE', 'GOLD', 'DIVINE_BLUE', 'ULTRA_EGO'],
    beast: ['BASE', 'GOLD', 'ULTIMATE_WHITE'],
    berserker: ['BASE', 'LEGENDARY_GREEN'],
    anomaly: ['BASE', 'DIVINE_ROSE']
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
    // Defaulted to prevent crashes before App.jsx is updated
    targetForm = 'BASE', 
    setTargetForm = () => {} 
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

    // --- PHASE 2: SMART ENTITY SWITCHER ---
    const handleEntitySelect = (entity) => {
        setActiveEntity(entity);
        // Automatically reset their target form to BASE when swapping characters
        if (SUPER_ENTITIES.includes(entity)) {
            setTargetForm('BASE');
        }
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
                {/* Left Side: Settings & Paywall */}
                <div className="settings-panel">
                    <h2 style={{marginTop: 0, marginBottom: '25px', fontSize: '14px', letterSpacing: '2px', color: '#e5e5e5'}}>PREFERENCES</h2>
                    
                    <div className="setting-row">
                        <label>Run in Background (System Tray)</label>
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

                {/* Right Side: The Shape-Shifter & Carousel */}
                <div className="right-column" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', padding: '20px' }}>
                    
                    {/* FIXED HEADER: Camera feed never moves */}
                    <div className="preview-hole" style={{ flexShrink: 0, height: '250px', marginBottom: '20px' }}>
                        [ CAM 01 : ENTITY PREVIEW ]
                    </div>

                    {/* SCROLLABLE DATABASE: Only the buttons scroll */}
                    <div className="carousel-panel" style={{ flexGrow: 1, overflowY: 'auto', paddingBottom: '20px', paddingRight: '10px' }}>
                        
                        {interceptorMessage && (
                            <div className="glitch-text" style={{ padding: '10px', marginBottom: '10px', background: '#ef4444', color: '#000', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                                {interceptorMessage}
                            </div>
                        )}
                        
                        {/* --- FREE TIER --- */}
                        <h2 style={{ margin: '0 0 10px 0', fontSize: '10px', letterSpacing: '1px', color: '#888', borderBottom: '1px dashed #333', paddingBottom: '5px' }}>
                            // FREE_TIER
                        </h2>
                        <div className="entity-grid" style={{ marginBottom: '20px' }}>
                            <button className={`entity-btn ${activeEntity === 'base' ? 'active' : ''}`} onClick={() => handleEntitySelect('base')}>[ BASE_ENTITY ]</button>
                            <button className={`entity-btn ${activeEntity === 'demon' ? 'active' : ''}`} onClick={() => handleEntitySelect('demon')}>[ THE_PREDATOR ]</button>
                            <button className={`entity-btn ${activeEntity === 'cat' ? 'active' : ''}`} onClick={() => handleEntitySelect('cat')}>[ GLITCH_CAT ]</button>
                            <button className={`entity-btn ${activeEntity === 'woman' ? 'active' : ''}`} onClick={() => handleEntitySelect('woman')}>[ TOON_BANSHEE ]</button>
                        </div>

                        {/* --- SUPER ROSTER DLC --- */}
                        <h2 style={{ margin: '0 0 10px 0', fontSize: '10px', letterSpacing: '1px', color: '#eab308', borderBottom: '1px dashed #eab308', paddingBottom: '5px' }}>
                            // THE_SUPER_ROSTER (DLC)
                        </h2>
                        <div className="entity-grid">
                            {SUPER_ENTITIES.map(entity => (
                                <button 
                                    key={entity}
                                    className={`entity-btn ${activeEntity === entity ? 'active' : ''} ${!isPremium ? 'locked' : ''}`}
                                    onClick={() => handleEntitySelect(entity)}
                                    style={isPremium ? { borderColor: '#eab308', color: activeEntity === entity ? '#000' : '#eab308', background: activeEntity === entity ? '#eab308' : 'transparent' } : {}}
                                >
                                    {!isPremium && '🔒 '}[ THE_{entity.toUpperCase()} ]
                                </button>
                            ))}
                        </div>

                        {/* --- PHASE 2: TARGET FORM SUB-MENU --- */}
                        {SUPER_ENTITIES.includes(activeEntity) && (
                            <div style={{ marginTop: '20px', padding: '15px', background: '#111', border: '1px solid #333' }}>
                                <h3 style={{ margin: '0 0 10px 0', fontSize: '10px', letterSpacing: '1px', color: '#e5e5e5' }}>
                                    TARGET_FORM_SELECTOR
                                </h3>
                                <p style={{ margin: '0 0 10px 0', fontSize: '9px', color: '#666' }}>Select highest unlocked state to trigger.</p>
                                
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                    {FORM_MAP[activeEntity].map(form => (
                                        <button 
                                            key={form}
                                            onClick={() => setTargetForm(form)}
                                            style={{
                                                background: targetForm === form ? '#eab308' : '#000',
                                                color: targetForm === form ? '#000' : '#888',
                                                border: `1px solid ${targetForm === form ? '#eab308' : '#333'}`,
                                                padding: '5px 10px',
                                                fontSize: '9px',
                                                fontFamily: '"Space Mono", monospace',
                                                cursor: 'pointer',
                                                borderRadius: '0'
                                            }}
                                        >
                                            {form}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
}