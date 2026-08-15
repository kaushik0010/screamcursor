// frontend/src/actors/warriors/BerserkerFace.js
import * as THREE from 'three';

const FORMS = {
    'BASE': { hair: 0x111111, aura: 0x000000, auraOpacity: 0, eye: 0x111111, hairScale: 1.0 },
    // Legendary Green: Massive all-direction scale, neon green hair/aura, pure white eyes
    'LEGENDARY_GREEN': { hair: 0x39ff14, aura: 0x00ff00, auraOpacity: 0.95, eye: 0xffffff, hairScale: 1.85 } 
};

export class BerserkerFace {
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
        // 1. The Brute Head Box (Wider, thicker, blocky jaw)
        const headGeo = new THREE.BoxGeometry(56, 64, 54);
        this.headMat = new THREE.MeshStandardMaterial({ color: 0xffd3b6, roughness: 0.7, flatShading: true });
        
        const posAttribute = headGeo.attributes.position;
        for (let i = 0; i < posAttribute.count; i++) {
            if (posAttribute.getY(i) < 0) {
                // Very slight taper (0.90) to keep the jaw wide and heavily muscled
                posAttribute.setX(i, posAttribute.getX(i) * 0.90);
                posAttribute.setZ(i, posAttribute.getZ(i) * 0.95);
            }
        }
        headGeo.computeVertexNormals();
        this.head = new THREE.Mesh(headGeo, this.headMat);
        this.group.add(this.head);

        // ==========================================
        // 2. THE BERSERKER RADIAL MANE (NO GAPS)
        // ==========================================
        this.hairMat = new THREE.MeshStandardMaterial({ color: FORMS['BASE'].hair, roughness: 0.4, flatShading: true });
        
        // A. The Heavy Scalp Cap (Guarantees zero skin shows through)
        const baseScalpGeo = new THREE.BoxGeometry(57, 10, 55);
        this.baseScalp = new THREE.Mesh(baseScalpGeo, this.hairMat);
        this.baseScalp.position.set(0, 30, 0); 
        this.group.add(this.baseScalp);

        // B. The Dynamic Hair Group
        this.hairGroup = new THREE.Group();
        // Centered pivot so the dome explodes outward uniformly in all directions
        this.hairGroup.position.set(0, 20, 0); 

        const spikeGeo = new THREE.IcosahedronGeometry(12, 1);
        spikeGeo.translate(0, 12, 0); // Bottom pivot
        
        // C. The 360-Degree Dome Array
        const spikeLayout = [
            // TOP CORE (Explodes straight up)
            { x: 0, y: 8, z: -5, rx: 0, rz: 0, sx: 1.4, sy: 2.8, sz: 1.4 },
            { x: -10, y: 6, z: -10, rx: 0.1, rz: 0.3, sx: 1.2, sy: 2.5, sz: 1.2 },
            { x: 10, y: 6, z: -10, rx: 0.1, rz: -0.3, sx: 1.2, sy: 2.5, sz: 1.2 },
            
            // MID CROWN (Fanning out diagonally)
            { x: -18, y: 0, z: -5, rx: 0.2, rz: 0.7, sx: 1.1, sy: 2.2, sz: 1.1 },
            { x: 18, y: 0, z: -5, rx: 0.2, rz: -0.7, sx: 1.1, sy: 2.2, sz: 1.1 },
            { x: 0, y: 2, z: -20, rx: -0.6, rz: 0, sx: 1.3, sy: 2.4, sz: 1.3 },
            { x: -15, y: 0, z: -20, rx: -0.5, rz: 0.5, sx: 1.1, sy: 2.2, sz: 1.1 },
            { x: 15, y: 0, z: -20, rx: -0.5, rz: -0.5, sx: 1.1, sy: 2.2, sz: 1.1 },

            // LOWER SIDES & BACK (Horizontal spread)
            { x: -26, y: -6, z: -5, rx: 0.1, rz: 1.2, sx: 1.0, sy: 2.0, sz: 1.0 },
            { x: 26, y: -6, z: -5, rx: 0.1, rz: -1.2, sx: 1.0, sy: 2.0, sz: 1.0 },
            { x: -18, y: -6, z: -30, rx: -1.0, rz: 0.6, sx: 1.1, sy: 2.0, sz: 1.1 },
            { x: 18, y: -6, z: -30, rx: -1.0, rz: -0.6, sx: 1.1, sy: 2.0, sz: 1.1 },

            // D. FACE FRAMING BANGS (Hanging down over the corners of the face)
            // Left Bang
            { x: -20, y: 5, z: 24, rx: 0.4, rz: 0.3, sx: 0.9, sy: 2.0, sz: 0.9 },
            // Right Bang
            { x: 20, y: 5, z: 24, rx: 0.4, rz: -0.3, sx: 0.9, sy: 2.0, sz: 0.9 }
        ];

        spikeLayout.forEach(pos => {
            const spike = new THREE.Mesh(spikeGeo, this.hairMat);
            spike.position.set(pos.x, pos.y, pos.z);
            spike.rotation.set(pos.rx, 0, pos.rz);
            spike.scale.set(pos.sx, pos.sy, pos.sz);
            this.hairGroup.add(spike);
        });

        this.group.add(this.hairGroup);
        // ==========================================

        // 3. Eyes (Pupils will transition to pure white)
        const eyeGeo = new THREE.BoxGeometry(10, 5, 4);
        const scleraMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        this.eyeMat = new THREE.MeshBasicMaterial({ color: FORMS['BASE'].eye });

