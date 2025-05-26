import { CameraController } from './CameraController.js';
import * as THREE from 'three';

export class AirplaneCameraController extends CameraController {
    constructor(camera, airplane, scene = null, options = {}) {
        super(camera, options);
        
        this.airplane = airplane;
        this.scene = scene;
        this.config = {
            followDistance: 15,
            followHeight: 5,
            lookAhead: 8,
            smoothingFactor: 0.08,
            verticalSmoothing: 0.05,
            autoSwitchDistance: 50,
            minHeight: 2,
            maxHeight: 100,
            zoomMin: 0.5,
            zoomMax: 3.0,
            zoomSpeed: 0.1,
            collisionAvoidanceDistance: 5,
            ...options.config
        };
        
        this.mode = 'chase'; // 'chase', 'cockpit', 'orbit', 'free', 'dynamic'
        this.targetPosition = new THREE.Vector3();
        this.targetLookAt = new THREE.Vector3();
        this.currentLookAt = new THREE.Vector3();
        this.previousPosition = new THREE.Vector3();
        
        this.orbitAngle = 0;
        this.orbitRadius = 20;
        this.orbitSpeed = 0.5;
        
        this.cockpitOffset = new THREE.Vector3(0, 0.5, 0);
        
        // ズーム機能
        this.zoomLevel = 1.0;
        this.targetZoom = 1.0;
        
        // 衝突判定用レイキャスター
        this.raycaster = new THREE.Raycaster();
        this.collisionObjects = [];
        
        // 動的カメラ機能
        this.dynamicSettings = {
            speedBasedDistance: true,
            altitudeBasedHeight: true,
            maneuverBasedOffset: true
        };
        
        this.setupModeKeys();
        this.setupZoomControls();
    }

    setupModeKeys() {
        this.boundKeyHandler = this.onKeyDown.bind(this);
        document.addEventListener('keydown', this.boundKeyHandler);
    }

