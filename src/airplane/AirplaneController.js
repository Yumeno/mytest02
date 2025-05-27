import * as THREE from 'three';

export class AirplaneController {
    constructor(airplane) {
        this.airplane = airplane;
        this.keys = {};
        this.isActive = false;
        
        this.keyBindings = {
            // 基本操縦
            'KeyW': 'throttleUp',
            'KeyS': 'throttleDown',
            'KeyA': 'yawLeft',
            'KeyD': 'yawRight',
            'ArrowUp': 'pitchDown',
            'ArrowDown': 'pitchUp',
            'ArrowLeft': 'rollLeft',
            'ArrowRight': 'rollRight',
            
            // 特殊操作
            'KeyR': 'reset',
            'Space': 'brake',
            'ShiftLeft': 'boost'
        };
        
        this.controlValues = {
            throttle: 0,
            pitch: 0,
            yaw: 0,
            roll: 0
        };
        
        // キー押下時間を追跡
        this.keyPressTimes = {
            pitch: 0,
            roll: 0
        };
        
        this.sensitivity = {
            throttle: 0.02,
            pitch: 0.04,
            yaw: 0.03,
            roll: 0.05
        };
        
        // 段階的加速のパラメータ
        this.acceleration = {
            rampUpTime: 1.5, // 最大角速度到達までの時間（秒）
            maxAngularVelocity: {
                pitch: 1.0, // 最大角速度
                roll: 1.2
            }
        };
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.boundKeyDown = this.onKeyDown.bind(this);
        this.boundKeyUp = this.onKeyUp.bind(this);
        
        document.addEventListener('keydown', this.boundKeyDown);
        document.addEventListener('keyup', this.boundKeyUp);
    }

    removeEventListeners() {
        document.removeEventListener('keydown', this.boundKeyDown);
        document.removeEventListener('keyup', this.boundKeyUp);
    }

    onKeyDown(event) {
        if (!this.isActive) return;
        
        event.preventDefault();
        this.keys[event.code] = true;
        
        // 即座に実行される操作
        if (event.code === 'KeyR') {
            this.resetAirplane();
        }
    }

    onKeyUp(event) {
        if (!this.isActive) return;
        
        event.preventDefault();
        this.keys[event.code] = false;
    }

    update(deltaTime) {
        if (!this.isActive) return;
        
        this.updateThrottle(deltaTime);
        this.updatePitch(deltaTime);
        this.updateYaw(deltaTime);
        this.updateRoll(deltaTime);
        this.updateSpecialControls();
        
        // 飛行機の物理エンジンに制御値を適用
        this.airplane.physics.setThrottle(this.controlValues.throttle);
        this.airplane.physics.setPitch(this.controlValues.pitch);
        this.airplane.physics.setYaw(this.controlValues.yaw);
        this.airplane.physics.setRoll(this.controlValues.roll);
    }

    updateThrottle(deltaTime) {
        const throttleChange = this.sensitivity.throttle;
        
        if (this.keys['KeyW']) {
            this.controlValues.throttle = Math.min(1, this.controlValues.throttle + throttleChange);
        } else if (this.keys['KeyS']) {
            this.controlValues.throttle = Math.max(0, this.controlValues.throttle - throttleChange);
        } else {
            // スロットルをゆっくり下げる（アイドル位置へ）
            this.controlValues.throttle = Math.max(0.1, this.controlValues.throttle - throttleChange * 0.5);
        }
        
        // ブースト機能
        if (this.keys['ShiftLeft']) {
            this.controlValues.throttle = Math.min(1, this.controlValues.throttle * 1.2);
        }
    }

    updatePitch(deltaTime) {
        const returnSpeed = 0.08; // 中立位置への復帰速度
        
        if (this.keys['ArrowUp'] || this.keys['ArrowDown']) {
            // キー押下時間を増加
            this.keyPressTimes.pitch += deltaTime;
            
            // 段階的加速：0から最大値まで滑らかに
            const accelerationFactor = Math.min(1, this.keyPressTimes.pitch / this.acceleration.rampUpTime);
            const currentMaxVelocity = this.acceleration.maxAngularVelocity.pitch * accelerationFactor;
            
            if (this.keys['ArrowUp']) {
                this.controlValues.pitch = Math.max(-currentMaxVelocity, this.controlValues.pitch - this.sensitivity.pitch * accelerationFactor);
            } else if (this.keys['ArrowDown']) {
                this.controlValues.pitch = Math.min(currentMaxVelocity, this.controlValues.pitch + this.sensitivity.pitch * accelerationFactor);
            }
        } else {
            // キー押下時間をリセット
            this.keyPressTimes.pitch = 0;
            
            // 中立位置に戻す
            if (this.controlValues.pitch > 0) {
                this.controlValues.pitch = Math.max(0, this.controlValues.pitch - returnSpeed);
            } else {
                this.controlValues.pitch = Math.min(0, this.controlValues.pitch + returnSpeed);
            }
        }
    }

