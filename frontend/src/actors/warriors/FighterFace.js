import * as THREE from 'three';

const FORMS = {
    'BASE': { hair: 0x111111, aura: 0x000000, auraOpacity: 0, eye: 0x000000, hairScale: 1 },
    'GOLD': { hair: 0xffe600, aura: 0xffd700, auraOpacity: 0.8, eye: 0x00ffff, hairScale: 1.3 },
    'DIVINE_RED': { hair: 0xff2244, aura: 0xff3300, auraOpacity: 0.8, eye: 0xff2244, hairScale: 1.05 }, 
    'DIVINE_BLUE': { hair: 0x00ccff, aura: 0x00aaff, auraOpacity: 0.8, eye: 0x00ccff, hairScale: 1.35 },
    'AUTONOMOUS': { hair: 0xeeeeee, aura: 0xffffff, auraOpacity: 0.9, eye: 0xaaaaaa, hairScale: 1.5 }
};

export class FighterFace {
    constructor() {
        this.group = new THREE.Group();
        this.currentForm = 'BASE';
        this.currentScreamIntensity = 0; // Smoothes the mouth roar
        
        this.targetHairColor = new THREE.Color(FORMS['BASE'].hair);
        this.targetAuraColor = new THREE.Color(FORMS['BASE'].aura);
        this.targetEyeColor = new THREE.Color(FORMS['BASE'].eye);
        
        this.init();
    }

