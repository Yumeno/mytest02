import { CameraController } from './CameraController.js';
import * as THREE from 'three';

export class AirplaneCameraController extends CameraController {
    constructor(camera, airplane, options = {}) {
        super(camera, options);
        
        this.airplane = airplane;
        this.config = {
            followDistance: 15,
            followHeight: 5,
            lookAhead: 8,
            smoothingFactor: 0.05,
            verticalSmoothing: 0.03,
            autoSwitchDistance: 50,
            minHeight: 2,
            maxHeight: 100,
            ...options.config
        };
        
        this.mode = 'chase'; // 'chase', 'cockpit', 'orbit', 'free'
        this.targetPosition = new THREE.Vector3();
        this.targetLookAt = new THREE.Vector3();
        this.currentLookAt = new THREE.Vector3();
        
        this.orbitAngle = 0;
        this.orbitRadius = 20;
        this.orbitSpeed = 0.5;
        
        this.cockpitOffset = new THREE.Vector3(0, 0.5, 0);
        
        this.setupModeKeys();
    }

    setupModeKeys() {
        this.boundKeyHandler = this.onKeyDown.bind(this);
        document.addEventListener('keydown', this.boundKeyHandler);
    }

    onKeyDown(event) {
        switch (event.code) {
            case 'Digit1':
                this.setMode('chase');
                break;
            case 'Digit2':
                this.setMode('cockpit');
                break;
            case 'Digit3':
                this.setMode('orbit');
                break;
            case 'Digit4':
                this.setMode('free');
                break;
        }
    }

    setMode(mode) {
        this.mode = mode;
        console.log(`Camera mode changed to: ${mode}`);
    }

    onUpdate(deltaTime) {
        if (!this.airplane) return;

        const airplaneData = this.airplane.getFlightData();
        
        switch (this.mode) {
            case 'chase':
                this.updateChaseMode(airplaneData, deltaTime);
                break;
            case 'cockpit':
                this.updateCockpitMode(airplaneData, deltaTime);
                break;
            case 'orbit':
                this.updateOrbitMode(airplaneData, deltaTime);
                break;
            case 'free':
                this.updateFreeMode(airplaneData, deltaTime);
                break;
        }
    }

    updateChaseMode(airplaneData, deltaTime) {
        // 飛行機の後方にカメラを配置
        const backwardDirection = this.airplane.getForwardVector().multiplyScalar(-1);
        const rightDirection = new THREE.Vector3(0, 1, 0).cross(backwardDirection).normalize();
        const upDirection = backwardDirection.clone().cross(rightDirection).normalize();
        
        // 目標位置計算
        this.targetPosition.copy(airplaneData.position);
        this.targetPosition.add(backwardDirection.multiplyScalar(this.config.followDistance));
        this.targetPosition.add(upDirection.multiplyScalar(this.config.followHeight));
        
        // 地面からの最低高度を保証
        this.targetPosition.y = Math.max(this.targetPosition.y, this.config.minHeight);
        
        // 飛行機の前方を見るための目標点
        const forwardDirection = this.airplane.getForwardVector();
        this.targetLookAt.copy(airplaneData.position);
        this.targetLookAt.add(forwardDirection.multiplyScalar(this.config.lookAhead));
        
        // スムーズな追従
        this.camera.position.lerp(this.targetPosition, this.config.smoothingFactor);
        this.currentLookAt.lerp(this.targetLookAt, this.config.smoothingFactor);
        this.camera.lookAt(this.currentLookAt);
    }

    updateCockpitMode(airplaneData, deltaTime) {
        // コックピット視点
        const cockpitPosition = airplaneData.position.clone();
        cockpitPosition.add(this.cockpitOffset);
        
        // 飛行機の向きに合わせて回転
        const forwardDirection = this.airplane.getForwardVector();
        const lookAtPosition = cockpitPosition.clone().add(forwardDirection.multiplyScalar(10));
        
        this.camera.position.copy(cockpitPosition);
        this.camera.lookAt(lookAtPosition);
        
        // 飛行機の傾きを反映
        this.camera.rotation.z = airplaneData.rotation.z;
    }

    updateOrbitMode(airplaneData, deltaTime) {
        // 軌道カメラ（飛行機の周りを回転）
        this.orbitAngle += this.orbitSpeed * deltaTime;
        
        const x = Math.cos(this.orbitAngle) * this.orbitRadius;
        const z = Math.sin(this.orbitAngle) * this.orbitRadius;
        
        this.camera.position.set(
            airplaneData.position.x + x,
            airplaneData.position.y + this.config.followHeight,
            airplaneData.position.z + z
        );
        
        this.camera.lookAt(airplaneData.position);
    }

    updateFreeMode(airplaneData, deltaTime) {
        // 自由カメラ（自動切り替えなし）
        const distance = this.camera.position.distanceTo(airplaneData.position);
        
        // 飛行機が遠すぎる場合は自動的にチェイスモードに切り替え
        if (distance > this.config.autoSwitchDistance) {
            this.setMode('chase');
            return;
        }
        
        // 基本的には現在の位置を維持
        // 必要に応じて手動操作を追加
    }

    // 飛行機との距離を調整
    adjustDistance(delta) {
        this.config.followDistance = Math.max(5, Math.min(50, this.config.followDistance + delta));
    }

    // カメラの高さを調整
    adjustHeight(delta) {
        this.config.followHeight = Math.max(-5, Math.min(20, this.config.followHeight + delta));
    }

    // 軌道カメラの半径を調整
    adjustOrbitRadius(delta) {
        this.orbitRadius = Math.max(10, Math.min(100, this.orbitRadius + delta));
    }

    // カメラ設定の取得
    getCameraInfo() {
        return {
            mode: this.mode,
            position: this.camera.position.clone(),
            lookAt: this.currentLookAt.clone(),
            followDistance: this.config.followDistance,
            followHeight: this.config.followHeight,
            orbitRadius: this.orbitRadius
        };
    }

    // 設定のリセット
    resetSettings() {
        this.config.followDistance = 15;
        this.config.followHeight = 5;
        this.orbitRadius = 20;
        this.orbitAngle = 0;
        this.setMode('chase');
    }

    // クリーンアップ
    dispose() {
        super.dispose();
        if (this.boundKeyHandler) {
            document.removeEventListener('keydown', this.boundKeyHandler);
        }
    }
}