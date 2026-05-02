export class AudioEngine {
    constructor() {
        // Initialize the Web Audio Context
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        
        // The GainNode acts as our digital volume knob
        this.gainNode = this.ctx.createGain();
        this.gainNode.connect(this.ctx.destination);
        
        // Start completely silent
        this.gainNode.gain.value = 0; 
        
        this.buffer = null;
        this.source = null;
        this.isPlaying = false;
    }

    // Loads the .mp3 file directly into raw computer memory
    async loadSound(filePath) {
        try {
            const response = await fetch(filePath);
            const arrayBuffer = await response.arrayBuffer();
            this.buffer = await this.ctx.decodeAudioData(arrayBuffer);
            console.log(`Loaded sound: ${filePath}`);
        } catch (error) {
            console.error("Failed to load audio:", error);
        }
    }

    // Starts the seamless loop
    play() {
        if (this.isPlaying || !this.buffer) return;
        
        // Browsers sometimes suspend audio until user interaction, this wakes it up
        if (this.ctx.state === 'suspended') this.ctx.resume();

        this.source = this.ctx.createBufferSource();
        this.source.buffer = this.buffer;
        this.source.loop = true; // Perfect, gapless looping

        this.source.connect(this.gainNode);
        this.source.start(0);
        this.isPlaying = true;
    }

    // Smoothly slides the volume to match the mouse speed
    setVolume(targetVolume) {
        if (!this.isPlaying) this.play();

        // Ensure volume is strictly between 0 and 1
        const clampedVolume = Math.max(0, Math.min(1, targetVolume));

        // setTargetAtTime exponentially smooths the jump over 50 milliseconds
        // This is the magic line that completely removes the "zipper" distortion
        this.gainNode.gain.setTargetAtTime(clampedVolume, this.ctx.currentTime, 0.05);
    }
}