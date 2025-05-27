import * as THREE from 'three';

export class AirplaneDebugger {
    constructor(airplane, scene) {
        this.airplane = airplane;
        this.scene = scene;
        
        this.isDebugMode = false;
        this.debugUI = null;
        
        // デバッグモード時の初期位置
        this.debugInitialPosition = new THREE.Vector3(0, 10, 0);
        this.debugInitialRotation = new THREE.Euler(0, 0, 0);
        
        // 座標軸表示用のヘルパー
        this.worldAxisHelper = null;
        this.airplaneAxisHelper = null;
        
        // デバッグ操作の感度
        this.debugControlSensitivity = {
            roll: 0.02,
            pitch: 0.02,
            yaw: 0.02
        };
        
        this.setupDebugControls();
        this.createAxisHelpers();
        this.createDebugUI();
    }

    setupDebugControls() {
        this.boundKeyDown = this.onKeyDown.bind(this);
        document.addEventListener('keydown', this.boundKeyDown);
    }

    onKeyDown(event) {
        // Dキーでデバッグモード切り替え
        if (event.code === 'KeyF') {
            event.preventDefault();
            this.toggleDebugMode();
        }
        
        // デバッグモード中の手動制御
        if (this.isDebugMode) {
            this.handleDebugControls(event);
        }
    }

    handleDebugControls(event) {
        const airplane = this.airplane;
        const currentRotation = airplane.physics.rotation;
        
        event.preventDefault();
        
        switch(event.code) {
            case 'ArrowLeft':
                // ロール軸回転（左）
                airplane.physics.rotation.z += this.debugControlSensitivity.roll;
                break;
            case 'ArrowRight':
                // ロール軸回転（右）
                airplane.physics.rotation.z -= this.debugControlSensitivity.roll;
                break;
            case 'ArrowUp':
                // ピッチ軸回転（上）
                airplane.physics.rotation.x -= this.debugControlSensitivity.pitch;
                break;
            case 'ArrowDown':
                // ピッチ軸回転（下）
                airplane.physics.rotation.x += this.debugControlSensitivity.pitch;
                break;
            case 'KeyQ':
                // ヨー軸回転（左）
                airplane.physics.rotation.y += this.debugControlSensitivity.yaw;
                break;
            case 'KeyE':
                // ヨー軸回転（右）
                airplane.physics.rotation.y -= this.debugControlSensitivity.yaw;
                break;
            case 'KeyR':
                // デバッグモードでのリセット
                this.resetToDebugPosition();
                break;
        }
        
        // 機体モデルの回転を即座に更新
        airplane.mesh.rotation.copy(airplane.physics.rotation);
    }

    toggleDebugMode() {
        this.isDebugMode = !this.isDebugMode;
        
        if (this.isDebugMode) {
            this.enterDebugMode();
        } else {
            this.exitDebugMode();
        }
        
        // デバッグUI更新
        this.updateDebugUI();
        
        console.log(`Debug mode: ${this.isDebugMode ? 'ON' : 'OFF'}`);
    }

    enterDebugMode() {
        // 機体をデバッグ位置に移動
        this.resetToDebugPosition();
        
        // 物理シミュレーションを無効化
        this.airplane.physics.isDebugMode = true;
        
        // 操縦系を無効化
        this.airplane.disableControls();
        
        // 座標軸を表示
        this.showAxisHelpers();
        
        console.log('Entered debug mode - Physics disabled, manual control enabled');
    }

    exitDebugMode() {
        // 物理シミュレーションを有効化
        this.airplane.physics.isDebugMode = false;
        
        // 操縦系を有効化
        this.airplane.enableControls();
        
        // 座標軸を非表示
        this.hideAxisHelpers();
        
        console.log('Exited debug mode - Physics enabled, normal control restored');
    }

    resetToDebugPosition() {
        // 機体を初期位置に固定
        this.airplane.physics.position.copy(this.debugInitialPosition);
        this.airplane.physics.rotation.copy(this.debugInitialRotation);
        this.airplane.physics.velocity.set(0, 0, 0);
        this.airplane.physics.acceleration.set(0, 0, 0);
        this.airplane.physics.angularVelocity.set(0, 0, 0);
        
        // 制御値もリセット
        this.airplane.physics.controls = {
            throttle: 0,
            pitch: 0,
            yaw: 0,
            roll: 0
        };
        
        // 機体モデルの位置・回転を更新
        this.airplane.mesh.position.copy(this.debugInitialPosition);
        this.airplane.mesh.rotation.copy(this.debugInitialRotation);
        
        console.log('Reset airplane to debug position');
    }

    createAxisHelpers() {
        // 世界座標系の軸ヘルパー（原点に固定）
        this.worldAxisHelper = new THREE.AxesHelper(5);
        this.worldAxisHelper.position.set(0, 0.1, 0); // 地面の少し上に表示
        
        // 機体相対座標系の軸ヘルパー
        this.airplaneAxisHelper = new THREE.AxesHelper(3);
        
        // 軸の色を明確にするためのラベル
        this.createAxisLabels();
    }

    createAxisLabels() {
        // 世界座標系のラベル（CSS2DRenderer を使わずに簡易実装）
        const loader = new THREE.FontLoader();
        
        // 簡易ラベル用のスプライト
        this.worldAxisLabels = this.createSimpleAxisLabels('World', 0x000000);
        this.airplaneAxisLabels = this.createSimpleAxisLabels('Aircraft', 0xffffff);
    }

