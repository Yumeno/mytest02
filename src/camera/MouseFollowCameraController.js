import { CameraController } from './CameraController.js';

export class MouseFollowCameraController extends CameraController {
    constructor(camera, options = {}) {
        super(camera, options);
        
        this.state = {
            isRotating: false,
            mouseX: 0,
            mouseY: 0,
            targetX: 0,
            targetY: 0,
            time: 0
        };

        this.config = {
            rotationSpeed: 0.005,
            smoothingFactor: 0.05,
            mouseSensitivity: 0.2,
            autoRotationRadius: 70,
            autoRotationSpeed: 0.3,
            verticalSpeed: 0.2,
            baseHeight: 30,
            verticalRange: 10,
            mouseRange: 20,
            ...options.config
        };

        this.boundHandlers = {
            onMouseMove: this.onMouseMove.bind(this),
            onClick: this.onClick.bind(this)
        };
    }

    setupEventListeners() {
        document.addEventListener('mousemove', this.boundHandlers.onMouseMove);
        document.addEventListener('click', this.boundHandlers.onClick);
    }

    removeEventListeners() {
        document.removeEventListener('mousemove', this.boundHandlers.onMouseMove);
        document.removeEventListener('click', this.boundHandlers.onClick);
    }

    onMouseMove(event) {
        this.state.mouseX = (event.clientX / window.innerWidth) * 2 - 1;
        this.state.mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    onClick() {
        this.state.isRotating = !this.state.isRotating;
    }

    onUpdate(deltaTime) {
        this.state.time += deltaTime;

        if (this.state.isRotating) {
            this.updateAutoRotation();
        } else {
            this.updateMouseFollow();
        }
    }

    updateAutoRotation() {
        const radius = this.config.autoRotationRadius;
        this.camera.position.x = Math.cos(this.state.time * this.config.autoRotationSpeed) * radius;
        this.camera.position.z = Math.sin(this.state.time * this.config.autoRotationSpeed) * radius;
        this.camera.position.y = this.config.baseHeight + Math.sin(this.state.time * this.config.verticalSpeed) * this.config.verticalRange;
        this.camera.lookAt(0, 0, 0);
    }

    updateMouseFollow() {
        this.state.targetX = this.state.mouseX * this.config.mouseSensitivity;
        this.state.targetY = this.state.mouseY * this.config.mouseSensitivity;
        
        const targetPosX = this.state.targetX * 50;
        const targetPosY = this.config.baseHeight + this.state.targetY * this.config.mouseRange;
        
        this.camera.position.x += (targetPosX - this.camera.position.x) * this.config.smoothingFactor;
        this.camera.position.y += (targetPosY - this.camera.position.y) * this.config.smoothingFactor;
        this.camera.lookAt(0, 0, 0);
    }

    getState() {
        return { ...this.state };
    }

    setState(newState) {
        this.state = { ...this.state, ...newState };
    }

    getConfig() {
        return { ...this.config };
    }

    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }
}