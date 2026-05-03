import * as THREE from 'three';

export class WomanFace {
    constructor() {
        this.group = new THREE.Group();
        this.terrorMeter = 0;

        // 1. The Head (Cartoonish peach/skin tone, radius 35)
        const headGeo = new THREE.SphereGeometry(35, 16, 16);
        const headMat = new THREE.MeshStandardMaterial({
            color: 0xffccaa, // Peach/Skin color
            roughness: 0.6,
            flatShading: true // Keeps the low-poly video game vibe
        });
        this.head = new THREE.Mesh(headGeo, headMat);
        this.group.add(this.head);

        // 2. The Frazzled Hair
        // An Icosahedron gives us a perfectly jagged, low-poly shape for messy hair
        const hairGeo = new THREE.IcosahedronGeometry(37, 0); 
        const hairMat = new THREE.MeshStandardMaterial({ 
            color: 0x331100, // Dark brown
            flatShading: true 
        });
        this.hair = new THREE.Mesh(hairGeo, hairMat);
        this.hair.position.set(0, 10, -5); // Sits on top/back of the head
        this.group.add(this.hair);

        // 3. The Bug Eyes (Massive white spheres)
        const eyeGeo = new THREE.SphereGeometry(9, 16, 16);
        const scleraMat = new THREE.MeshBasicMaterial({ color: 0xffffff }); // Pure white
        
        this.leftEye = new THREE.Mesh(eyeGeo, scleraMat);
        this.leftEye.position.set(-14, 12, 27);
        this.group.add(this.leftEye);

        this.rightEye = new THREE.Mesh(eyeGeo, scleraMat);
        this.rightEye.position.set(14, 12, 27);
        this.group.add(this.rightEye);

        // 4. The Pupils (Small black dots that will shrink)
        const pupilGeo = new THREE.SphereGeometry(3.5, 16, 16);
        const pupilMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
        
        this.leftPupil = new THREE.Mesh(pupilGeo, pupilMat);
        this.leftPupil.position.set(-14, 12, 35.5); // Pushed just in front of the white eye
        this.group.add(this.leftPupil);

        this.rightPupil = new THREE.Mesh(pupilGeo, pupilMat);
        this.rightPupil.position.set(14, 12, 35.5);
        this.group.add(this.rightPupil);

        // 5. The "O" Mouth (Starts small)
        const mouthGeo = new THREE.SphereGeometry(4, 16, 16);
        const mouthMat = new THREE.MeshBasicMaterial({ color: 0x000000 }); // Black void
        this.mouth = new THREE.Mesh(mouthGeo, mouthMat);
        
        // Flatten the sphere so it looks like a hole painted on the face
        this.mouth.scale.set(1, 1, 0.2); 
        this.mouth.position.set(0, -10, 33.5);
        this.group.add(this.mouth);
    }

    getMesh() {
        return this.group;
    }

    update(data) {
        this.updateRotation(data.x, data.y);
        this.animateCartoonPanic(data.speed);
        this.idleBlink();
    }

    idleBlink() {
        // She only blinks when she feels safe. When panicked, she holds the bug-eyed stare.
        if (this.terrorMeter > 0.2) return;

        // Re-calculate her current resting eye/pupil size based on her terror meter
        const eyeBulge = 1 + (this.terrorMeter * 0.6);
        const pupilShrink = Math.max(0.15, 1 - (this.terrorMeter * 0.85));

        if (Math.random() > 0.98) {
            // Close the eyes and pupils flat
            this.leftEye.scale.y = 0.1;
            this.rightEye.scale.y = 0.1;
            this.leftPupil.scale.y = 0.1;
            this.rightPupil.scale.y = 0.1;
        } else {
            // Smoothly ease back to her exact current state
            this.leftEye.scale.y += (eyeBulge - this.leftEye.scale.y) * 0.2;
            this.rightEye.scale.y += (eyeBulge - this.rightEye.scale.y) * 0.2;
            this.leftPupil.scale.y += (pupilShrink - this.leftPupil.scale.y) * 0.2;
            this.rightPupil.scale.y += (pupilShrink - this.rightPupil.scale.y) * 0.2;
        }
    }

    updateRotation(mouseX, mouseY) {
        const screenW = window.screen.width;
        const screenH = window.screen.height;

        const targetRotY = ((mouseX / screenW) * 1.0) - 0.5;
        const targetRotX = ((mouseY / screenH) * 0.8) - 0.4;

        this.group.rotation.y += (targetRotY - this.group.rotation.y) * 0.1;
        this.group.rotation.x += (targetRotX - this.group.rotation.x) * 0.1;
    }

    animateCartoonPanic(speed) {
        // Terror caps out slightly faster than the demon so her reaction is more instant
        const targetTerror = Math.min(1, speed / 3.5); 

        // Terror builds quickly and decays at a medium pace
        if (targetTerror > this.terrorMeter) {
            this.terrorMeter += (targetTerror - this.terrorMeter) * 0.15;
        } else {
            this.terrorMeter += (targetTerror - this.terrorMeter) * 0.08;
        }

        const t = this.terrorMeter;

        // 1. SQUASH & STRETCH: Head stretches tall and gets thin in panic
        this.head.scale.y = 1 + (t * 0.35); // Stretches up
        this.head.scale.x = 1 - (t * 0.15); // Squeezes in
        this.head.scale.z = 1 - (t * 0.15); 

        // 2. STATIC HAIR: Hair lifts off the head and spikes upward
        this.hair.position.y = 10 + (t * 12);
        this.hair.scale.y = 1 + (t * 0.5);

        // 3. BUG EYES: The white eyes swell massively...
        const eyeBulge = 1 + (t * 0.6);
        this.leftEye.scale.set(eyeBulge, eyeBulge, eyeBulge);
        this.rightEye.scale.set(eyeBulge, eyeBulge, eyeBulge);

        // ...while the pupils shrink down into tiny dots of stress
        // (Math.max ensures they never scale to 0 and disappear completely)
        const pupilShrink = Math.max(0.15, 1 - (t * 0.85));
        this.leftPupil.scale.set(pupilShrink, pupilShrink, pupilShrink);
        this.rightPupil.scale.set(pupilShrink, pupilShrink, pupilShrink);

        // 4. THE JAW DROP: The mouth scales into a massive vertical "O"
        this.mouth.scale.y = 1 + (t * 4.5); // Stretches down dramatically
        this.mouth.scale.x = 1 + (t * 1.5); // Widens slightly
        this.mouth.position.y = -10 - (t * 12); // Jaw physically drops lower on the face
    }
}