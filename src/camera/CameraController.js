export class CameraController {
    constructor(camera, options = {}) {
        this.camera = camera;
        this.isActive = false;
        this.options = {
            enableEvents: true,
            ...options
        };
    }

    activate() {
        if (this.isActive) return;
        this.isActive = true;
        if (this.options.enableEvents) {
            this.setupEventListeners();
        }
        this.onActivate();
    }

    deactivate() {
        if (!this.isActive) return;
        this.isActive = false;
        if (this.options.enableEvents) {
            this.removeEventListeners();
        }
        this.onDeactivate();
    }

    update(deltaTime) {
        if (!this.isActive) return;
        this.onUpdate(deltaTime);
    }

    setupEventListeners() {
        // Override in subclasses
    }

    removeEventListeners() {
        // Override in subclasses
    }

    onActivate() {
        // Override in subclasses
    }

    onDeactivate() {
        // Override in subclasses
    }

    onUpdate(deltaTime) {
        // Override in subclasses
    }

    dispose() {
        this.deactivate();
    }
}