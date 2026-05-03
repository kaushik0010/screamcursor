import * as THREE from 'three';

export class CatFace {
    constructor() {
        this.group = new THREE.Group();
        this.panicMeter = 0;

        // 1. The Void Head (Pitch black, radius 35)
        const headGeo = new THREE.SphereGeometry(35, 16, 16);
        const headMat = new THREE.MeshStandardMaterial({
            color: 0x050505, // Vantablack
            roughness: 0.9,
            flatShading: true
        });
        this.head = new THREE.Mesh(headGeo, headMat);
        this.group.add(this.head);

        // 2. The Razor Ears
        // Using a 4-sided cone makes them look like sharp, jagged pyramids
        const earGeo = new THREE.ConeGeometry(10, 25, 4);
        const earMat = new THREE.MeshStandardMaterial({ color: 0x050505, flatShading: true });

        this.leftEar = new THREE.Mesh(earGeo, earMat);
        this.leftEar.position.set(-18, 30, 0);
        this.leftEar.rotation.z = 0.2; // Tilt outward slightly
        this.group.add(this.leftEar);

        this.rightEar = new THREE.Mesh(earGeo, earMat);
        this.rightEar.position.set(18, 30, 0);
        this.rightEar.rotation.z = -0.2; // Tilt outward slightly
        this.group.add(this.rightEar);

        // 3. The Neon Eyes & Slit Pupils
        const eyeGeo = new THREE.SphereGeometry(7, 16, 16);
        const pupilGeo = new THREE.SphereGeometry(6.5, 16, 16); // Slightly smaller, sits in front
        
        const scleraMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 }); // Blinding neon green
        const pupilMat = new THREE.MeshBasicMaterial({ color: 0x000000 });  // Pitch black

        // Left Eye Group (Allows us to tilt the whole eye easily)
        this.leftEyeGroup = new THREE.Group();
        const leftSclera = new THREE.Mesh(eyeGeo, scleraMat);
        leftSclera.scale.set(1, 0.5, 0.5); // Flatten into an almond shape
        
        this.leftPupil = new THREE.Mesh(pupilGeo, pupilMat);
        this.leftPupil.scale.set(0.1, 0.6, 0.6); // Thin vertical slit
        this.leftPupil.position.z = 1.5; // Push pupil slightly forward so it doesn't clip
        
        this.leftEyeGroup.add(leftSclera);
        this.leftEyeGroup.add(this.leftPupil);
        this.leftEyeGroup.position.set(-15, 10, 31);
        this.leftEyeGroup.rotation.z = 0.2; // Angry tilt
        this.group.add(this.leftEyeGroup);

        // Right Eye Group
        this.rightEyeGroup = new THREE.Group();
        const rightSclera = new THREE.Mesh(eyeGeo, scleraMat);
        rightSclera.scale.set(1, 0.5, 0.5); 
        
        this.rightPupil = new THREE.Mesh(pupilGeo, pupilMat);
        this.rightPupil.scale.set(0.1, 0.6, 0.6); 
        this.rightPupil.position.z = 1.5; 
        
        this.rightEyeGroup.add(rightSclera);
        this.rightEyeGroup.add(this.rightPupil);
        this.rightEyeGroup.position.set(15, 10, 31);
        this.rightEyeGroup.rotation.z = -0.2; // Angry tilt
        this.group.add(this.rightEyeGroup);

        // 4. The Needle Teeth (A sharp, pure white "V" shape)
        const teethShape = new THREE.Shape();
        teethShape.moveTo(-4, 0);
        teethShape.lineTo(0, -6);  // Point of the V
        teethShape.lineTo(4, 0);
        teethShape.lineTo(2, 0);
        teethShape.lineTo(0, -3);  // Inner cutout of the V
        teethShape.lineTo(-2, 0);

        const extrudeSettings = { depth: 2, bevelEnabled: false };
        const teethGeo = new THREE.ExtrudeGeometry(teethShape, extrudeSettings);
        teethGeo.translate(0, 0, -1); 

        const teethMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        this.teeth = new THREE.Mesh(teethGeo, teethMat);
        this.teeth.position.set(0, -4, 34);
        this.group.add(this.teeth);
    }

    getMesh() {
        return this.group;
    }

    update(data) {
        this.updateRotation(data.x, data.y);
        this.animatePanic(data.speed);
        this.idleBlink();
    }

    idleBlink() {
        // The cat only blinks when the panic meter is low. 
        // If it's terrified, it stares unblinkingly into the void!
        if (this.panicMeter > 0.2) return;

        // Math.random() > 0.98 gives a natural, sporadic blink rate at 60fps
        if (Math.random() > 0.98) {
            this.leftEyeGroup.scale.y = 0.1;
            this.rightEyeGroup.scale.y = 0.1;
        } else {
            // Smoothly ease the eyelids back open
            this.leftEyeGroup.scale.y += (1 - this.leftEyeGroup.scale.y) * 0.2;
            this.rightEyeGroup.scale.y += (1 - this.rightEyeGroup.scale.y) * 0.2;
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

    animatePanic(speed) {
        const targetPanic = Math.min(1, speed / 5.0); 

        // Panic builds instantly, but decays faster than the Demon's rage
        // This gives it a highly erratic, jittery feel
        if (targetPanic > this.panicMeter) {
            this.panicMeter += (targetPanic - this.panicMeter) * 0.3;
        } else {
            this.panicMeter += (targetPanic - this.panicMeter) * 0.05;
        }

        // 1. PUPIL DILATION: The slit widens until it swallows the green eye entirely
        const dilation = 0.1 + (this.panicMeter * 0.9);
        this.leftPupil.scale.x = dilation;
        this.rightPupil.scale.x = dilation;

        // 2. EAR PINNING: Ears fold flat against the sides of the head
        this.leftEar.rotation.z = 0.2 - (this.panicMeter * 1.2);
        this.rightEar.rotation.z = -0.2 + (this.panicMeter * 1.2);
        
        // Ears also tilt backward slightly as they flatten
        this.leftEar.rotation.x = -(this.panicMeter * 0.8);
        this.rightEar.rotation.x = -(this.panicMeter * 0.8);

        // 3. THE GLITCH JITTER: High-speed vibration tied to the panic meter
        // By centering it around 0, it violently shakes but never floats away
        const jitterIntensity = this.panicMeter * 3.0;
        this.group.position.x = (Math.random() - 0.5) * jitterIntensity;
        this.group.position.y = (Math.random() - 0.5) * jitterIntensity;
        
        // Jaw chatters (moves up and down slightly)
        this.teeth.position.y = -4 + (Math.random() * this.panicMeter * 1.5);
    }
}