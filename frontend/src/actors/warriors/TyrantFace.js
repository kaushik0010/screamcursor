import * as THREE from 'three';
import { BaseFace } from '../BaseFace.js';

export class TyrantFace extends BaseFace {

    init() {
        super.init(); 

        this.currentForm = 'BASE';
        this.targetForm = 'BASE';
        this.transitionProgress = 1.0;
        
        this.palettes = {
            BASE: { 
                head: new THREE.Color(0xf8fafc),   
                dome: new THREE.Color(0x9333ea),   
                aura: new THREE.Color(0xd8b4fe),   
                headMetal: 0.1, headRough: 0.4, 
                domeMetal: 0.6, domeRough: 0.2 
            },
            GOLDEN: { 
                head: new THREE.Color(0xffea00),   
                dome: new THREE.Color(0x581c87),   
                aura: new THREE.Color(0xfef08a),   
                headMetal: 0.95, headRough: 0.1,   
                domeMetal: 0.8, domeRough: 0.1 
            },
            OBSIDIAN: { 
                head: new THREE.Color(0x18181b),   
                dome: new THREE.Color(0x94a3b8),   
                aura: new THREE.Color(0x7e22ce),   
                headMetal: 0.5, headRough: 0.3, 
                domeMetal: 0.9, domeRough: 0.1 
            }
        };

        // --- 1. MAIN HEAD ---
        this.baseColor.copy(this.palettes.BASE.head);
        
        this.head.geometry.dispose();
        this.head.geometry = new THREE.SphereGeometry(40, 32, 32);
        
        this.headMat.color.copy(this.baseColor);
        this.headMat.metalness = this.palettes.BASE.headMetal;
        this.headMat.roughness = this.palettes.BASE.headRough;

        // --- 2. THE PERMANENT FACE PLATE ---
        this.facePlateMat = new THREE.MeshStandardMaterial({
            color: 0xf8fafc, 
            metalness: 0.1,
            roughness: 0.5
        });
        const facePlateGeo = new THREE.SphereGeometry(40.5, 32, 32);
        this.facePlate = new THREE.Mesh(facePlateGeo, this.facePlateMat);
        
        this.facePlate.scale.set(0.65, 0.75, 0.25); 
        this.facePlate.position.set(0, -2, 31); 
        this.group.add(this.facePlate);

        // --- 3. THE BIOLOGICAL DOME ---
        this.domeMat = new THREE.MeshStandardMaterial({
            color: this.palettes.BASE.dome,
            metalness: this.palettes.BASE.domeMetal,
            roughness: this.palettes.BASE.domeRough
        });
        
        const domeGeo = new THREE.SphereGeometry(39, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.35);
        this.domeMesh = new THREE.Mesh(domeGeo, this.domeMat);
        this.domeMesh.position.y = 4; 
        this.head.add(this.domeMesh);

        // --- 4. THE EAR DISCS ---
        const earGeo = new THREE.CylinderGeometry(8, 8, 4, 16);
        this.leftEar = new THREE.Mesh(earGeo, this.domeMat);
        this.leftEar.position.set(-39, 0, 0); 
        this.leftEar.rotation.z = Math.PI / 2;
        this.head.add(this.leftEar);

        this.rightEar = new THREE.Mesh(earGeo, this.domeMat);
        this.rightEar.position.set(39, 0, 0);
        this.rightEar.rotation.z = Math.PI / 2;
        this.head.add(this.rightEar);

        // --- 5. THE EVIL GLARE ---
        // Heavily squinted eyes
        this.leftEyeGroup.scale.set(1.1, 0.4, 1);
        this.leftEyeGroup.rotation.z = -0.3; 
        this.leftEyeGroup.position.set(-14, 8, 40.5); 

        this.rightEyeGroup.scale.set(1.1, 0.4, 1);
        this.rightEyeGroup.rotation.z = 0.3; 
        this.rightEyeGroup.position.set(14, 8, 40.5);

        // Blood Red Pupils (Pushed to the bottom of the eye so he looks down on you)
        const leftPupil = this.leftEyeGroup.children[1];
        leftPupil.material.color.setHex(0xd90000);
        leftPupil.position.set(0, -2, 4.5); 

        const rightPupil = this.rightEyeGroup.children[1];
        rightPupil.material.color.setHex(0xd90000);
        rightPupil.position.set(0, -2, 4.5);

        // Malevolent brow ridges
        const ridgeGeo = new THREE.BoxGeometry(16, 2, 6);
        this.leftBrow.geometry.dispose();
        this.leftBrow.geometry = ridgeGeo;
        this.leftBrow.position.set(-13, 12, 41.5);
        this.leftBrow.rotation.z = -0.45; // Harsher scowl
        
        this.rightBrow.geometry.dispose();
        this.rightBrow.geometry = ridgeGeo;
        this.rightBrow.position.set(13, 12, 41.5);
        this.rightBrow.rotation.z = 0.45;

        // --- 6. THE ARROGANT SMIRK ---
        this.mouth.geometry.dispose();
        
        // Replaced Torus with a sleek BoxGeometry for a clean smirk
        this.mouth.geometry = new THREE.BoxGeometry(10, 1.5, 4);
        
        // Shifted to the right and rotated upward
        this.mouth.position.set(3, -9, 41.5);
        this.mouth.rotation.z = 0.15; 

        this.setupTyrantAura();
    }

