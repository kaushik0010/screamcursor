// frontend/src/actors/warriors/PrinceFace.js
import * as THREE from 'three';

const FORMS = {
    'BASE': { hair: 0x111111, aura: 0x000000, auraOpacity: 0, eye: 0x111111, hairScale: 1.0 },
    'GOLD': { hair: 0xffd700, aura: 0xffe000, auraOpacity: 0.8, eye: 0x00ffff, hairScale: 1.25 },
    'DIVINE_BLUE': { hair: 0x00d3ff, aura: 0x0077ff, auraOpacity: 0.85, eye: 0x00f0ff, hairScale: 1.3 },
    'ULTRA_EGO': { hair: 0x8a2be2, aura: 0x9400d3, auraOpacity: 0.95, eye: 0xff00ff, hairScale: 1.4 }
};

export class PrinceFace {
    constructor() {
        this.group = new THREE.Group();
        this.currentForm = 'BASE';
        this.currentScreamIntensity = 0;
        
        this.targetHairColor = new THREE.Color(FORMS['BASE'].hair);
        this.targetAuraColor = new THREE.Color(FORMS['BASE'].aura);
        this.targetEyeColor = new THREE.Color(FORMS['BASE'].eye);
        
        this.init();
    }

    init() {
        // 1. Head with Tapered V-Jawline
        const headGeo = new THREE.BoxGeometry(54, 66, 52);
        this.headMat = new THREE.MeshStandardMaterial({ color: 0xffd3b6, roughness: 0.65, flatShading: true });
        
        const posAttribute = headGeo.attributes.position;
        for (let i = 0; i < posAttribute.count; i++) {
            // Taper bottom vertices inward for sharp jawline
            if (posAttribute.getY(i) < 0) {
                posAttribute.setX(i, posAttribute.getX(i) * 0.75);
                posAttribute.setZ(i, posAttribute.getZ(i) * 0.85);
            }
        }
        headGeo.computeVertexNormals();
        this.head = new THREE.Mesh(headGeo, this.headMat);
        this.group.add(this.head);

        // ==========================================
        // 2. THE ROYAL HAIR REWORK
        // ==========================================
        this.hairGroup = new THREE.Group();
        this.hairMat = new THREE.MeshStandardMaterial({ color: FORMS['BASE'].hair, roughness: 0.35, flatShading: true });

        // THE PIVOT FIX: Anchor the entire hair system at the top-front edge of the forehead.
        // Now, scaling the group will grow UP and BACK, away from the face.
        this.hairGroup.position.set(0, 30, 24); 

        // A. The Widow's Peak (Glued to the anchor point)
        const peakGeo = new THREE.ConeGeometry(9, 12, 4);
        peakGeo.rotateX(Math.PI); // Point down
        const peakMesh = new THREE.Mesh(peakGeo, this.hairMat);
        peakMesh.position.set(0, -3, 2); // Shifted slightly down to overlap skin securely
        this.hairGroup.add(peakMesh);

        // B. The Base Helmet (Cures the baldness)
        // A solid block that covers the top and back of the scalp
        const baseHairGeo = new THREE.BoxGeometry(56, 16, 48);
        const baseHair = new THREE.Mesh(baseHairGeo, this.hairMat);
        baseHair.position.set(0, -2, -24); // Positioned behind the forehead anchor
        this.hairGroup.add(baseHair);

        // C. The Flame Spikes (Using jagged Icosahedrons)
        const spikeGeo = new THREE.IcosahedronGeometry(15, 1);
        spikeGeo.translate(0, 15, 0); // Move vertices up so the bottom is the pivot

        // Center Main Spike
        this.mainSpike = new THREE.Mesh(spikeGeo, this.hairMat);
        this.mainSpike.position.set(0, 2, -18);
        this.mainSpike.scale.set(1.2, 2.5, 1.2);
        this.mainSpike.rotation.x = -0.15; // Sweep backwards
        this.hairGroup.add(this.mainSpike);

        // Left Flare Spike
        this.leftSpike = new THREE.Mesh(spikeGeo, this.hairMat);
        this.leftSpike.position.set(-15, 2, -14);
        this.leftSpike.scale.set(1.1, 1.9, 1.1);
        this.leftSpike.rotation.z = -0.35; // Sweep left
        this.leftSpike.rotation.x = -0.2;  // Sweep back
        this.hairGroup.add(this.leftSpike);

        // Right Flare Spike
        this.rightSpike = new THREE.Mesh(spikeGeo, this.hairMat);
        this.rightSpike.position.set(15, 2, -14);
        this.rightSpike.scale.set(1.1, 1.9, 1.1);
        this.rightSpike.rotation.z = 0.35; // Sweep right
        this.rightSpike.rotation.x = -0.2; // Sweep back
        this.hairGroup.add(this.rightSpike);

        // Small Back Spikes to round out the mane
        this.backLeftSpike = new THREE.Mesh(spikeGeo, this.hairMat);
        this.backLeftSpike.position.set(-10, 0, -32);
        this.backLeftSpike.scale.set(0.9, 1.5, 0.9);
        this.backLeftSpike.rotation.z = -0.5;
        this.backLeftSpike.rotation.x = -0.6; // Heavy sweep back
        this.hairGroup.add(this.backLeftSpike);

        this.backRightSpike = new THREE.Mesh(spikeGeo, this.hairMat);
        this.backRightSpike.position.set(10, 0, -32);
        this.backRightSpike.scale.set(0.9, 1.5, 0.9);
        this.backRightSpike.rotation.z = 0.5;
        this.backRightSpike.rotation.x = -0.6;
        this.hairGroup.add(this.backRightSpike);

        this.group.add(this.hairGroup);
        // ==========================================

        // 3. Narrow Stern Eyes
        const eyeGeo = new THREE.BoxGeometry(10, 5, 4);
        const scleraMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        this.eyeMat = new THREE.MeshBasicMaterial({ color: FORMS['BASE'].eye });

        this.leftEyeGroup = new THREE.Group();
        const leftSclera = new THREE.Mesh(eyeGeo, scleraMat);
        this.leftPupil = new THREE.Mesh(new THREE.BoxGeometry(4, 5, 5), this.eyeMat);
        this.leftPupil.position.z = 1;
        this.leftEyeGroup.add(leftSclera);
        this.leftEyeGroup.add(this.leftPupil);
        this.leftEyeGroup.position.set(-13, 6, 26);
        this.leftEyeGroup.rotation.z = 0.18; // Sharp slant inward
        this.group.add(this.leftEyeGroup);

        this.rightEyeGroup = new THREE.Group();
        const rightSclera = new THREE.Mesh(eyeGeo, scleraMat);
        this.rightPupil = new THREE.Mesh(new THREE.BoxGeometry(4, 5, 5), this.eyeMat);
        this.rightPupil.position.z = 1;
        this.rightEyeGroup.add(rightSclera);
        this.rightEyeGroup.add(this.rightPupil);
        this.rightEyeGroup.position.set(13, 6, 26);
        this.rightEyeGroup.rotation.z = -0.18;
        this.group.add(this.rightEyeGroup);

        // 4. Heavy Brow Ridge
        const browGeo = new THREE.BoxGeometry(16, 5, 7);
        this.browMat = new THREE.MeshStandardMaterial({ color: 0x111111, flatShading: true });
        
        this.leftBrow = new THREE.Mesh(browGeo, this.browMat);
        this.leftBrow.position.set(-13, 11, 27);
        this.leftBrow.rotation.z = -0.35; 
        this.group.add(this.leftBrow);

        this.rightBrow = new THREE.Mesh(browGeo, this.browMat);
        this.rightBrow.position.set(13, 11, 27);
        this.rightBrow.rotation.z = 0.35;
        this.group.add(this.rightBrow);

        // 5. Proud Scowl Mouth
        const mouthGeo = new THREE.BoxGeometry(12, 2, 3);
        const mouthMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
        this.mouth = new THREE.Mesh(mouthGeo, mouthMat);
        this.mouth.position.set(0, -16, 26.5);
        this.group.add(this.mouth);

        // 6. Royal Thunder System
        this.lightningBolts = [];
        const boltGeo = new THREE.BoxGeometry(2.5, 45, 2.5);
        boltGeo.translate(0, 22.5, 0);

        for (let i = 0; i < 6; i++) {
            const boltMat = new THREE.MeshBasicMaterial({
                color: FORMS['BASE'].aura,
                transparent: true,
                opacity: 0,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });
            const bolt = new THREE.Mesh(boltGeo, boltMat);
            bolt.visible = false;
            this.group.add(bolt);
            this.lightningBolts.push({ mesh: bolt, material: boltMat });
        }
    }

