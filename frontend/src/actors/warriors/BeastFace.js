// frontend/src/actors/warriors/BeastFace.js
import * as THREE from 'three';

const FORMS = {
    'BASE': { hair: 0x111111, aura: 0x000000, auraOpacity: 0, eye: 0x111111, hairScale: 1.0 },
    'GOLD': { hair: 0xffd700, aura: 0xffe000, auraOpacity: 0.8, eye: 0x00ffff, hairScale: 1.3 },
    'ULTIMATE_WHITE': { hair: 0xeeeeee, aura: 0xff00ff, auraOpacity: 0.95, eye: 0xff0000, hairScale: 2.2 } 
};

export class BeastFace {
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
        // 1. Younger, Softer Head Box
        const headGeo = new THREE.BoxGeometry(50, 62, 50);
        this.headMat = new THREE.MeshStandardMaterial({ color: 0xffd3b6, roughness: 0.65, flatShading: true });
        
        const posAttribute = headGeo.attributes.position;
        for (let i = 0; i < posAttribute.count; i++) {
            if (posAttribute.getY(i) < 0) {
                posAttribute.setX(i, posAttribute.getX(i) * 0.85);
                posAttribute.setZ(i, posAttribute.getZ(i) * 0.90);
            }
        }
        headGeo.computeVertexNormals();
        this.head = new THREE.Mesh(headGeo, this.headMat);
        this.group.add(this.head);

        // ==========================================
        // 2. THE REBUILT BEAST HAIR SYSTEM
        // ==========================================
        this.hairMat = new THREE.MeshStandardMaterial({ color: FORMS['BASE'].hair, roughness: 0.35, flatShading: true });
        
        // A. The Scalp Cap (The Baldness Cure)
        // Added directly to the main group so it NEVER scales, keeping the head shape clean
        const baseScalpGeo = new THREE.BoxGeometry(51, 8, 51);
        this.baseScalp = new THREE.Mesh(baseScalpGeo, this.hairMat);
        this.baseScalp.position.set(0, 30, 0); // Flush with the top rim of the head
        this.group.add(this.baseScalp);

        // B. The Dynamic Hair Group (Only the spikes scale)
        this.hairGroup = new THREE.Group();
        this.hairGroup.position.set(0, 32, 24); 

        // C. The Side & Back Mane
        const sideSpikeGeo = new THREE.IcosahedronGeometry(9, 1);
        sideSpikeGeo.translate(0, 9, 0); // Bottom pivot
        
        const crownPositions = [
            // Left Side (Sweeping up and back)
            { x: -22, y: -4, z: -20, rx: -0.2, rz: 0.5 },
            { x: -22, y: -4, z: -30, rx: -0.4, rz: 0.6 },
            { x: -18, y: -4, z: -40, rx: -0.6, rz: 0.7 },
            // Right Side (Sweeping up and back)
            { x: 22, y: -4, z: -20, rx: -0.2, rz: -0.5 },
            { x: 22, y: -4, z: -30, rx: -0.4, rz: -0.6 },
            { x: 18, y: -4, z: -40, rx: -0.6, rz: -0.7 },
            // Back (Sweeping down and back)
            { x: -10, y: -4, z: -48, rx: -1.0, rz: 0.2 },
            { x: 10, y: -4, z: -48, rx: -1.0, rz: -0.2 },
            { x: 0, y: -6, z: -50, rx: -1.2, rz: 0 }
        ];

        crownPositions.forEach(pos => {
            const spike = new THREE.Mesh(sideSpikeGeo, this.hairMat);
            spike.position.set(pos.x, pos.y, pos.z);
            spike.rotation.set(pos.rx, 0, pos.rz);
            
            // Stretch vertically to look like strands rather than spheres
            spike.scale.set(0.9, 1.8 + Math.random() * 0.6, 0.9);
            this.hairGroup.add(spike);
        });

        // D. Massive Upward Swept Top Spikes
        const topSpikeGeo = new THREE.IcosahedronGeometry(13, 1);
        topSpikeGeo.translate(0, 13, 0); 

        this.mainSpike = new THREE.Mesh(topSpikeGeo, this.hairMat);
        this.mainSpike.position.set(0, 0, -18);
        this.mainSpike.scale.set(1.2, 2.8, 1.2); 
        this.mainSpike.rotation.x = -0.05; 
        this.hairGroup.add(this.mainSpike);