        this.leftEyeGroup = new THREE.Group();
        const leftSclera = new THREE.Mesh(eyeGeo, scleraMat);
        this.leftPupil = new THREE.Mesh(new THREE.BoxGeometry(4, 5, 5), this.eyeMat);
        this.leftPupil.position.z = 1;
        this.leftEyeGroup.add(leftSclera);
        this.leftEyeGroup.add(this.leftPupil);
        this.leftEyeGroup.position.set(-14, 5, 26);
        this.leftEyeGroup.rotation.z = 0.15; 
        this.group.add(this.leftEyeGroup);

        this.rightEyeGroup = new THREE.Group();
        const rightSclera = new THREE.Mesh(eyeGeo, scleraMat);
        this.rightPupil = new THREE.Mesh(new THREE.BoxGeometry(4, 5, 5), this.eyeMat);
        this.rightPupil.position.z = 1;
        this.rightEyeGroup.add(rightSclera);
        this.rightEyeGroup.add(this.rightPupil);
        this.rightEyeGroup.position.set(14, 5, 26);
        this.rightEyeGroup.rotation.z = -0.15;
        this.group.add(this.rightEyeGroup);

        // 4. Berserker Brows (Always violently angled)
        const browGeo = new THREE.BoxGeometry(16, 5, 7);
        this.browMat = new THREE.MeshStandardMaterial({ color: 0x111111, flatShading: true });
        
        this.leftBrow = new THREE.Mesh(browGeo, this.browMat);
        this.leftBrow.position.set(-14, 10, 27.5);
        this.leftBrow.rotation.z = -0.30; // Heavy angry scowl
        this.group.add(this.leftBrow);

        this.rightBrow = new THREE.Mesh(browGeo, this.browMat);
        this.rightBrow.position.set(14, 10, 27.5);
        this.rightBrow.rotation.z = 0.30;
        this.group.add(this.rightBrow);

        // 5. Brute Mouth
        const mouthGeo = new THREE.BoxGeometry(14, 2.5, 3);
        const mouthMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
        this.mouth = new THREE.Mesh(mouthGeo, mouthMat);
        this.mouth.position.set(0, -17, 26.5);
        this.group.add(this.mouth);

        // 6. Legendary Aura (Massive chaotic lightning)
        this.lightningBolts = [];
        const boltGeo = new THREE.BoxGeometry(4, 65, 4); // Thicker, longer bolts
        boltGeo.translate(0, 32.5, 0);

        for (let i = 0; i < 8; i++) {
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
            this.wrapperGroup.scale.set(0.55, 0.55, 0.55);
            this.wrapperGroup.position.y = -15; // Adjust this freely now!
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

        // Color Morphing (Shared material covers spikes and scalp cap)
        this.hairMat.color.lerp(this.targetHairColor, lerpSpeed);
        
        // Blank Eye Transition: Black -> Pure White
        this.eyeMat.color.lerp(this.targetEyeColor, lerpSpeed);
        
        // Brows turn green to match hair
        this.browMat.color.lerp(this.targetHairColor, lerpSpeed);

        // The Berserker Explosion: Hair scales equally on all axes
        this.hairGroup.scale.x += (target.hairScale - this.hairGroup.scale.x) * lerpSpeed;
        this.hairGroup.scale.y += (target.hairScale - this.hairGroup.scale.y) * lerpSpeed;
        this.hairGroup.scale.z += (target.hairScale - this.hairGroup.scale.z) * lerpSpeed;

        // Aura Flicker
        this.lightningBolts.forEach((boltObj, index) => {
            boltObj.material.color.lerp(this.targetAuraColor, lerpSpeed);
            boltObj.material.opacity += (target.auraOpacity - boltObj.material.opacity) * lerpSpeed;
            
            if (boltObj.material.opacity > 0.1) {
                if (Math.random() > 0.55) {
                    const angle = (Math.PI * 2 / 8) * index + (Math.random() * 0.5);
                    const radius = 40 + Math.random() * 25;
                    
                    boltObj.mesh.position.set(
                        Math.cos(angle) * radius, 
                        -15 + (Math.random() * 25), 
                        -10 + (Math.random() - 0.5) * 25
                    );
                    
                    boltObj.mesh.rotation.z = angle - Math.PI / 2 + (Math.random() - 0.3);
                    boltObj.mesh.rotation.x = (Math.random() - 0.5);
                    
                    boltObj.mesh.scale.y = 0.8 + Math.random() * 1.5;
                    boltObj.mesh.scale.x = 0.6 + Math.random() * 1.5;
                    
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

        this.mouth.scale.y = 1 + (i * 8); 
        this.mouth.scale.x = 1 + (i * 1.4); 
        this.mouth.position.y = -17 - (i * 2.5);

        if (i > 0.5) {
            const shake = (i - 0.5) * 2.0; // Broly shakes the screen harder
            this.group.position.x = (Math.random() - 0.5) * shake;
            this.group.position.y = (Math.random() - 0.5) * shake;
        } else {
            this.group.position.x += (0 - this.group.position.x) * 0.2;
            this.group.position.y += (0 - this.group.position.y) * 0.2;
        }
    }

    idleBlink() {
        if (this.currentForm === 'LEGENDARY_GREEN') {
            // Berserkers do not blink.
            this.leftEyeGroup.scale.y = 1;
            this.rightEyeGroup.scale.y = 1;
            return;
        }

        if (Math.random() > 0.985) {
            this.leftEyeGroup.scale.y = 0.1;
            this.rightEyeGroup.scale.y = 0.1;
        } else {
            this.leftEyeGroup.scale.y += (1 - this.leftEyeGroup.scale.y) * 0.2;
            this.rightEyeGroup.scale.y += (1 - this.rightEyeGroup.scale.y) * 0.2;
        }
    }
}