    getMesh() {
        return this.group;
    }

    setTargetForm(formString) {
        if (FORMS[formString]) {
            this.currentForm = formString;
            this.targetHairColor.setHex(FORMS[formString].hair);
            this.targetAuraColor.setHex(FORMS[formString].aura);
            this.targetEyeColor.setHex(FORMS[formString].eye);
        }
    }

    update(data) {
        this.updateRotation(data.x, data.y);
        this.animateTransformation();
        this.animatePowerScream(data.speed);
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

    animateTransformation() {
        const target = FORMS[this.currentForm];
        const lerpSpeed = 0.05;

        // 1. Color Morphing
        this.hairMat.color.lerp(this.targetHairColor, lerpSpeed);
        this.eyeMat.color.lerp(this.targetEyeColor, lerpSpeed);
        
        // Ultra Ego Eyebrow Morphing (Flattens brows to emphasize brow ridge)
        if (this.currentForm === 'ULTRA_EGO') {
            this.browMat.color.lerp(this.headMat.color, lerpSpeed); // Blends eyebrows into skin tone
            this.leftBrow.scale.y += (0.4 - this.leftBrow.scale.y) * lerpSpeed;
            this.rightBrow.scale.y += (0.4 - this.rightBrow.scale.y) * lerpSpeed;
        } else {
            this.browMat.color.lerp(this.targetHairColor, lerpSpeed);
            this.leftBrow.scale.y += (1.0 - this.leftBrow.scale.y) * lerpSpeed;
            this.rightBrow.scale.y += (1.0 - this.rightBrow.scale.y) * lerpSpeed;
        }

        // 2. Hair Geometry Scaling (Now grows purely upwards and backwards)
        this.hairGroup.scale.y += (target.hairScale * 1.25 - this.hairGroup.scale.y) * lerpSpeed;
        this.hairGroup.scale.x += (target.hairScale - this.hairGroup.scale.x) * lerpSpeed;
        this.hairGroup.scale.z += (target.hairScale - this.hairGroup.scale.z) * lerpSpeed;

        // 3. Lightning Flicker
        this.lightningBolts.forEach(boltObj => {
            boltObj.material.color.lerp(this.targetAuraColor, lerpSpeed);
            boltObj.material.opacity += (target.auraOpacity - boltObj.material.opacity) * lerpSpeed;
            
            if (boltObj.material.opacity > 0.1) {
                if (Math.random() > 0.65) {
                    const angle = Math.random() * Math.PI * 2;
                    const radius = 32 + Math.random() * 18;
                    
                    boltObj.mesh.position.set(
                        Math.cos(angle) * radius, 
                        (Math.random() - 0.5) * 35, 
                        -10 + (Math.random() - 0.5) * 15
                    );
                    
                    boltObj.mesh.rotation.z = angle - Math.PI / 2 + (Math.random() - 0.4);
                    boltObj.mesh.rotation.x = (Math.random() - 0.5);
                    boltObj.mesh.rotation.y = (Math.random() - 0.5);
                    
                    boltObj.mesh.scale.y = 0.6 + Math.random() * 1.4;
                    boltObj.mesh.scale.x = 0.3 + Math.random() * 1.2;
                    
                    boltObj.mesh.visible = Math.random() > 0.25;
                } else if (Math.random() > 0.5) {
                    boltObj.mesh.visible = false;
                }
            } else {
                boltObj.mesh.visible = false;
            }
        });
    }

    animatePowerScream(speed) {
        const targetIntensity = Math.min(1, speed / 4.0); 
        this.currentScreamIntensity += (targetIntensity - this.currentScreamIntensity) * 0.15;
        const i = this.currentScreamIntensity;

        this.mouth.scale.y = 1 + (i * 7); 
        this.mouth.scale.x = 1 + (i * 1.3); 
        this.mouth.position.y = -16 - (i * 2.5);

        if (i > 0.5) {
            const shake = (i - 0.5) * 1.6; 
            this.group.position.x = (Math.random() - 0.5) * shake;
            this.group.position.y = (Math.random() - 0.5) * shake;
        } else {
            this.group.position.x += (0 - this.group.position.x) * 0.2;
            this.group.position.y += (0 - this.group.position.y) * 0.2;
        }
    }

    idleBlink() {
        if (this.currentForm === 'ULTRA_EGO') {
            this.leftEyeGroup.scale.y = 1;
            this.rightEyeGroup.scale.y = 1;
            return;
        }

        if (Math.random() > 0.982) {
            this.leftEyeGroup.scale.y = 0.1;
            this.rightEyeGroup.scale.y = 0.1;
        } else {
            this.leftEyeGroup.scale.y += (1 - this.leftEyeGroup.scale.y) * 0.2;
            this.rightEyeGroup.scale.y += (1 - this.rightEyeGroup.scale.y) * 0.2;
        }
    }
}