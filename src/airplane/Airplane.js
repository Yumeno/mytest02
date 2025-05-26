import * as THREE from 'three';
import { AirplaneModel } from './AirplaneModel.js';
import { AirplanePhysics } from './AirplanePhysics.js';
import { AirplaneController } from './AirplaneController.js';

export class Airplane {
    constructor(scene) {
        this.scene = scene;
        this.model = new AirplaneModel();
        this.physics = new AirplanePhysics();
        this.controller = new AirplaneController(this);
        
        this.mesh = this.model.getModel();
        this.scene.add(this.mesh);
        
        // 初期位置設定
        this.mesh.position.copy(this.physics.position);
        
        // 衝突判定用の境界ボックス
        this.boundingBox = new THREE.Box3();
        this.updateBoundingBox();
        
        // イベントハンドラー
        this.setupEventHandlers();
        
        console.log('Airplane initialized at position:', this.physics.position);
    }

    setupEventHandlers() {
        // クラッシュイベント
        this.physics.onCrash = () => {
            this.onCrash();
        };
    }

    update(deltaTime) {
        // コントローラー更新
        this.controller.update(deltaTime);
        
        // 物理演算更新
        this.physics.update(deltaTime);
        
        // 3Dモデルの位置・回転更新
        this.updateModelTransform();
        
        // プロペラアニメーション
        this.model.updatePropeller(this.physics.controls.throttle * 10);
        
        // 境界ボックス更新
        this.updateBoundingBox();
    }

    updateModelTransform() {
        // 位置更新
        this.mesh.position.copy(this.physics.position);
        
        // 回転更新
        this.mesh.rotation.copy(this.physics.rotation);
        
        // 飛行中の微細な振動効果
        if (this.physics.isFlying()) {
            const vibration = Math.sin(Date.now() * 0.01) * 0.001;
            this.mesh.position.y += vibration;
        }
    }

    updateBoundingBox() {
        this.boundingBox.setFromObject(this.mesh);
    }

    checkGroundCollision(groundObjects = []) {
        // 地面オブジェクトとの衝突判定
        for (const ground of groundObjects) {
            const groundBox = new THREE.Box3().setFromObject(ground);
            if (this.boundingBox.intersectsBox(groundBox)) {
                // 地面の高さを取得
                this.physics.groundHeight = groundBox.max.y;
                return true;
            }
        }
        return false;
    }

    checkBuildingCollision(buildings = []) {
        // 建物との衝突判定
        for (const building of buildings) {
            const buildingBox = new THREE.Box3().setFromObject(building);
            if (this.boundingBox.intersectsBox(buildingBox)) {
                this.onBuildingCollision(building);
                return true;
            }
        }
        return false;
    }

    onCrash() {
        console.log('Airplane crashed!');
        
        // クラッシュエフェクト（簡単な例）
        this.createCrashEffect();
        
        // イベント発火
        if (this.onCrashCallback) {
            this.onCrashCallback();
        }
    }

    onBuildingCollision(building) {
        console.log('Airplane collided with building!');
        
        // 建物衝突時の処理
        this.physics.crash();
        this.createCrashEffect();
        
        if (this.onBuildingCollisionCallback) {
            this.onBuildingCollisionCallback(building);
        }
    }

    createCrashEffect() {
        // 簡単な爆発エフェクト
        const particles = new THREE.Group();
        
        for (let i = 0; i < 20; i++) {
            const particle = new THREE.Mesh(
                new THREE.SphereGeometry(0.1),
                new THREE.MeshBasicMaterial({ color: 0xff4400 })
            );
            
            particle.position.copy(this.mesh.position);
            particle.position.add(new THREE.Vector3(
                (Math.random() - 0.5) * 4,
                Math.random() * 2,
                (Math.random() - 0.5) * 4
            ));
            
            particles.add(particle);
        }
        
        this.scene.add(particles);
        
        // 3秒後にエフェクトを削除
        setTimeout(() => {
            this.scene.remove(particles);
            particles.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
        }, 3000);
    }

    // カメラ追従用のターゲット位置を取得
    getCameraTarget() {
        const offset = new THREE.Vector3(-10, 5, 0);
        offset.applyEuler(this.physics.rotation);
        return this.physics.position.clone().add(offset);
    }

    // 飛行機の前方向ベクトルを取得
    getForwardVector() {
        const forward = new THREE.Vector3(1, 0, 0);
        forward.applyEuler(this.physics.rotation);
        return forward;
    }

    // 状態情報を取得
    getFlightData() {
        return {
            position: this.physics.position.clone(),
            velocity: this.physics.velocity.clone(),
            rotation: this.physics.rotation.clone(),
            speed: this.physics.getSpeed(),
            altitude: this.physics.getAltitude(),
            heading: this.physics.getHeading(),
            isFlying: this.physics.isFlying(),
            isOnGround: this.physics.isOnGround,
            throttle: this.physics.controls.throttle,
            fuel: 1.0 // TODO: 燃料システム
        };
    }

    // 操縦系の有効化/無効化
    enableControls() {
        this.controller.activate();
    }

    disableControls() {
        this.controller.deactivate();
    }

    // 初期位置にリセット
    reset(position = new THREE.Vector3(0, 10, 0)) {
        this.physics.reset(position);
        this.mesh.position.copy(position);
        this.mesh.rotation.set(0, 0, 0);
        console.log('Airplane reset to:', position);
    }

    // クリーンアップ
    dispose() {
        this.scene.remove(this.mesh);
        this.model.dispose();
        this.controller.dispose();
        console.log('Airplane disposed');
    }

    // イベントコールバック設定
    setCrashCallback(callback) {
        this.onCrashCallback = callback;
    }

    setBuildingCollisionCallback(callback) {
        this.onBuildingCollisionCallback = callback;
    }
}