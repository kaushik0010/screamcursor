import * as THREE from 'three';

export class DemonFace {
    constructor() {
        this.group = new THREE.Group(); 
        this.rageMeter = 0; 

        // 1. The Head (Dark red, Kubrick Stare)
        const headGeo = new THREE.SphereGeometry(35, 16, 16); 
        const headMat = new THREE.MeshStandardMaterial({ 
            color: 0x440000, 
            roughness: 0.9,
            flatShading: true 
        });
        this.head = new THREE.Mesh(headGeo, headMat);
        this.head.rotation.x = 0.3; 
        this.group.add(this.head);

        // 2. The Horns
        const hornGeo = new THREE.ConeGeometry(8, 40, 8);
        const hornMat = new THREE.MeshStandardMaterial({ color: 0x050505, flatShading: true });
        
        this.leftHorn = new THREE.Mesh(hornGeo, hornMat);
        this.leftHorn.position.set(-18, 22, -10);
        this.leftHorn.rotation.x = -0.2; 
        this.leftHorn.rotation.z = Math.PI / 6; 
        this.group.add(this.leftHorn);

        this.rightHorn = new THREE.Mesh(hornGeo, hornMat);
        this.rightHorn.position.set(18, 22, -10);
        this.rightHorn.rotation.x = -0.2;
        this.rightHorn.rotation.z = -Math.PI / 6; 
        this.group.add(this.rightHorn);

        // 3. The Reactor Core Eyes
        const eyeGeo = new THREE.SphereGeometry(4.5, 8, 8);
        this.baseEyeColor = new THREE.Color(0xff3300); 
        this.rageEyeColor = new THREE.Color(0xffffff); 
        
        this.eyeMat = new THREE.MeshBasicMaterial({ color: this.baseEyeColor }); 
        
        this.leftEye = new THREE.Mesh(eyeGeo, this.eyeMat);
        this.leftEye.position.set(-14, 12, 31);
        this.group.add(this.leftEye);

        this.rightEye = new THREE.Mesh(eyeGeo, this.eyeMat);
        this.rightEye.position.set(14, 12, 31);
        this.group.add(this.rightEye);

        // 4. THE JAGGED VOID (The Zig-Zag Smile)
        const smileShape = new THREE.Shape();
        
        // Draw the top lip (Zig-zagging across)
        smileShape.moveTo(-14, 0);
        smileShape.lineTo(-9, -2);
        smileShape.lineTo(-4, 0);
        smileShape.lineTo(0, -3);
        smileShape.lineTo(4, 0);
        smileShape.lineTo(9, -2);
        smileShape.lineTo(14, 0);
        
        // Draw the bottom lip (Zig-zagging back)
        smileShape.lineTo(11, -4);
        smileShape.lineTo(7, -1);
        smileShape.lineTo(0, -6);
        smileShape.lineTo(-7, -1);
        smileShape.lineTo(-11, -4);
        smileShape.lineTo(-14, 0);

        // Extrude the 2D shape into a 3D block
        const extrudeSettings = { depth: 4, bevelEnabled: false };
        const smileGeo = new THREE.ExtrudeGeometry(smileShape, extrudeSettings);
        
        // Center the 3D block so it sits perfectly on the face
        smileGeo.translate(0, 0, -2); 
        
        const smileMat = new THREE.MeshBasicMaterial({ color: 0x000000 }); // Pitch black
        this.smile = new THREE.Mesh(smileGeo, smileMat);
        
        this.smile.position.set(0, -6, 33);
        this.smile.rotation.x = 0.2; // Match the Kubrick stare tilt
        this.group.add(this.smile);
    }

    getMesh() {
        return this.group;
    }

    update(data) {
        this.updateRotation(data.x, data.y);
        this.animatePredator(data.speed);
    }

    updateRotation(mouseX, mouseY) {
        const screenW = window.screen.width;
        const screenH = window.screen.height;

        const targetRotY = ((mouseX / screenW) * 1.0) - 0.5;
        const targetRotX = ((mouseY / screenH) * 0.8) - 0.4;

        this.group.rotation.y += (targetRotY - this.group.rotation.y) * 0.1;
        this.group.rotation.x += (targetRotX - this.group.rotation.x) * 0.1;
    }

    animatePredator(speed) {
        const targetRage = Math.min(1, speed / 4.0); 

        if (targetRage > this.rageMeter) {
            this.rageMeter += (targetRage - this.rageMeter) * 0.08;
        } else {
            this.rageMeter += (targetRage - this.rageMeter) * 0.01;
        }

        // Reactor Eyes
        const eyeScale = 1 + (this.rageMeter * 1.2);
        this.leftEye.scale.set(eyeScale, eyeScale, eyeScale);
        this.rightEye.scale.set(eyeScale, eyeScale, eyeScale);
        this.eyeMat.color.lerpColors(this.baseEyeColor, this.rageEyeColor, this.rageMeter);

        // THE JAGGED STRETCH
        // As rage builds, the smile stretches wide (scale.x) AND opens deeper (scale.y)
        this.smile.scale.x = 1 + (this.rageMeter * 1.5); 
        this.smile.scale.y = 1 + (this.rageMeter * 1.5); 
        this.smile.position.y = -6 + (this.rageMeter * 2); 
    }
}