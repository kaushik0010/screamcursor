// frontend/src/engines/AudioEngine.js
export class AudioEngine {
    constructor() {
        this.audio = new Audio();
        this.audio.loop = true;

        this.audioContext = null;
        this.analyser = null;
        this.microphone = null;
        this.dataArray = null;
        this.isMicActive = false;
    }

    loadSound(src) {
        this.audio.src = src;
    }

    setVolume(vol) {
        this.audio.volume = Math.max(0, Math.min(1, vol));
        if (vol > 0 && this.audio.paused) {
            this.audio.play().catch(e => console.log("Audio play blocked", e));
        } else if (vol === 0 && !this.audio.paused) {
            this.audio.pause();
        }
    }

    async enableMic() {
        if (this.isMicActive) return true;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            
            this.microphone = this.audioContext.createMediaStreamSource(stream);
            this.microphone.connect(this.analyser);
            
            // 512 fftSize = 256 frequency bins (~86Hz resolution per bin at 44.1kHz)
            this.analyser.fftSize = 512; 
            const bufferLength = this.analyser.frequencyBinCount;
            this.dataArray = new Uint8Array(bufferLength);
            
            this.isMicActive = true;
            return true;
        } catch (err) {
            console.error("Microphone access denied:", err);
            this.isMicActive = false;
            return false;
        }
    }

    disableMic() {
        if (!this.isMicActive) return;

        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close();
        }
        
        if (this.microphone && this.microphone.mediaStream) {
            this.microphone.mediaStream.getTracks().forEach(track => track.stop());
        }
        
        this.isMicActive = false;
    }

    // --- REVISED DSP TRUE SCREAM DETECTOR ---
    getScreamData() {
        if (!this.isMicActive || !this.analyser) {
            return { isScreaming: false, intensity: 0, rawVolume: 0, ratio: 0 };
        }
        
        this.analyser.getByteFrequencyData(this.dataArray);
        
        let totalEnergy = 0;
        let talkingEnergy = 0; // Low/Mid speech range (Bins 1-10, 10 bins total)
        let screamEnergy = 0;  // High harmonic vocal strain range (Bins 12-46, 35 bins total)
        
        const TALKING_BIN_COUNT = 10;
        const SCREAM_BIN_COUNT = 35;

        for (let i = 0; i < this.dataArray.length; i++) {
            const energy = this.dataArray[i];
            totalEnergy += energy;
            
            if (i >= 1 && i <= 10) {
                talkingEnergy += energy;
            } else if (i >= 12 && i <= 46) {
                screamEnergy += energy;
            }
        }
        
        // 1. Overall Volume Calculation
        const avgVolume = totalEnergy / this.dataArray.length;
        const normalizedVolume = Math.min(1.0, avgVolume / 100.0);
        
        // 2. High Volume Gate (35% Volume)
        // Ignores fans, typing, background music, and normal talking volume.
        const VOLUME_GATE = 0.25;   
        if (normalizedVolume < VOLUME_GATE) {
            return { isScreaming: false, intensity: 0, rawVolume: normalizedVolume, ratio: 0 };
        }

        // 3. Density Ratio Calculation (Average Energy per Bin)
        // Prevents broadband white noise (fans) from dominating high-frequency bins.
        const meanTalkingEnergy = talkingEnergy / TALKING_BIN_COUNT;
        const meanScreamEnergy = screamEnergy / SCREAM_BIN_COUNT;
        
        const screamRatio = meanScreamEnergy / (meanTalkingEnergy + 0.001);
        
        // True screams concentrate energy into high harmonics, yielding density ratios > 1.35
        const DENSITY_THRESHOLD = 1.2;
        const IS_SCREAMING = screamRatio > DENSITY_THRESHOLD;
        
        let screamIntensity = 0;
        if (IS_SCREAMING) {
            // Normalize intensity scaling from threshold up to max scream output
            screamIntensity = Math.min(1.0, (screamRatio - DENSITY_THRESHOLD) / 1.5);
        }
        
        return {
            isScreaming: IS_SCREAMING,
            intensity: screamIntensity,
            rawVolume: normalizedVolume,
            ratio: screamRatio
        };
    }
}