    createSimpleAxisLabels(prefix, color) {
        const labels = new THREE.Group();
        
        // X軸ラベル（赤）
        const xLabel = this.createTextSprite(`${prefix} X`, 0xff0000);
        xLabel.position.set(5.5, 0, 0);
        labels.add(xLabel);
        
        // Y軸ラベル（緑）
        const yLabel = this.createTextSprite(`${prefix} Y`, 0x00ff00);
        yLabel.position.set(0, 5.5, 0);
        labels.add(yLabel);
        
        // Z軸ラベル（青）
        const zLabel = this.createTextSprite(`${prefix} Z`, 0x0000ff);
        zLabel.position.set(0, 0, 5.5);
        labels.add(zLabel);
        
        return labels;
    }

    createTextSprite(text, color) {
        // Canvas でテキストを描画してスプライトを作成
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        canvas.width = 256;
        canvas.height = 64;
        
        context.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
        context.font = 'Bold 40px Arial';
        context.fillText(text, 10, 45);
        
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(spriteMaterial);
        
        sprite.scale.set(2, 0.5, 1);
        return sprite;
    }

    showAxisHelpers() {
        // 世界座標系軸を表示
        if (this.worldAxisHelper && !this.scene.children.includes(this.worldAxisHelper)) {
            this.scene.add(this.worldAxisHelper);
            this.scene.add(this.worldAxisLabels);
        }
        
        // 機体相対座標系軸を表示
        if (this.airplaneAxisHelper && !this.airplane.mesh.children.includes(this.airplaneAxisHelper)) {
            this.airplane.mesh.add(this.airplaneAxisHelper);
            this.airplane.mesh.add(this.airplaneAxisLabels);
        }
    }

    hideAxisHelpers() {
        // 世界座標系軸を非表示
        if (this.worldAxisHelper && this.scene.children.includes(this.worldAxisHelper)) {
            this.scene.remove(this.worldAxisHelper);
            this.scene.remove(this.worldAxisLabels);
        }
        
        // 機体相対座標系軸を非表示
        if (this.airplaneAxisHelper && this.airplane.mesh.children.includes(this.airplaneAxisHelper)) {
            this.airplane.mesh.remove(this.airplaneAxisHelper);
            this.airplane.mesh.remove(this.airplaneAxisLabels);
        }
    }

    createDebugUI() {
        // デバッグ情報表示用のDIV要素を作成
        this.debugUI = document.createElement('div');
        this.debugUI.id = 'debug-ui';
        this.debugUI.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 15px;
            font-family: monospace;
            font-size: 12px;
            border-radius: 5px;
            z-index: 1000;
            display: none;
        `;
        
        document.body.appendChild(this.debugUI);
    }

    updateDebugUI() {
        if (!this.debugUI) return;
        
        if (this.isDebugMode) {
            const airplane = this.airplane;
            const pos = airplane.physics.position;
            const rot = airplane.physics.rotation;
            
            this.debugUI.innerHTML = `
                <h4>🔧 DEBUG MODE</h4>
                <p><strong>操作方法:</strong></p>
                <p>F: デバッグモード切替</p>
                <p>↑↓: ピッチ | ←→: ロール</p>
                <p>Q/E: ヨー | R: リセット</p>
                <hr>
                <p><strong>位置:</strong></p>
                <p>X: ${pos.x.toFixed(2)}</p>
                <p>Y: ${pos.y.toFixed(2)}</p>
                <p>Z: ${pos.z.toFixed(2)}</p>
                <hr>
                <p><strong>回転 (rad):</strong></p>
                <p>Pitch: ${rot.x.toFixed(3)}</p>
                <p>Yaw: ${rot.y.toFixed(3)}</p>
                <p>Roll: ${rot.z.toFixed(3)}</p>
                <hr>
                <p><strong>回転 (度):</strong></p>
                <p>Pitch: ${(rot.x * 180 / Math.PI).toFixed(1)}°</p>
                <p>Yaw: ${(rot.y * 180 / Math.PI).toFixed(1)}°</p>
                <p>Roll: ${(rot.z * 180 / Math.PI).toFixed(1)}°</p>
            `;
            this.debugUI.style.display = 'block';
        } else {
            this.debugUI.style.display = 'none';
        }
    }

    update() {
        // デバッグモード中の更新処理
        if (this.isDebugMode) {
            // 機体を固定位置に維持
            this.airplane.physics.position.copy(this.debugInitialPosition);
            
            // デバッグUI更新
            this.updateDebugUI();
        }
    }

    dispose() {
        // イベントリスナーの削除
        if (this.boundKeyDown) {
            document.removeEventListener('keydown', this.boundKeyDown);
        }
        
        // デバッグUI削除
        if (this.debugUI && this.debugUI.parentNode) {
            this.debugUI.parentNode.removeChild(this.debugUI);
        }
        
        // 座標軸ヘルパーの削除
        this.hideAxisHelpers();
        
        // リソースのクリーンアップ
        if (this.worldAxisHelper) {
            this.worldAxisHelper.dispose();
        }
        if (this.airplaneAxisHelper) {
            this.airplaneAxisHelper.dispose();
        }
    }
}