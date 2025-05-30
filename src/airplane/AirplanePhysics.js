import * as THREE from 'three';

export class AirplanePhysics {
    constructor() {
        this.position = new THREE.Vector3(0, 5, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.acceleration = new THREE.Vector3(0, 0, 0);
        this.rotation = new THREE.Euler(0, 0, 0);
        this.angularVelocity = new THREE.Vector3(0, 0, 0);
        
        this.mass = 1000; // kg
        this.thrust = 0;
        this.maxThrust = 15000; // N
        this.drag = 0.02;
        this.lift = 0;
        this.gravity = -9.81; // m/s²
        
        this.isOnGround = false;
        this.groundHeight = 0;
        this.stallSpeed = 8; // m/s
        this.takeoffSpeed = 12; // m/s
        
        // デバッグモードフラグ
        this.isDebugMode = false;
        
        this.controls = {
            throttle: 0, // 0-1
            pitch: 0, // -1 to 1
            yaw: 0, // -1 to 1
            roll: 0 // -1 to 1
        };
        
        this.maxAngularVelocity = {
            pitch: 1.5, // rad/s
            yaw: 1.0,
            roll: 2.0
        };
    }

    update(deltaTime) {
        // デバッグモード時は物理演算をスキップ
        if (this.isDebugMode) {
            return;
        }
        
        this.updateThrust();
        this.updateAerodynamics();
        this.updateForces(deltaTime);
        this.updatePosition(deltaTime);
        this.updateRotation(deltaTime);
        this.checkGroundCollision();
        this.applyLimits();
    }

    updateThrust() {
        this.thrust = this.controls.throttle * this.maxThrust;
    }

    updateAerodynamics() {
        const speed = this.velocity.length();
        const airDensity = 1.225; // kg/m³ at sea level
        const wingArea = 12; // m²
        const baseLiftCoefficient = 0.6; // より強い基本揚力
        
        // 動圧
        const dynamicPressure = 0.5 * airDensity * speed * speed;
        
        // 簡略化された揚力モデル：速度と迎角の組み合わせ
        const angleOfAttack = this.rotation.z; // ピッチ角を迎角として使用（Z軸周り）
        
        // より直感的な揚力計算：基本揚力 + 迎角による変化
        const baseSpeedLift = speed > this.stallSpeed ? baseLiftCoefficient : baseLiftCoefficient * (speed / this.stallSpeed);
        const angleEffect = Math.sin(angleOfAttack) * 0.8; // 迎角効果を強化
        const effectiveLiftCoeff = baseSpeedLift + angleEffect;
        
        this.lift = dynamicPressure * wingArea * effectiveLiftCoeff;
        
        // 失速チェック（より緩やか）
        if (Math.abs(angleOfAttack) > Math.PI / 4) { // 45度以上で失速開始
            const stallFactor = 1 - Math.min(1, (Math.abs(angleOfAttack) - Math.PI / 4) / (Math.PI / 6));
            this.lift *= Math.max(0.2, stallFactor);
        }
        
        // 最低揚力を保証（飛行感を向上）
        if (speed > this.stallSpeed) {
            this.lift = Math.max(this.lift, this.mass * 0.3); // 重量の30%は最低保証
        }
    }

    updateForces(deltaTime) {
        // 推力（機体前方向）
        const thrustForce = new THREE.Vector3(this.thrust, 0, 0);
        thrustForce.applyEuler(this.rotation);

        // 重力
        const gravityForce = new THREE.Vector3(0, this.mass * this.gravity, 0);

        // 揚力（機体上方向）
        const liftForce = new THREE.Vector3(0, this.lift, 0);
        liftForce.applyEuler(this.rotation);

        // 抗力（速度の逆方向）
        const speed = this.velocity.length();
        const dragForce = this.velocity.clone().normalize().multiplyScalar(-this.drag * speed * speed);

        // 地面摩擦
        const frictionForce = new THREE.Vector3(0, 0, 0);
        if (this.isOnGround) {
            frictionForce.copy(this.velocity).multiplyScalar(-0.8);
            frictionForce.y = 0; // 垂直摩擦は除く
        }

        // 合力計算
        const totalForce = new THREE.Vector3();
        totalForce.add(thrustForce);
        totalForce.add(gravityForce);
        totalForce.add(liftForce);
        totalForce.add(dragForce);
        totalForce.add(frictionForce);

        // 加速度更新（F = ma）
        this.acceleration.copy(totalForce).divideScalar(this.mass);
    }

    updatePosition(deltaTime) {
        // 速度更新
        this.velocity.add(this.acceleration.clone().multiplyScalar(deltaTime));
        
        // 位置更新
        this.position.add(this.velocity.clone().multiplyScalar(deltaTime));
    }

    updateRotation(deltaTime) {
        const speed = this.velocity.length();
        const controlEffectiveness = Math.min(speed / 10, 1.0); // 速度が低いと操縦効果低下
        
        // 角速度更新（正しい航空機座標系）
        this.angularVelocity.x = this.controls.roll * this.maxAngularVelocity.roll * controlEffectiveness;  // ロール：X軸（前方）周り
        this.angularVelocity.y = this.controls.yaw * this.maxAngularVelocity.yaw * controlEffectiveness;    // ヨー：Y軸（上方）周り
        this.angularVelocity.z = this.controls.pitch * this.maxAngularVelocity.pitch * controlEffectiveness; // ピッチ：Z軸（横方）周り
        
        // 角度更新
        this.rotation.x += this.angularVelocity.x * deltaTime;
        this.rotation.y += this.angularVelocity.y * deltaTime;
        this.rotation.z += this.angularVelocity.z * deltaTime;
        
        // 自動安定化（速度が十分あるとき）
        if (speed > this.stallSpeed && !this.isOnGround) {
            this.rotation.x *= 0.95; // ロール復元（X軸周り）
            this.rotation.z *= 0.98; // ピッチ復元（Z軸周り）
        }
    }

    checkGroundCollision() {
        const groundClearance = 1.0; // 地面からの最低高度
        
        if (this.position.y <= this.groundHeight + groundClearance) {
            this.position.y = this.groundHeight + groundClearance;
            
            if (this.velocity.y < 0) {
                // 着陸判定
                const landingSpeed = Math.abs(this.velocity.y);
                if (landingSpeed > 8) {
                    // 激しい衝突 - クラッシュ
                    this.crash();
                } else {
                    // 正常な着陸
                    this.velocity.y = 0;
                    this.isOnGround = true;
                }
            }
        } else {
            this.isOnGround = false;
        }
    }

    applyLimits() {
        // 回転角度の制限（正しい航空機座標系）
        this.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.rotation.x)); // ロール ±90度（X軸周り）
        this.rotation.z = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, this.rotation.z)); // ピッチ ±60度（Z軸周り）
        
        // 最大速度制限
        const maxSpeed = 80; // m/s
        if (this.velocity.length() > maxSpeed) {
            this.velocity.normalize().multiplyScalar(maxSpeed);
        }
    }

    crash() {
        // クラッシュ処理
        this.velocity.multiplyScalar(0.1);
        this.angularVelocity.set(0, 0, 0);
        this.isOnGround = true;
        
        // イベントを発火
        if (this.onCrash) {
            this.onCrash();
        }
    }

    // 操縦入力メソッド
    setThrottle(value) {
        this.controls.throttle = Math.max(0, Math.min(1, value));
    }

    setPitch(value) {
        this.controls.pitch = Math.max(-1, Math.min(1, value));
    }

    setYaw(value) {
        this.controls.yaw = Math.max(-1, Math.min(1, value));
    }

    setRoll(value) {
        this.controls.roll = Math.max(-1, Math.min(1, value));
    }

    // 状態取得メソッド
    getSpeed() {
        return this.velocity.length();
    }

    getAltitude() {
        return Math.max(0, this.position.y - this.groundHeight);
    }

    getHeading() {
        return this.rotation.y;
    }

    isFlying() {
        return !this.isOnGround && this.getSpeed() > this.stallSpeed;
    }

    canTakeoff() {
        return this.isOnGround && this.getSpeed() > this.takeoffSpeed;
    }

    reset(position = new THREE.Vector3(0, 5, 0)) {
        this.position.copy(position);
        this.velocity.set(0, 0, 0);
        this.acceleration.set(0, 0, 0);
        this.rotation.set(0, 0, 0);
        this.angularVelocity.set(0, 0, 0);
        this.isOnGround = false;
        this.controls = {
            throttle: 0,
            pitch: 0,
            yaw: 0,
            roll: 0
        };
    }
}