        this.leftSpike = new THREE.Mesh(topSpikeGeo, this.hairMat);
        this.leftSpike.position.set(-13, 0, -18);
        this.leftSpike.scale.set(1.0, 2.2, 1.0);
        this.leftSpike.rotation.z = 0.25; 
        this.leftSpike.rotation.x = -0.1;
        this.hairGroup.add(this.leftSpike);

        this.rightSpike = new THREE.Mesh(topSpikeGeo, this.hairMat);
        this.rightSpike.position.set(13, 0, -18);
        this.rightSpike.scale.set(1.0, 2.2, 1.0);
        this.rightSpike.rotation.z = -0.25;
        this.rightSpike.rotation.x = -0.1;
        this.hairGroup.add(this.rightSpike);
        
        this.backTopSpike = new THREE.Mesh(topSpikeGeo, this.hairMat);
        this.backTopSpike.position.set(0, -2, -32);
        this.backTopSpike.scale.set(1.1, 2.0, 1.1);
        this.backTopSpike.rotation.x = -0.5; 
        this.hairGroup.add(this.backTopSpike);

        this.group.add(this.hairGroup);

        // E. The Iconic Front Bang (Anchored to head)
        const bangGeo = new THREE.ConeGeometry(3, 16, 4);
        bangGeo.translate(0, -8, 0); 
        this.bang = new THREE.Mesh(bangGeo, this.hairMat);
        this.bang.position.set(0, 31, 26); 
        this.bang.rotation.x = 0.10; 
        this.bang.rotation.z = 0.05; 
        this.group.add(this.bang); 
        // ==========================================

        // 3. Eyes
        const eyeGeo = new THREE.BoxGeometry(11, 6, 4);
        const scleraMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        this.eyeMat = new THREE.MeshBasicMaterial({ color: FORMS['BASE'].eye });

        this.leftEyeGroup = new THREE.Group();
        const leftSclera = new THREE.Mesh(eyeGeo, scleraMat);
        this.leftPupil = new THREE.Mesh(new THREE.BoxGeometry(4, 6, 5), this.eyeMat);
        this.leftPupil.position.z = 1;
        this.leftPupil.position.x = 1;
        this.leftEyeGroup.add(leftSclera);
        this.leftEyeGroup.add(this.leftPupil);
        this.leftEyeGroup.position.set(-11, 4, 24);
        this.group.add(this.leftEyeGroup);

        this.rightEyeGroup = new THREE.Group();
        const rightSclera = new THREE.Mesh(eyeGeo, scleraMat);
        this.rightPupil = new THREE.Mesh(new THREE.BoxGeometry(4, 6, 5), this.eyeMat);
        this.rightPupil.position.z = 1;
        this.rightPupil.position.x = -1;
        this.rightEyeGroup.add(rightSclera);
        this.rightEyeGroup.add(this.rightPupil);
        this.rightEyeGroup.position.set(11, 4, 24);
        this.group.add(this.rightEyeGroup);

        // 4. Dynamic Brows
        const browGeo = new THREE.BoxGeometry(15, 4, 6);
        this.browMat = new THREE.MeshStandardMaterial({ color: 0x111111, flatShading: true });
        
        this.leftBrow = new THREE.Mesh(browGeo, this.browMat);
        this.leftBrow.position.set(-11, 9, 25);
        this.leftBrow.rotation.z = -0.1; 
        this.group.add(this.leftBrow);

        this.rightBrow = new THREE.Mesh(browGeo, this.browMat);
        this.rightBrow.position.set(11, 9, 25);
        this.rightBrow.rotation.z = 0.1;
        this.group.add(this.rightBrow);

        // 5. Mouth
        const mouthGeo = new THREE.BoxGeometry(10, 2, 3);
        const mouthMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
        this.mouth = new THREE.Mesh(mouthGeo, mouthMat);
        this.mouth.position.set(0, -15, 24.5);
        this.group.add(this.mouth);

        // 6. Beast Aura System
        this.lightningBolts = [];
        const boltGeo = new THREE.BoxGeometry(3, 55, 3); 
        boltGeo.translate(0, 27.5, 0);

