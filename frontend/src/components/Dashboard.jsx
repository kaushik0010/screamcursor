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
    
    // --- NEW: LOCAL STATE FOR LICENSE INPUT ---
    const [licenseInput, setLicenseInput] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);

    const handleToggle = (key) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    // --- NEW: HANDLE KEY SUBMISSION ---
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
                    Scream Cursor - Control Panel
                </div>
                <button className="close-btn" onClick={onClose}>✕</button>
            </div>

            <div className="dashboard-content">
                {/* Left Side: Settings */}
                <div className="settings-panel">
                    <h2 style={{marginTop: 0, marginBottom: '20px', fontSize: '18px'}}>Preferences</h2>
                    
                    <div className="setting-row">
                        <label>Run in Background (System Tray)</label>
                        <input type="checkbox" checked={settings.runInBackground} onChange={() => handleToggle('runInBackground')} />
                    </div>
                    <div className="setting-row">
                        <label>Mute Scream (Face Only)</label>
                        <input type="checkbox" checked={settings.muteScream} onChange={() => handleToggle('muteScream')} />
                    </div>
                    <div className="setting-row">
                        <label>Invisible Mode (Scream Only)</label>
                        <input type="checkbox" checked={settings.invisibleMode} onChange={() => handleToggle('invisibleMode')} />
                    </div>
                    <div className="setting-row">
                        <label>Boundless OS Tracking</label>
                        <input type="checkbox" checked={settings.boundlessTracking} onChange={() => handleToggle('boundlessTracking')} />
                    </div>

                    {/* --- NEW: THE PAYWALL UI --- */}
                    <div className="license-panel" style={{ marginTop: '40px', padding: '15px', background: 'rgba(0,0,0,0.5)', border: isPremium ? '1px solid #4ade80' : '1px solid #ef4444' }}>
                        <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: isPremium ? '#4ade80' : '#ef4444' }}>
                            {isPremium ? 'STATUS: PREMIUM UNLOCKED' : 'STATUS: FREE TIER'}
                        </h3>
                        
                        {!isPremium && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <p style={{ margin: 0, fontSize: '12px', color: '#ccc' }}>Paste your license key to unlock the Unhinged Bundle.</p>
                                <input 
                                    type="text" 
                                    placeholder="XXX-YYY-ZZZ" 
                                    value={licenseInput}
                                    onChange={(e) => setLicenseInput(e.target.value)}
                                    style={{ padding: '8px', background: '#222', border: '1px solid #444', color: '#fff' }}
                                />
                                <button 
                                    onClick={handleKeySubmit}
                                    disabled={isVerifying || !licenseInput.trim()}
                                    style={{ padding: '8px', background: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer', opacity: isVerifying ? 0.5 : 1 }}
                                >
                                    {isVerifying ? 'VERIFYING...' : 'UNLOCK PREMIUM'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Side: The Shape-Shifter & Carousel */}
                <div className="right-column">
                    <div className="preview-hole">
                        Live Preview Area
                    </div>

                    <div className="carousel-panel">
                        {/* UPDATED BUNDLE PRICING HEADER */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <h2 style={{ margin: 0, fontSize: '14px' }}>Premium: The Unhinged Bundle ($2)</h2>
                        </div>
                        
                        {/* --- NEW: THE INTERCEPTOR ERROR MESSAGE --- */}
                        {interceptorMessage && (
                            <div style={{ padding: '8px', marginBottom: '10px', background: '#ef4444', color: '#fff', fontSize: '12px', fontWeight: 'bold', textAlign: 'center', animation: 'glitch 0.2s infinite' }}>
                                {interceptorMessage}
                            </div>
                        )}
                        
                        <div className="entity-grid">
                            
                            {/* Base Face */}
                            <button 
                                className="entity-btn" 
                                style={{ opacity: activeEntity === 'base' ? 1 : 0.5 }}
                                onClick={() => setActiveEntity('base')}
                            >
                                Base Face {activeEntity === 'base' && '(Active)'}
                            </button>

                            {/* Demon: The Predator */}
                            <button 
                                className="entity-btn" 
                                style={{ 
                                    opacity: activeEntity === 'demon' ? 1 : 0.5,
                                    border: !isPremium ? '1px dashed #ef4444' : ''
                                }}
                                onClick={() => setActiveEntity('demon')}
                            >
                                {!isPremium && '🔒 '}The Predator {activeEntity === 'demon' && '(Active)'}
                            </button>

                            {/* Cat: The Glitch */}
                            <button 
                                className="entity-btn" 
                                style={{ 
                                    opacity: activeEntity === 'cat' ? 1 : 0.5,
                                    border: !isPremium ? '1px dashed #ef4444' : ''
                                }}
                                onClick={() => setActiveEntity('cat')}
                            >
                                {!isPremium && '🔒 '}Glitch Cat {activeEntity === 'cat' && '(Active)'}
                            </button>

                            {/* Woman: The Toon Banshee */}
                            <button 
                                className="entity-btn" 
                                style={{ 
                                    opacity: activeEntity === 'woman' ? 1 : 0.5,
                                    border: !isPremium ? '1px dashed #ef4444' : ''
                                }}
                                onClick={() => setActiveEntity('woman')}
                            >
                                {!isPremium && '🔒 '}Toon Banshee {activeEntity === 'woman' && '(Active)'}
                            </button>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}