    updateYaw(deltaTime) {
        const returnSpeed = 0.03;
        
        if (this.keys['KeyA']) {
            this.controlValues.yaw = Math.min(1, this.controlValues.yaw + this.sensitivity.yaw);
        } else if (this.keys['KeyD']) {
            this.controlValues.yaw = Math.max(-1, this.controlValues.yaw - this.sensitivity.yaw);
        } else {
            // 中立位置に戻す
            if (this.controlValues.yaw > 0) {
                this.controlValues.yaw = Math.max(0, this.controlValues.yaw - returnSpeed);
            } else {
                this.controlValues.yaw = Math.min(0, this.controlValues.yaw + returnSpeed);
            }
        }
    }

    updateRoll(deltaTime) {
        const returnSpeed = 0.06; // 中立位置への復帰速度
        
        if (this.keys['ArrowLeft'] || this.keys['ArrowRight']) {
            // キー押下時間を増加
            this.keyPressTimes.roll += deltaTime;
            
            // 段階的加速：0から最大値まで滑らかに
            const accelerationFactor = Math.min(1, this.keyPressTimes.roll / this.acceleration.rampUpTime);
            const currentMaxVelocity = this.acceleration.maxAngularVelocity.roll * accelerationFactor;
            
            if (this.keys['ArrowLeft']) {
                this.controlValues.roll = Math.max(-currentMaxVelocity, this.controlValues.roll - this.sensitivity.roll * accelerationFactor);
            } else if (this.keys['ArrowRight']) {
                this.controlValues.roll = Math.min(currentMaxVelocity, this.controlValues.roll + this.sensitivity.roll * accelerationFactor);
            }
        } else {
            // キー押下時間をリセット
            this.keyPressTimes.roll = 0;
            
            // 中立位置に戻す
            if (this.controlValues.roll > 0) {
                this.controlValues.roll = Math.max(0, this.controlValues.roll - returnSpeed);
            } else {
                this.controlValues.roll = Math.min(0, this.controlValues.roll + returnSpeed);
            }
        }
    }

    updateSpecialControls() {
        // ブレーキ機能
        if (this.keys['Space']) {
            if (this.airplane.physics.isOnGround) {
                // 地上ブレーキ
                this.airplane.physics.velocity.multiplyScalar(0.95);
            } else {
                // エアブレーキ（抗力増加）
                this.airplane.physics.drag *= 1.5;
            }
        }
    }

    resetAirplane() {
        // 飛行機を初期位置にリセット
        const resetPosition = new THREE.Vector3(0, 10, 0);
        this.airplane.physics.reset(resetPosition);
        this.airplane.model.getModel().position.copy(resetPosition);
        this.airplane.model.getModel().rotation.set(0, 0, 0);
        
        // 制御値もリセット
        this.controlValues = {
            throttle: 0,
            pitch: 0,
            yaw: 0,
            roll: 0
        };
        
        // キー押下時間もリセット
        this.keyPressTimes = {
            pitch: 0,
            roll: 0
        };
        
        console.log('Airplane reset to initial position');
    }

    activate() {
        this.isActive = true;
        console.log('Airplane controls activated');
    }

    deactivate() {
        this.isActive = false;
        // 制御値をリセット
        this.controlValues = {
            throttle: 0,
            pitch: 0,
            yaw: 0,
            roll: 0
        };
        
        // キー押下時間もリセット
        this.keyPressTimes = {
            pitch: 0,
            roll: 0
        };
        console.log('Airplane controls deactivated');
    }

    getControlStatus() {
        return {
            isActive: this.isActive,
            throttle: this.controlValues.throttle,
            pitch: this.controlValues.pitch,
            yaw: this.controlValues.yaw,
            roll: this.controlValues.roll,
            keys: Object.keys(this.keys).filter(key => this.keys[key])
        };
    }

    dispose() {
        this.removeEventListeners();
        this.isActive = false;
    }
}