    setupTyrantAura() {
        const particleCount = 200;
        this.auraGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const speeds = new Float32Array(particleCount);
        const jitter = new Float32Array(particleCount); 

        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 80; 
            positions[i * 3 + 1] = (Math.random() - 0.5) * 120;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 40 - 10;
            speeds[i] = Math.random() * 4 + 2; 
            jitter[i] = Math.random() * 8; 
        }

        this.auraGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.auraGeometry.setAttribute('speed', new THREE.BufferAttribute(speeds, 1));
        this.auraGeometry.setAttribute('jitter', new THREE.BufferAttribute(jitter, 1));

        this.auraMaterial = new THREE.PointsMaterial({
            color: this.palettes.BASE.aura,
            size: 3.5, 
            transparent: true,
            opacity: 0.7,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.auraParticles = new THREE.Points(this.auraGeometry, this.auraMaterial);
        this.group.add(this.auraParticles);
    }

    setTargetForm(form) {
        if (this.targetForm !== form && this.palettes[form]) {
            this.startState = {
                head: this.baseColor.clone(),
                dome: this.domeMat.color.clone(),
                aura: this.auraMaterial.color.clone(),
                headMetal: this.headMat.metalness,
                headRough: this.headMat.roughness,
                domeMetal: this.domeMat.metalness,
                domeRough: this.domeMat.roughness
            };
            this.targetForm = form;
            this.transitionProgress = 0.0;
        }
    }

    // --- 7. OVERRIDING BASE ANIMATIONS ---
    // By completely overriding animateStress, we stop the red-flush bug naturally 
    // and gain perfect control over his mouth expanding from a smirk to a roar.
    animateStress(speed) {
        const targetStress = Math.min(1, speed / 4.0); 
        if (targetStress > this.stressMeter) {
            this.stressMeter += (targetStress - this.stressMeter) * 0.15;
        } else {
            this.stressMeter += (targetStress - this.stressMeter) * 0.05;
        }
        const s = this.stressMeter;

        // Smirk seamlessly flattens, centers, and roars open
        this.mouth.rotation.z = 0.15 * (1 - s); 
        this.mouth.position.x = 3 * (1 - s); 
        
        this.mouth.scale.y = 1 + (s * 12); // Opens violently wide
        this.mouth.scale.x = 1 + (s * 1.2); 
        this.mouth.position.y = -9 - (s * 4); // Jaw drops

        // Brows push down further in anger
        this.leftBrow.rotation.z = -0.45 - (s * 0.1);
        this.rightBrow.rotation.z = 0.45 + (s * 0.1);
        this.leftBrow.position.y = 12 - (s * 1);
        this.rightBrow.position.y = 12 - (s * 1);

        // Intimidating shake
        if (s > 0.5) {
            const shake = (s - 0.5) * 1.5; 
            this.group.position.x = (Math.random() - 0.5) * shake;
            this.group.position.y = (Math.random() - 0.5) * shake;
        } else {
            this.group.position.x += (0 - this.group.position.x) * 0.2;
            this.group.position.y += (0 - this.group.position.y) * 0.2;
        }
    }

    update(data) {
        super.update(data); // Inherit rotation and blinking

        // --- TRANSFORMATION MORPHING ---
        if (this.transitionProgress < 1.0 && this.startState) {
            this.transitionProgress += 0.015;
            if (this.transitionProgress > 1.0) {
                this.transitionProgress = 1.0;
                this.currentForm = this.targetForm;
            }

            const target = this.palettes[this.targetForm];
            const factor = this.transitionProgress;

            this.baseColor.lerpColors(this.startState.head, target.head, factor);
            this.domeMat.color.lerpColors(this.startState.dome, target.dome, factor);
            this.auraMaterial.color.lerpColors(this.startState.aura, target.aura, factor);
            
            this.headMat.metalness = this.startState.headMetal + (target.headMetal - this.startState.headMetal) * factor;
            this.headMat.roughness = this.startState.headRough + (target.headRough - this.startState.headRough) * factor;
            this.domeMat.metalness = this.startState.domeMetal + (target.domeMetal - this.startState.domeMetal) * factor;
            this.domeMat.roughness = this.startState.domeRough + (target.domeRough - this.startState.domeRough) * factor;
        }

        // --- ERRATIC AURA ANIMATION ---
        if (this.auraParticles && this.auraGeometry) {
            const positions = this.auraGeometry.attributes.position.array;
            const speeds = this.auraGeometry.attributes.speed.array;
            const jitters = this.auraGeometry.attributes.jitter.array;

            let speedMultiplier = 1.0;
            if (this.currentForm === 'OBSIDIAN') speedMultiplier = 2.0;
            if (this.currentForm === 'GOLDEN') speedMultiplier = 1.5;

            const kineticEnergy = Math.max(1.0, data.speed * 0.7);

            for (let i = 0; i < positions.length / 3; i++) {
                positions[i * 3 + 1] += speeds[i] * kineticEnergy * speedMultiplier;
                positions[i * 3] += (Math.random() - 0.5) * jitters[i] * kineticEnergy;

                if (positions[i * 3 + 1] > 100) {
                    positions[i * 3 + 1] = -70;
                    positions[i * 3] = (Math.random() - 0.5) * 80; 
                }
            }
            this.auraGeometry.attributes.position.needsUpdate = true;
            this.auraMaterial.opacity = Math.min(0.9, 0.4 + (data.speed * 0.15));
        }
    }
}