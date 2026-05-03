import * as THREE from 'three';

export class VisualEngine {
    constructor(container) {
        this.container = container;
        this.scene = new THREE.Scene();
        this.currentActor = null;
        this.init();
    }

    init() {
        this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        this.renderer.setSize(400, 400);
        this.container.appendChild(this.renderer.domElement);

        this.camera = new THREE.PerspectiveCamera(45, 1, 1, 1000);
        this.camera.position.z = 200;

        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(0, 10, 10);
        this.scene.add(light);
        this.scene.add(new THREE.AmbientLight(0xffffff, 0.5));

        this.animate();
    }

    // --- UPGRADED: DYNAMIC LOADING WITH MEMORY CLEANUP ---
    loadActor(actor) {
        // 1. If there's an existing face, kill it properly
        if (this.currentActor) {
            const oldMesh = this.currentActor.getMesh();
            this.scene.remove(oldMesh);

            // Clean up Geometry and Materials to free up GPU RAM
            if (oldMesh.geometry) oldMesh.geometry.dispose();
            if (oldMesh.material) {
                if (Array.isArray(oldMesh.material)) {
                    oldMesh.material.forEach(m => m.dispose());
                } else {
                    oldMesh.material.dispose();
                }
            }
        }

        // 2. Load the new actor
        this.currentActor = actor;
        this.scene.add(this.currentActor.getMesh());
    }

    update(data) {
        if (this.currentActor) {
            this.currentActor.update(data);
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.renderer.render(this.scene, this.camera);
    }

    setMode(mode) {
        if (!this.camera || !this.renderer) return;

        let targetWidth, targetHeight;
        if (mode === 'preview') {
            this.camera.position.z = 170; 
            targetWidth = 380;
            targetHeight = 250;
        } else {
            this.camera.position.z = 200; 
            targetWidth = window.innerWidth;
            targetHeight = window.innerHeight;
        }

        this.renderer.setSize(targetWidth, targetHeight);
        this.camera.aspect = targetWidth / targetHeight;
        this.camera.updateProjectionMatrix();
    }
}