    init() {
        // 1. The Head
        const headGeo = new THREE.BoxGeometry(60, 65, 55);
        this.headMat = new THREE.MeshStandardMaterial({ color: 0xffd3b6, roughness: 0.7, flatShading: true });
        this.head = new THREE.Mesh(headGeo, this.headMat);
        
        const posAttribute = headGeo.attributes.position;
        for (let i = 0; i < posAttribute.count; i++) {
            if (posAttribute.getY(i) < 0) {
                posAttribute.setX(i, posAttribute.getX(i) * 0.8);
            }
        }
        headGeo.computeVertexNormals();
        this.group.add(this.head);

        // 2. The Spiky Hair (PIVOT FIX)
        const hairGeo = new THREE.IcosahedronGeometry(40, 1);
        // Translate vertices UP so the pivot point becomes the bottom of the hair
        hairGeo.translate(0, 30, 0); 
        this.hairMat = new THREE.MeshStandardMaterial({ color: FORMS['BASE'].hair, roughness: 0.4, flatShading: true });
        this.hair = new THREE.Mesh(hairGeo, this.hairMat);
        // Anchor it lower and further back so it grows away from the face
        this.hair.position.set(0, -5, -15); 
        this.hair.scale.set(1, 1.2, 1); 
        this.group.add(this.hair);

        // 3. The Warrior Eyes
        const eyeGeo = new THREE.SphereGeometry(6, 16, 16);
        const scleraMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        this.eyeMat = new THREE.MeshBasicMaterial({ color: FORMS['BASE'].eye });

        this.leftEyeGroup = new THREE.Group();
        const leftSclera = new THREE.Mesh(eyeGeo, scleraMat);
        this.leftPupil = new THREE.Mesh(new THREE.SphereGeometry(3, 16, 16), this.eyeMat);
        this.leftPupil.position.z = 4.5;
        this.leftEyeGroup.add(leftSclera);
        this.leftEyeGroup.add(this.leftPupil);
        this.leftEyeGroup.position.set(-15, 5, 26);
        this.leftEyeGroup.rotation.z = 0.1;
        this.group.add(this.leftEyeGroup);

        this.rightEyeGroup = new THREE.Group();
        const rightSclera = new THREE.Mesh(eyeGeo, scleraMat);
        this.rightPupil = new THREE.Mesh(new THREE.SphereGeometry(3, 16, 16), this.eyeMat);
        this.rightPupil.position.z = 4.5;
        this.rightEyeGroup.add(rightSclera);
        this.rightEyeGroup.add(this.rightPupil);
        this.rightEyeGroup.position.set(15, 5, 26);
        this.rightEyeGroup.rotation.z = -0.1;
        this.group.add(this.rightEyeGroup);

        // 4. The Aggressive Brows
        const browGeo = new THREE.BoxGeometry(18, 4, 6);
        const browMat = new THREE.MeshStandardMaterial({ color: 0x111111, flatShading: true });
        
        this.leftBrow = new THREE.Mesh(browGeo, browMat);
        this.leftBrow.position.set(-15, 12, 28);
        this.leftBrow.rotation.z = -0.3; 
        this.group.add(this.leftBrow);

        this.rightBrow = new THREE.Mesh(browGeo, browMat);
        this.rightBrow.position.set(15, 12, 28);
        this.rightBrow.rotation.z = 0.3;
        this.group.add(this.rightBrow);

        // 5. The Smirk/Roar Mouth
        const mouthGeo = new THREE.BoxGeometry(14, 2, 3);
        const mouthMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
        this.mouth = new THREE.Mesh(mouthGeo, mouthMat);
        this.mouth.position.set(0, -15, 27.5);
        this.group.add(this.mouth);

        // 6. THE THUNDER SYSTEM (Low-Poly Lightning)
        this.lightningGroup = new THREE.Group();
        this.group.add(this.lightningGroup);
        this.lightningBolts = [];
        
        // Create 6 jagged lightning boxes
        const boltGeo = new THREE.BoxGeometry(3, 50, 3);
        boltGeo.translate(0, 25, 0); // Pivot at the base

        for (let i = 0; i < 6; i++) {
            const boltMat = new THREE.MeshBasicMaterial({
                color: FORMS['BASE'].aura,
                transparent: true,
                opacity: 0,
                blending: THREE.AdditiveBlending, // Makes the thunder glow
                depthWrite: false
            });
            const bolt = new THREE.Mesh(boltGeo, boltMat);
            bolt.visible = false;
            this.lightningGroup.add(bolt);
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

        // 1. Morph Colors
        this.hairMat.color.lerp(this.targetHairColor, lerpSpeed);
        this.eyeMat.color.lerp(this.targetEyeColor, lerpSpeed);
        this.leftBrow.material.color.lerp(this.targetHairColor, lerpSpeed);

        // 2. Morph Geometry Scales (Hair now grows UP and BACK)
        this.hair.scale.y += (target.hairScale * 1.2 - this.hair.scale.y) * lerpSpeed;
        this.hair.scale.x += (target.hairScale - this.hair.scale.x) * lerpSpeed;
        this.hair.scale.z += (target.hairScale - this.hair.scale.z) * lerpSpeed;

        // 3. The Thunder Engine
        this.lightningBolts.forEach(boltObj => {
            boltObj.material.color.lerp(this.targetAuraColor, lerpSpeed);
            boltObj.material.opacity += (target.auraOpacity - boltObj.material.opacity) * lerpSpeed;
            
            // Only flash lightning if the form actually has an aura
            if (boltObj.material.opacity > 0.1) {
                // Every few frames, randomly reposition and flash the bolt
                if (Math.random() > 0.7) {
                    const angle = Math.random() * Math.PI * 2;
                    const radius = 35 + Math.random() * 20; // Distance from head
                    
                    boltObj.mesh.position.set(Math.cos(angle) * radius, (Math.random() - 0.5) * 40, -10 + (Math.random() - 0.5) * 20);
                    
                    // Angle it outwards dynamically
                    boltObj.mesh.rotation.z = angle - Math.PI / 2 + (Math.random() - 0.5);
                    boltObj.mesh.rotation.x = (Math.random() - 0.5);
                    boltObj.mesh.rotation.y = (Math.random() - 0.5);
                    
                    // Random thickness and length for chaotic energy
                    boltObj.mesh.scale.y = 0.5 + Math.random() * 1.5;
                    boltObj.mesh.scale.x = 0.2 + Math.random() * 1.5;
                    
                    boltObj.mesh.visible = Math.random() > 0.3; // Flicker on
                } else if (Math.random() > 0.5) {
                    boltObj.mesh.visible = false; // Flicker off
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
        this.mouth.scale.x = 1 + (i * 1.5); 
        this.mouth.position.y = -15 - (i * 3);

        if (i > 0.5) {
            const shake = (i - 0.5) * 1.5; 
            this.group.position.x = (Math.random() - 0.5) * shake;
            this.group.position.y = (Math.random() - 0.5) * shake;
        } else {
            this.group.position.x += (0 - this.group.position.x) * 0.2;
            this.group.position.y += (0 - this.group.position.y) * 0.2;
        }
    }

    idleBlink() {
        if (this.currentForm === 'AUTONOMOUS') {
            this.leftEyeGroup.scale.y = 1;
            this.rightEyeGroup.scale.y = 1;
            return;
        }
        if (Math.random() > 0.98) {
            this.leftEyeGroup.scale.y = 0.1;
            this.rightEyeGroup.scale.y = 0.1;
        } else {
            this.leftEyeGroup.scale.y += (1 - this.leftEyeGroup.scale.y) * 0.2;
            this.rightEyeGroup.scale.y += (1 - this.rightEyeGroup.scale.y) * 0.2;
        }
    }
}