    setupZoomControls() {
        this.boundWheelHandler = this.onWheel.bind(this);
        document.addEventListener('wheel', this.boundWheelHandler);
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
            case 'Digit5':
                this.setMode('dynamic');
                break;
            case 'KeyZ':
                this.resetZoom();
                break;
        }
    }

    onWheel(event) {
        if (!this.isActive) return;
        
        event.preventDefault();
        const delta = event.deltaY > 0 ? 1 : -1;
        this.targetZoom = Math.max(
            this.config.zoomMin,
            Math.min(this.config.zoomMax, this.targetZoom + delta * this.config.zoomSpeed)
        );
    }

    setMode(mode) {
        this.mode = mode;
        console.log(`Camera mode changed to: ${mode}`);
    }

    onUpdate(deltaTime) {
        if (!this.airplane) return;

        const airplaneData = this.airplane.getFlightData();
        
        // ズームレベルの更新
        this.updateZoom(deltaTime);
        
        // 衝突判定オブジェクトの更新
        this.updateCollisionObjects();
        
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
            case 'dynamic':
                this.updateDynamicMode(airplaneData, deltaTime);
                break;
        }
        
        // 前フレームの位置を保存
        this.previousPosition.copy(this.camera.position);
    }

    updateChaseMode(airplaneData, deltaTime) {
        // 飛行機の後方にカメラを配置
        const backwardDirection = this.airplane.getForwardVector().multiplyScalar(-1);
        const rightDirection = new THREE.Vector3(0, 1, 0).cross(backwardDirection).normalize();
        const upDirection = backwardDirection.clone().cross(rightDirection).normalize();
        
        // ズームレベルに基づく距離調整
        const adjustedDistance = this.config.followDistance * this.zoomLevel;
        const adjustedHeight = this.config.followHeight * this.zoomLevel;
        
        // 目標位置計算
        this.targetPosition.copy(airplaneData.position);
        this.targetPosition.add(backwardDirection.multiplyScalar(adjustedDistance));
        this.targetPosition.add(upDirection.multiplyScalar(adjustedHeight));
        
        // 衝突回避
        this.targetPosition = this.avoidCollisions(this.targetPosition, airplaneData.position);
        
        // 地面からの最低高度を保証
        this.targetPosition.y = Math.max(this.targetPosition.y, this.config.minHeight);
        
        // 飛行機の前方を見るための目標点
        const forwardDirection = this.airplane.getForwardVector();
        this.targetLookAt.copy(airplaneData.position);
        this.targetLookAt.add(forwardDirection.multiplyScalar(this.config.lookAhead));
        
        // 速度に基づく滑らかさの調整
        const speed = airplaneData.speed;
        const adaptiveSmoothingFactor = this.config.smoothingFactor * (1 + speed * 0.01);
        
        // スムーズな追従
        this.camera.position.lerp(this.targetPosition, Math.min(adaptiveSmoothingFactor, 0.2));
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

    updateDynamicMode(airplaneData, deltaTime) {
        // 動的カメラ：飛行機の状況に応じてカメラ設定を自動調整
        const speed = airplaneData.speed;
        const altitude = airplaneData.altitude;
        
        // 速度に基づく距離調整
        let dynamicDistance = this.config.followDistance;
        if (this.dynamicSettings.speedBasedDistance) {
            dynamicDistance += speed * 0.5; // 速度が上がるほど距離を開ける
        }
        
        // 高度に基づく高さ調整
        let dynamicHeight = this.config.followHeight;
        if (this.dynamicSettings.altitudeBasedHeight) {
            dynamicHeight = Math.max(this.config.followHeight, altitude * 0.1);
        }
        
        // 機動に基づくオフセット
        const velocity = airplaneData.velocity;
        let sideOffset = 0;
        if (this.dynamicSettings.maneuverBasedOffset && velocity.length() > 0) {
            const turnRate = velocity.clone().normalize().cross(this.airplane.getForwardVector()).length();
            sideOffset = turnRate * 5;
        }
        
        // カメラ位置計算
        const backwardDirection = this.airplane.getForwardVector().multiplyScalar(-1);
        const rightDirection = new THREE.Vector3(0, 1, 0).cross(backwardDirection).normalize();
        const upDirection = backwardDirection.clone().cross(rightDirection).normalize();
        
        this.targetPosition.copy(airplaneData.position);
        this.targetPosition.add(backwardDirection.multiplyScalar(dynamicDistance * this.zoomLevel));
        this.targetPosition.add(upDirection.multiplyScalar(dynamicHeight));
        this.targetPosition.add(rightDirection.multiplyScalar(sideOffset));
        
        // 衝突回避
        this.targetPosition = this.avoidCollisions(this.targetPosition, airplaneData.position);
        
        // 地面からの最低高度を保証
        this.targetPosition.y = Math.max(this.targetPosition.y, this.config.minHeight);
        
        // スムーズな追従
        this.camera.position.lerp(this.targetPosition, this.config.smoothingFactor);
        
        // 目標注視点
        const forwardDirection = this.airplane.getForwardVector();
        this.targetLookAt.copy(airplaneData.position);
        this.targetLookAt.add(forwardDirection.multiplyScalar(this.config.lookAhead));
        
        this.currentLookAt.lerp(this.targetLookAt, this.config.smoothingFactor);
        this.camera.lookAt(this.currentLookAt);
    }

    // ズーム機能
    updateZoom(deltaTime) {
        this.zoomLevel = THREE.MathUtils.lerp(this.zoomLevel, this.targetZoom, 0.1);
    }

    resetZoom() {
        this.targetZoom = 1.0;
    }

    // 衝突判定オブジェクトの更新
    updateCollisionObjects() {
        if (!this.scene) return;
        
        this.collisionObjects = [];
        this.scene.traverse((child) => {
            if (child.isMesh && child.name !== 'ground' && child !== this.airplane?.mesh) {
                // 建物やその他の障害物を追加
                if (child.geometry && child.geometry.type === 'BoxGeometry') {
                    this.collisionObjects.push(child);
                }
            }
        });
    }

    // 衝突回避
    avoidCollisions(targetPosition, airplanePosition) {
        if (!this.scene || this.collisionObjects.length === 0) {
            return targetPosition;
        }

        const safePosition = targetPosition.clone();
        const direction = targetPosition.clone().sub(airplanePosition).normalize();
        
        // レイキャスティングで衝突をチェック
        this.raycaster.set(airplanePosition, direction);
        const intersections = this.raycaster.intersectObjects(this.collisionObjects);
        
        if (intersections.length > 0) {
            const firstIntersection = intersections[0];
            const distance = firstIntersection.distance;
            
            // 衝突が予想される場合、カメラを迂回させる
            if (distance < this.config.collisionAvoidanceDistance) {
                // 上方向への回避
                safePosition.y += this.config.collisionAvoidanceDistance;
                
                // 再度チェック
                const upDirection = new THREE.Vector3(0, 1, 0);
                this.raycaster.set(safePosition, upDirection.clone().negate());
                const upIntersections = this.raycaster.intersectObjects(this.collisionObjects);
                
                if (upIntersections.length > 0 && upIntersections[0].distance < 2) {
                    // 側面への回避
                    const sideVector = new THREE.Vector3(1, 0, 0);
                    sideVector.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);
                    safePosition.add(sideVector.multiplyScalar(this.config.collisionAvoidanceDistance));
                }
            }
        }
        
        return safePosition;
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

    // 動的設定の取得・設定
    getDynamicSettings() {
        return { ...this.dynamicSettings };
    }

    updateDynamicSettings(settings) {
        this.dynamicSettings = { ...this.dynamicSettings, ...settings };
    }

    // カメラ情報の拡張
    getCameraInfo() {
        return {
            mode: this.mode,
            position: this.camera.position.clone(),
            lookAt: this.currentLookAt.clone(),
            followDistance: this.config.followDistance,
            followHeight: this.config.followHeight,
            orbitRadius: this.orbitRadius,
            zoomLevel: this.zoomLevel,
            targetZoom: this.targetZoom,
            dynamicSettings: { ...this.dynamicSettings }
        };
    }

    // クリーンアップ
    dispose() {
        super.dispose();
        if (this.boundKeyHandler) {
            document.removeEventListener('keydown', this.boundKeyHandler);
        }
        if (this.boundWheelHandler) {
            document.removeEventListener('wheel', this.boundWheelHandler);
        }
    }
}