import React from 'react';

export default function Dashboard({ onClose, settings, setSettings, activeEntity, setActiveEntity }) {
    
    const handleToggle = (key) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
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
                </div>

                {/* Right Side: The Shape-Shifter & Carousel */}
                <div className="right-column">
                    <div className="preview-hole">
                        Live Preview Area
                    </div>

                    <div className="carousel-panel">
                        {/* UPDATED BUNDLE PRICING HEADER */}
                        <h2 style={{marginTop: 0, marginBottom: '10px', fontSize: '14px'}}>Premium: The Unhinged Bundle ($2)</h2>
                        
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
                                style={{ opacity: activeEntity === 'demon' ? 1 : 0.5 }}
                                onClick={() => setActiveEntity('demon')}
                            >
                                The Predator {activeEntity === 'demon' && '(Active)'}
                            </button>

                            {/* Cat: The Glitch */}
                            <button 
                                className="entity-btn" 
                                style={{ opacity: activeEntity === 'cat' ? 1 : 0.5 }}
                                onClick={() => setActiveEntity('cat')}
                            >
                                Glitch Cat {activeEntity === 'cat' && '(Active)'}
                            </button>

                            {/* Woman: The Toon Banshee */}
                            <button 
                                className="entity-btn" 
                                style={{ opacity: activeEntity === 'woman' ? 1 : 0.5 }}
                                onClick={() => setActiveEntity('woman')}
                            >
                                Toon Banshee {activeEntity === 'woman' && '(Active)'}
                            </button>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}