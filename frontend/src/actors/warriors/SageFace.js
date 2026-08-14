import * as THREE from 'three';
import { BaseFace } from '../BaseFace.js';

export class SageFace extends BaseFace {

    init() {
        super.init(); // Let the Brain initialize the eye-tracking and stress math

        // --- 1. SAGE SPECIFIC STATE ---
        this.currentForm = 'BASE';
        this.targetForm = 'BASE';
        this.transitionProgress = 1.0;

        this.sageColors = {
            baseSkin: new THREE.Color(0x4ade80),    // Namekian Green
            orangeSkin: new THREE.Color(0xea580c),  // Forged Orange
            baseAura: new THREE.Color(0xffffff),
            orangeAura: new THREE.Color(0xf97316),
            stressGreen: new THREE.Color(0x22c55e), 
            stressOrange: new THREE.Color(0xc2410c) 
        };

        // Override BaseFace colors
        this.baseColor.copy(this.sageColors.baseSkin);
        this.stressColor.copy(this.sageColors.stressGreen);
        this.headMat.color.copy(this.baseColor);
        this.headMat.roughness = 0.9; // Matte, alien skin

        // --- 2. HIJACKING & REPLACING THE GEOMETRY ---
        
        // 1. Create a massive Box to encompass the facial features properly
        const headGeo = new THREE.BoxGeometry(60, 65, 60); 

        // 2. Vertex Manipulation: Taper the bottom to create a sharp, chiseled V-jaw
        const posAttribute = headGeo.attributes.position;
        for (let i = 0; i < posAttribute.count; i++) {
            if (posAttribute.getY(i) < 0) {
                // Squeeze the X-axis inward on the bottom half of the face
                posAttribute.setX(i, posAttribute.getX(i) * 0.55); 
            }
        }
        headGeo.computeVertexNormals(); // Crucial for correct lighting after manipulating vertices

        this.head.geometry.dispose(); 
        this.head.geometry = headGeo; 

        // Destroy the default thin brows and replace them with massive, heavy Warlord brows
        const heavyBrowGeo = new THREE.BoxGeometry(20, 8, 12);
        this.leftBrow.geometry.dispose();
        this.leftBrow.geometry = heavyBrowGeo;
        this.leftBrow.position.set(-14, 18, 32); // Pushed out to cast a shadow over the eyes
        
        this.rightBrow.geometry.dispose();
        this.rightBrow.geometry = heavyBrowGeo;
        this.rightBrow.position.set(14, 18, 32);

        // --- 3. INJECTING SAGE ANATOMY ---
        
        // The Iconic Sharp Ears (Pushed outward to match the new 60px wide head)
        const earGeo = new THREE.ConeGeometry(4, 16, 16);
        this.leftEar = new THREE.Mesh(earGeo, this.headMat);
        this.leftEar.position.set(-30, 2, 0); 
        this.leftEar.rotation.z = Math.PI / 2;
        this.leftEar.rotation.y = -Math.PI / 8;
        this.head.add(this.leftEar);

        this.rightEar = new THREE.Mesh(earGeo, this.headMat);
        this.rightEar.position.set(30, 2, 0);
        this.rightEar.rotation.z = -Math.PI / 2;
        this.rightEar.rotation.y = Math.PI / 8;
        this.head.add(this.rightEar);

        // The Antennas (Pushed up to match the new 65px tall head)
        const antennaGeo = new THREE.CylinderGeometry(1.2, 1.2, 12, 8); 
        this.leftAntenna = new THREE.Mesh(antennaGeo, this.headMat);
        this.leftAntenna.position.set(-18, 33, 15);
        this.leftAntenna.rotation.z = Math.PI / 6;
        this.leftAntenna.rotation.x = Math.PI / 8;
        this.head.add(this.leftAntenna);

        this.rightAntenna = new THREE.Mesh(antennaGeo, this.headMat);
        this.rightAntenna.position.set(18, 33, 15);
        this.rightAntenna.rotation.z = -Math.PI / 6;
        this.rightAntenna.rotation.x = Math.PI / 8;
        this.head.add(this.rightAntenna);

        this.setupSageAura();
    }

    setupSageAura() {
        const particleCount = 180;
        this.auraGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const speeds = new Float32Array(particleCount);

        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 120;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 120;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 50 - 20; 
            speeds[i] = Math.random() * 2 + 1;
        }

        this.auraGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.auraGeometry.setAttribute('speed', new THREE.BufferAttribute(speeds, 1));

        this.auraMaterial = new THREE.PointsMaterial({
            color: this.sageColors.baseAura,
            size: 4,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.auraParticles = new THREE.Points(this.auraGeometry, this.auraMaterial);
        this.group.add(this.auraParticles);
    }

    setTargetForm(form) {
        if (this.targetForm !== form) {
            this.targetForm = form;
            this.transitionProgress = 0.0;
        }
    }

    update(data) {
        super.update(data); // Inherit the eye tracking and stress animations

        // --- TRANSFORMATION MORPHING ---
        if (this.transitionProgress < 1.0) {
            this.transitionProgress += 0.015;
            if (this.transitionProgress > 1.0) {
                this.transitionProgress = 1.0;
                this.currentForm = this.targetForm;
            }

            const isTransformingToOrange = this.targetForm === 'FORGED_ORANGE';
            const factor = isTransformingToOrange ? this.transitionProgress : (1.0 - this.transitionProgress);

            // Morph Colors
            this.baseColor.lerpColors(this.sageColors.baseSkin, this.sageColors.orangeSkin, factor);
            this.stressColor.lerpColors(this.sageColors.stressGreen, this.sageColors.stressOrange, factor);
            this.auraMaterial.color.lerpColors(this.sageColors.baseAura, this.sageColors.orangeAura, factor);

            // Morph Anatomy (Bulks up the jawline and brow heavily)
            const bulkFactor = 1.0 + (0.15 * factor); // Inflates by 15% instead of 25%
            this.head.scale.set(bulkFactor, 1 + (0.05 * factor), bulkFactor);
            
            // Aura gets massive
            this.auraMaterial.size = 4 + (5 * factor);
        }

        // --- AURA FARMER ANIMATION ---
        if (this.auraParticles && this.auraGeometry) {
            const positions = this.auraGeometry.attributes.position.array;
            const speeds = this.auraGeometry.attributes.speed.array;

            const speedMultiplier = (this.currentForm === 'FORGED_ORANGE') ? 0.6 : 1.0;
            const kineticEnergy = Math.max(1.0, data.speed * 0.5);

            for (let i = 0; i < positions.length / 3; i++) {
                // Majestic, slow upward bloom
                positions[i * 3 + 1] += speeds[i] * kineticEnergy * speedMultiplier;
                positions[i * 3] += Math.sin(Date.now() * 0.001 + i) * 0.6;

                if (positions[i * 3 + 1] > 100) {
                    positions[i * 3 + 1] = -80;
                    const spread = this.currentForm === 'FORGED_ORANGE' ? 200 : 100;
                    positions[i * 3] = (Math.random() - 0.5) * spread;
                }
            }
            this.auraGeometry.attributes.position.needsUpdate = true;
            this.auraMaterial.opacity = Math.min(0.8, 0.3 + (data.speed * 0.1));
        }
    }
}