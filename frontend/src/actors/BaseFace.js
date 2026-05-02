import * as THREE from 'three';

export class BaseFace {
    constructor() {
        this.group = new THREE.Group();
        this.jaw = null;
        this.head = null;
        this.leftEye = null;
        this.rightEye = null;
        
        this.init();
    }

    init() {
        const material = new THREE.MeshStandardMaterial({ color: 0xeeeeee, flatShading: true });
        const darkMaterial = new THREE.MeshBasicMaterial({ color: 0x222222 });

        // -- Upper Head --
        const headGeo = new THREE.SphereGeometry(50, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
        this.head = new THREE.Mesh(headGeo, material);
        this.group.add(this.head);

        // -- Lower Jaw (The Unhinging Part) --
        const jawGeo = new THREE.SphereGeometry(50, 32, 16, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.5);
        this.jaw = new THREE.Mesh(jawGeo, material);
        // Pivot point for the jaw is at the back of the head
        this.jaw.position.set(0, 0, 0); 
        this.group.add(this.jaw);

        // -- Eyes --
        const eyeGeo = new THREE.SphereGeometry(6, 16, 16);
        this.leftEye = new THREE.Mesh(eyeGeo, darkMaterial);
        this.leftEye.position.set(-20, 15, 42);
        this.group.add(this.leftEye);

        this.rightEye = new THREE.Mesh(eyeGeo, darkMaterial);
        this.rightEye.position.set(20, 15, 42);
        this.group.add(this.rightEye);
    }

    // Called 60 times a second by the VisualEngine
    update(data) {
        this.updateRotation(data.x, data.y);
        this.animateScream(data.speed);
        this.idleBlink();
    }

    updateRotation(mouseX, mouseY) {
        const screenW = window.screen.width;
        const screenH = window.screen.height;

        const targetRotY = ((mouseX / screenW) * 1.0) - 0.5;
        const targetRotX = ((mouseY / screenH) * 0.8) - 0.4;

        this.group.rotation.y += (targetRotY - this.group.rotation.y) * 0.1;
        this.group.rotation.x += (targetRotX - this.group.rotation.x) * 0.1;
    }

    animateScream(speed) {
        // Thresholds for unhinging the jaw
        const minSpeed = 0.5;
        const maxSpeed = 5.0;
        
        let intensity = (speed - minSpeed) / (maxSpeed - minSpeed);
        intensity = Math.max(0, Math.min(1, intensity));

        // This is where the jaw WANTS to be based on current exact speed
        const targetRotation = intensity * 0.8; 

        // ASYMMETRICAL SMOOTHING MAGIC
        if (targetRotation > this.jaw.rotation.x) {
            // THE ATTACK: The mouse just sped up. 
            // Snap the jaw open very quickly (50% of the distance per frame)
            this.jaw.rotation.x += (targetRotation - this.jaw.rotation.x) * 0.5;
        } else {
            // THE DECAY: The mouse slowed down or stopped.
            // Let the jaw float closed very slowly (only 5% of the distance per frame)
            this.jaw.rotation.x += (targetRotation - this.jaw.rotation.x) * 0.05;
        }
    }

    idleBlink() {
        // Logic for randomized blinking can be added here
        if (Math.random() > 0.98) {
            this.leftEye.scale.y = 0.1;
            this.rightEye.scale.y = 0.1;
        } else {
            this.leftEye.scale.y += (1 - this.leftEye.scale.y) * 0.2;
            this.rightEye.scale.y += (1 - this.rightEye.scale.y) * 0.2;
        }
    }

    getMesh() {
        return this.group;
    }
}