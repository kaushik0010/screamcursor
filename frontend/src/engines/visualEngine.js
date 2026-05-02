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

    loadActor(actor) {
        if (this.currentActor) {
            this.scene.remove(this.currentActor.getMesh());
        }
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
            // Pull the camera WAY back so the giant head looks small
            this.camera.position.z = 300; 
            targetWidth = 380;
            targetHeight = 250;
        } else {
            // Push the camera back to its original native position
            this.camera.position.z = 200; 
            targetWidth = window.innerWidth;
            targetHeight = window.innerHeight;
        }

        // Force the exact math, completely bypassing DOM measuring
        this.renderer.setSize(targetWidth, targetHeight);
        this.camera.aspect = targetWidth / targetHeight;
        this.camera.updateProjectionMatrix();
    }
}