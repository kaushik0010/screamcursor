import * as THREE from 'three';

export class BaseFace {
    constructor() {
        this.group = new THREE.Group();
        this.stressMeter = 0;
        
        this.init();
    }

    init() {
        // 1. The Head (Slightly squashed sphere to give him a blocky, normal-guy jaw)
        const headGeo = new THREE.SphereGeometry(35, 16, 16);
        this.baseColor = new THREE.Color(0xffccaa); // Exhausted pale peach
        this.stressColor = new THREE.Color(0xff2200); // Boiling tomato red
        
        this.headMat = new THREE.MeshStandardMaterial({ 
            color: this.baseColor, 
            roughness: 0.8,
            flatShading: true 
        });
        
        this.head = new THREE.Mesh(headGeo, this.headMat);
        this.head.scale.set(0.95, 1, 0.95); // Squashes the sides slightly
        this.group.add(this.head);

        // 2. The Exhausted Eyes
        const eyeGeo = new THREE.SphereGeometry(6, 16, 16);
        const pupilGeo = new THREE.SphereGeometry(2.5, 16, 16);
        
        const scleraMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const pupilMat = new THREE.MeshBasicMaterial({ color: 0x000000 });

        // Left Eye Group
        this.leftEyeGroup = new THREE.Group();
        const leftSclera = new THREE.Mesh(eyeGeo, scleraMat);
        const leftPupil = new THREE.Mesh(pupilGeo, pupilMat);
        leftPupil.position.set(0, 0, 4.5); // Push pupil to the front of the eye
        
        this.leftEyeGroup.add(leftSclera);
        this.leftEyeGroup.add(leftPupil);
        this.leftEyeGroup.position.set(-14, 12, 30);
        this.group.add(this.leftEyeGroup);

        // Right Eye Group
        this.rightEyeGroup = new THREE.Group();
        const rightSclera = new THREE.Mesh(eyeGeo, scleraMat);
        const rightPupil = new THREE.Mesh(pupilGeo, pupilMat);
        rightPupil.position.set(0, 0, 4.5);
        
        this.rightEyeGroup.add(rightSclera);
        this.rightEyeGroup.add(rightPupil);
        this.rightEyeGroup.position.set(14, 12, 30);
        this.group.add(this.rightEyeGroup);

        // 3. The Heavy Brows (The key to his tired/angry expression)
        const browGeo = new THREE.BoxGeometry(14, 3, 4);
        const browMat = new THREE.MeshStandardMaterial({ color: 0x443322, flatShading: true });

        this.leftBrow = new THREE.Mesh(browGeo, browMat);
        // Positioned low over the eye to look exhausted
        this.leftBrow.position.set(-14, 16, 31); 
        this.leftBrow.rotation.z = 0.1; // Slight sad tilt
        this.group.add(this.leftBrow);

        this.rightBrow = new THREE.Mesh(browGeo, browMat);
        this.rightBrow.position.set(14, 16, 31);
        this.rightBrow.rotation.z = -0.1; // Slight sad tilt
        this.group.add(this.rightBrow);

        // 4. The Suppressed Mouth (Starts as a thin, tight horizontal line)
        const mouthGeo = new THREE.BoxGeometry(16, 1.5, 3);
        const mouthMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
        this.mouth = new THREE.Mesh(mouthGeo, mouthMat);
        this.mouth.position.set(0, -10, 33.5);
        this.group.add(this.mouth);
    }

    getMesh() {
        return this.group;
    }

    update(data) {
        this.updateRotation(data.x, data.y);
        this.animateStress(data.speed);
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

    animateStress(speed) {
        // Stress builds up based on mouse speed
        const targetStress = Math.min(1, speed / 4.0); 

        if (targetStress > this.stressMeter) {
            this.stressMeter += (targetStress - this.stressMeter) * 0.15; // Snaps quickly
        } else {
            this.stressMeter += (targetStress - this.stressMeter) * 0.05; // Calms down slowly
        }

        const s = this.stressMeter;

        // 1. TOMATO FLUSH: Skin turns violently red
        this.headMat.color.lerpColors(this.baseColor, this.stressColor, s);

        // 2. TRAFFIC-JAM YELL: Mouth stretches into a massive, screaming rectangle
        this.mouth.scale.y = 1 + (s * 15); // Opens incredibly wide
        this.mouth.scale.x = 1 + (s * 0.5); // Widens slightly
        this.mouth.position.y = -10 - (s * 5); // Drops down to make room for the scream

        // 3. ANGRY BROWS: Brows snap down into a furious "V"
        this.leftBrow.rotation.z = 0.1 - (s * 0.5); // Angles down inward
        this.rightBrow.rotation.z = -0.1 + (s * 0.5); 
        this.leftBrow.position.y = 16 - (s * 1.5); // Pulls down heavily over the eyes
        this.rightBrow.position.y = 16 - (s * 1.5);

        // 4. THE BOILING SHAKE: He vibrates when he hits his limit
        // Using a threshold so he only shakes when he's REALLY stressed
        if (s > 0.5) {
            const shake = (s - 0.5) * 2.0; 
            this.group.position.x = (Math.random() - 0.5) * shake;
            this.group.position.y = (Math.random() - 0.5) * shake;
        } else {
            // Snap back to dead center when calm
            this.group.position.x = 0;
            this.group.position.y = 0;
        }
    }

    idleBlink() {
        // He only blinks when he is relatively calm. If he's screaming, his eyes are locked open!
        if (this.stressMeter > 0.3) return;

        if (Math.random() > 0.98) {
            // Squashes the entire eye group (white + pupil) flat
            this.leftEyeGroup.scale.y = 0.1;
            this.rightEyeGroup.scale.y = 0.1;
        } else {
            // Eases back open smoothly
            this.leftEyeGroup.scale.y += (1 - this.leftEyeGroup.scale.y) * 0.2;
            this.rightEyeGroup.scale.y += (1 - this.rightEyeGroup.scale.y) * 0.2;
        }
    }
}