        for (let i = 0; i < 7; i++) {
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
        // We wrap the shaking group inside a static folder
        if (!this.wrapperGroup) {
            this.wrapperGroup = new THREE.Group();
            this.wrapperGroup.add(this.group);
            
            // Apply scale and position to the wrapper so the animation loop can't override it!
            this.wrapperGroup.scale.set(0.65, 0.65, 0.65);
            this.wrapperGroup.position.y = -25; // Adjust this freely now!
        }
        return this.wrapperGroup;
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

        // Color Morphing (Shared material covers spikes, scalp cap, and bang automatically)
        this.hairMat.color.lerp(this.targetHairColor, lerpSpeed);
        this.eyeMat.color.lerp(this.targetEyeColor, lerpSpeed);
        this.browMat.color.lerp(this.targetHairColor, lerpSpeed);

        // Dynamic Expression
        const targetBrowRot = this.currentForm === 'BASE' ? 0.1 : 0.35;
        this.leftBrow.rotation.z += (-targetBrowRot - this.leftBrow.rotation.z) * lerpSpeed;
        this.rightBrow.rotation.z += (targetBrowRot - this.rightBrow.rotation.z) * lerpSpeed;

        // Main Hair Scaling (Spikes explode upwards and outwards, but the scalp box stays flush)
        this.hairGroup.scale.y += (target.hairScale - this.hairGroup.scale.y) * lerpSpeed;
        const horizontalScale = 1.0 + ((target.hairScale - 1.0) * 0.4); 
        this.hairGroup.scale.x += (horizontalScale - this.hairGroup.scale.x) * lerpSpeed;
        this.hairGroup.scale.z += (horizontalScale - this.hairGroup.scale.z) * lerpSpeed;

        // Bang Scaling
        const targetBangScale = this.currentForm === 'ULTIMATE_WHITE' ? 1.3 : 1.0;
        this.bang.scale.x += (targetBangScale - this.bang.scale.x) * lerpSpeed;
        this.bang.scale.y += (targetBangScale - this.bang.scale.y) * lerpSpeed;
        this.bang.scale.z += (targetBangScale - this.bang.scale.z) * lerpSpeed;

        // Beast Aura Flicker
        this.lightningBolts.forEach((boltObj, index) => {
            boltObj.material.color.lerp(this.targetAuraColor, lerpSpeed);
            boltObj.material.opacity += (target.auraOpacity - boltObj.material.opacity) * lerpSpeed;
            
            if (boltObj.material.opacity > 0.1) {
                if (Math.random() > 0.60) {
                    const angle = (Math.PI * 2 / 7) * index + (Math.random() * 0.5);
                    const radius = 35 + Math.random() * 20;
                    
                    boltObj.mesh.position.set(
                        Math.cos(angle) * radius, 
                        -10 + (Math.random() * 20), 
                        -10 + (Math.random() - 0.5) * 20
                    );
                    
                    boltObj.mesh.rotation.z = angle - Math.PI / 2 + (Math.random() - 0.2);
                    boltObj.mesh.rotation.x = (Math.random() - 0.5);
                    
                    boltObj.mesh.scale.y = 0.8 + Math.random() * 1.5;
                    boltObj.mesh.scale.x = 0.5 + Math.random() * 1.5;
                    
                    boltObj.mesh.visible = true;
                } else if (Math.random() > 0.4) {
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
        this.mouth.scale.x = 1 + (i * 1.2); 
        this.mouth.position.y = -15 - (i * 2.5);

        if (i > 0.1) {
            this.bang.rotation.z = 0.05 + Math.sin(Date.now() * 0.02) * (i * 0.3);
            this.bang.rotation.x = 0.15 + (i * 0.2); 
        } else {
            this.bang.rotation.z += (0.05 - this.bang.rotation.z) * 0.1;
            this.bang.rotation.x += (0.10 - this.bang.rotation.x) * 0.1; 
        }

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
        if (Math.random() > 0.982) {
            this.leftEyeGroup.scale.y = 0.1;
            this.rightEyeGroup.scale.y = 0.1;
        } else {
            this.leftEyeGroup.scale.y += (1 - this.leftEyeGroup.scale.y) * 0.2;
            this.rightEyeGroup.scale.y += (1 - this.rightEyeGroup.scale.y) * 0.2;
        }
    }
}