export class CameraManager {
    constructor(camera) {
        this.camera = camera;
        this.controllers = new Map();
        this.currentController = null;
        this.lastTime = performance.now();
    }

    addController(name, controller) {
        this.controllers.set(name, controller);
        return this;
    }

    removeController(name) {
        const controller = this.controllers.get(name);
        if (controller) {
            if (this.currentController === controller) {
                this.currentController.deactivate();
                this.currentController = null;
            }
            controller.dispose();
            this.controllers.delete(name);
        }
        return this;
    }

    switchController(name) {
        const newController = this.controllers.get(name);
        if (!newController) {
            console.warn(`Camera controller '${name}' not found`);
            return false;
        }

        if (this.currentController) {
            this.currentController.deactivate();
        }

        this.currentController = newController;
        this.currentController.activate();
        return true;
    }

    update() {
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        if (this.currentController) {
            this.currentController.update(deltaTime);
        }
    }

    getCurrentController() {
        return this.currentController;
    }

    getController(name) {
        return this.controllers.get(name);
    }

    getControllerNames() {
        return Array.from(this.controllers.keys());
    }

    dispose() {
        if (this.currentController) {
            this.currentController.deactivate();
        }
        
        this.controllers.forEach(controller => {
            controller.dispose();
        });
        
        this.controllers.clear();
        this.currentController = null;
    }
}