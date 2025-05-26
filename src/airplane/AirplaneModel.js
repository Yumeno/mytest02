import * as THREE from 'three';

export class AirplaneModel {
    constructor() {
        this.group = new THREE.Group();
        this.createAirplane();
    }

    createAirplane() {
        const fuselageMaterial = new THREE.MeshPhongMaterial({ color: 0x0066cc });
        const wingMaterial = new THREE.MeshPhongMaterial({ color: 0x004499 });

        // 機首（先尖り）
        const noseGeometry = new THREE.ConeGeometry(0.25, 1.2, 8);
        const nose = new THREE.Mesh(noseGeometry, fuselageMaterial);
        nose.rotation.z = -Math.PI / 2;
        nose.position.x = 2.6;
        nose.castShadow = true;
        this.group.add(nose);

        // 胴体（流線型）- 前部
        const frontFuselageGeometry = new THREE.CylinderGeometry(0.35, 0.25, 2.5, 12);
        const frontFuselage = new THREE.Mesh(frontFuselageGeometry, fuselageMaterial);
        frontFuselage.rotation.z = Math.PI / 2;
        frontFuselage.position.x = 1.25;
        frontFuselage.castShadow = true;
        this.group.add(frontFuselage);

        // 胴体（流線型）- 後部
        const rearFuselageGeometry = new THREE.CylinderGeometry(0.35, 0.15, 2.0, 12);
        const rearFuselage = new THREE.Mesh(rearFuselageGeometry, fuselageMaterial);
        rearFuselage.rotation.z = Math.PI / 2;
        rearFuselage.position.x = -1.0;
        rearFuselage.castShadow = true;
        this.group.add(rearFuselage);

        // 主翼（翼断面形状）
        this.createMainWings(wingMaterial);

        // 尾翼（水平）
        const tailWingGeometry = new THREE.BoxGeometry(1.8, 0.15, 0.8);
        const tailWing = new THREE.Mesh(tailWingGeometry, wingMaterial);
        tailWing.position.x = -2.0;
        tailWing.position.z = 0;
        tailWing.castShadow = true;
        this.group.add(tailWing);

        // 尾翼（垂直）
        const verticalTailGeometry = new THREE.BoxGeometry(0.15, 1.0, 1.2);
        const verticalTail = new THREE.Mesh(verticalTailGeometry, wingMaterial);
        verticalTail.position.x = -2.0;
        verticalTail.position.y = 0.5;
        verticalTail.castShadow = true;
        this.group.add(verticalTail);

        // プロペラ
        const propellerGeometry = new THREE.BoxGeometry(0.08, 2.8, 0.15);
        const propellerMaterial = new THREE.MeshPhongMaterial({ color: 0x222222 });
        this.propeller = new THREE.Mesh(propellerGeometry, propellerMaterial);
        this.propeller.position.x = 3.4;
        this.propeller.castShadow = true;
        this.group.add(this.propeller);

        // エンジンカウル
        const engineGeometry = new THREE.CylinderGeometry(0.3, 0.35, 1.0, 12);
        const engineMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });
        const engine = new THREE.Mesh(engineGeometry, engineMaterial);
        engine.rotation.z = Math.PI / 2;
        engine.position.x = 2.0;
        engine.castShadow = true;
        this.group.add(engine);

        // コックピット（より現実的）
        const cockpitGeometry = new THREE.SphereGeometry(0.45, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.6);
        const cockpitMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x88ccff, 
            transparent: true, 
            opacity: 0.7 
        });
        const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
        cockpit.position.x = 0.8;
        cockpit.position.y = 0.35;
        cockpit.castShadow = true;
        this.group.add(cockpit);

        // 着陸脚（改良版）
        this.createLandingGear();
    }

    createMainWings(wingMaterial) {
        // 左翼
        const leftWingGeometry = new THREE.BoxGeometry(2.8, 0.25, 1.0);
        const leftWing = new THREE.Mesh(leftWingGeometry, wingMaterial);
        leftWing.position.set(0.2, -0.1, -2.4);
        leftWing.rotation.z = 0.05;
        leftWing.castShadow = true;
        this.group.add(leftWing);

        // 右翼
        const rightWingGeometry = new THREE.BoxGeometry(2.8, 0.25, 1.0);
        const rightWing = new THREE.Mesh(rightWingGeometry, wingMaterial);
        rightWing.position.set(0.2, -0.1, 2.4);
        rightWing.rotation.z = -0.05;
        rightWing.castShadow = true;
        this.group.add(rightWing);

        // 翼端（左）
        const leftWingtipGeometry = new THREE.BoxGeometry(0.8, 0.2, 0.3);
        const leftWingtip = new THREE.Mesh(leftWingtipGeometry, wingMaterial);
        leftWingtip.position.set(-0.2, 0.0, -3.3);
        leftWingtip.castShadow = true;
        this.group.add(leftWingtip);

        // 翼端（右）
        const rightWingtipGeometry = new THREE.BoxGeometry(0.8, 0.2, 0.3);
        const rightWingtip = new THREE.Mesh(rightWingtipGeometry, wingMaterial);
        rightWingtip.position.set(-0.2, 0.0, 3.3);
        rightWingtip.castShadow = true;
        this.group.add(rightWingtip);
    }

    createLandingGear() {
        const gearMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
        
        // 前脚（位置調整）
        const frontGearGeometry = new THREE.CylinderGeometry(0.06, 0.06, 0.9);
        const frontGear = new THREE.Mesh(frontGearGeometry, gearMaterial);
        frontGear.position.set(1.8, -0.65, 0);
        frontGear.castShadow = true;
        this.group.add(frontGear);

        // 主脚（左）- 翼の位置に合わせて調整
        const mainGearGeometry = new THREE.CylinderGeometry(0.08, 0.08, 1.1);
        const leftMainGear = new THREE.Mesh(mainGearGeometry, gearMaterial);
        leftMainGear.position.set(0.0, -0.75, -2.2);
        leftMainGear.castShadow = true;
        this.group.add(leftMainGear);

        // 主脚（右）
        const rightMainGear = new THREE.Mesh(mainGearGeometry, gearMaterial);
        rightMainGear.position.set(0.0, -0.75, 2.2);
        rightMainGear.castShadow = true;
        this.group.add(rightMainGear);

        // 車輪（サイズ調整）
        const wheelGeometry = new THREE.CylinderGeometry(0.18, 0.18, 0.12);
        const wheelMaterial = new THREE.MeshPhongMaterial({ color: 0x222222 });
        
        // 前輪
        const frontWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        frontWheel.position.set(1.8, -1.1, 0);
        frontWheel.rotation.x = Math.PI / 2;
        this.group.add(frontWheel);

        // 左主輪
        const leftWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        leftWheel.position.set(0.0, -1.3, -2.2);
        leftWheel.rotation.x = Math.PI / 2;
        this.group.add(leftWheel);

        // 右主輪
        const rightWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        rightWheel.position.set(0.0, -1.3, 2.2);
        rightWheel.rotation.x = Math.PI / 2;
        this.group.add(rightWheel);
    }

    updatePropeller(speed) {
        if (this.propeller && speed > 0) {
            this.propeller.rotation.x += speed * 0.5;
        }
    }

    getModel() {
        return this.group;
    }

    dispose() {
        this.group.traverse((child) => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
        });
    }
}