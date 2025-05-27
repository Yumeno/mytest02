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
        const noseGeometry = new THREE.ConeGeometry(0.2, 0.8, 8);
        const nose = new THREE.Mesh(noseGeometry, fuselageMaterial);
        nose.rotation.z = -Math.PI / 2;
        nose.position.x = 2.0;
        nose.castShadow = true;
        this.group.add(nose);

        // 胴体（統一された流線型）
        const fuselageGeometry = new THREE.CylinderGeometry(0.15, 0.3, 4.0, 12);
        const fuselage = new THREE.Mesh(fuselageGeometry, fuselageMaterial);
        fuselage.rotation.z = Math.PI / 2;
        fuselage.position.x = 0.0;
        fuselage.castShadow = true;
        this.group.add(fuselage);

        // 主翼（翼断面形状）
        this.createMainWings(wingMaterial);

        // 尾翼（水平）
        const tailWingGeometry = new THREE.BoxGeometry(1.2, 0.12, 0.6);
        const tailWing = new THREE.Mesh(tailWingGeometry, wingMaterial);
        tailWing.position.x = -1.8;
        tailWing.position.z = 0;
        tailWing.castShadow = true;
        this.group.add(tailWing);

        // 尾翼（垂直）
        const verticalTailGeometry = new THREE.BoxGeometry(0.12, 0.8, 0.8);
        const verticalTail = new THREE.Mesh(verticalTailGeometry, wingMaterial);
        verticalTail.position.x = -1.8;
        verticalTail.position.y = 0.4;
        verticalTail.castShadow = true;
        this.group.add(verticalTail);

        // プロペラ
        const propellerGeometry = new THREE.BoxGeometry(0.06, 1.8, 0.12);
        const propellerMaterial = new THREE.MeshPhongMaterial({ color: 0x222222 });
        this.propeller = new THREE.Mesh(propellerGeometry, propellerMaterial);
        this.propeller.position.x = 2.5;
        this.propeller.castShadow = true;
        this.group.add(this.propeller);

        // エンジンカウル
        const engineGeometry = new THREE.CylinderGeometry(0.22, 0.26, 0.8, 12);
        const engineMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });
        const engine = new THREE.Mesh(engineGeometry, engineMaterial);
        engine.rotation.z = Math.PI / 2;
        engine.position.x = 1.6;
        engine.castShadow = true;
        this.group.add(engine);

        // コックピット（より現実的）
        const cockpitGeometry = new THREE.SphereGeometry(0.32, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.6);
        const cockpitMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x88ccff, 
            transparent: true, 
            opacity: 0.7 
        });
        const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
        cockpit.position.x = 0.5;
        cockpit.position.y = 0.32;
        cockpit.castShadow = true;
        this.group.add(cockpit);

        // 着陸脚（改良版）
        this.createLandingGear();
    }

    createMainWings(wingMaterial) {
        // 中央翼（胴体接続部）
        const centerWingGeometry = new THREE.BoxGeometry(1.5, 0.18, 0.8);
        const centerWing = new THREE.Mesh(centerWingGeometry, wingMaterial);
        centerWing.position.set(0.0, -0.05, 0);
        centerWing.castShadow = true;
        this.group.add(centerWing);

        // 左翼（適切なサイズと位置）
        const leftWingGeometry = new THREE.BoxGeometry(1.2, 0.15, 0.8);
        const leftWing = new THREE.Mesh(leftWingGeometry, wingMaterial);
        leftWing.position.set(-0.2, -0.02, -1.2);
        leftWing.rotation.z = 0.02;
        leftWing.castShadow = true;
        this.group.add(leftWing);

        // 右翼（適切なサイズと位置）
        const rightWingGeometry = new THREE.BoxGeometry(1.2, 0.15, 0.8);
        const rightWing = new THREE.Mesh(rightWingGeometry, wingMaterial);
        rightWing.position.set(-0.2, -0.02, 1.2);
        rightWing.rotation.z = -0.02;
        rightWing.castShadow = true;
        this.group.add(rightWing);

        // 翼端（左）
        const leftWingtipGeometry = new THREE.BoxGeometry(0.5, 0.12, 0.25);
        const leftWingtip = new THREE.Mesh(leftWingtipGeometry, wingMaterial);
        leftWingtip.position.set(-0.4, 0.02, -1.8);
        leftWingtip.castShadow = true;
        this.group.add(leftWingtip);

        // 翼端（右）
        const rightWingtipGeometry = new THREE.BoxGeometry(0.5, 0.12, 0.25);
        const rightWingtip = new THREE.Mesh(rightWingtipGeometry, wingMaterial);
        rightWingtip.position.set(-0.4, 0.02, 1.8);
        rightWingtip.castShadow = true;
        this.group.add(rightWingtip);
    }

    createLandingGear() {
        const gearMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
        
        // 前脚（位置調整）
        const frontGearGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.7);
        const frontGear = new THREE.Mesh(frontGearGeometry, gearMaterial);
        frontGear.position.set(1.2, -0.55, 0);
        frontGear.castShadow = true;
        this.group.add(frontGear);

        // 主脚（左）- 新しい翼の位置に合わせて調整
        const mainGearGeometry = new THREE.CylinderGeometry(0.06, 0.06, 0.9);
        const leftMainGear = new THREE.Mesh(mainGearGeometry, gearMaterial);
        leftMainGear.position.set(-0.2, -0.65, -1.2);
        leftMainGear.castShadow = true;
        this.group.add(leftMainGear);

        // 主脚（右）
        const rightMainGear = new THREE.Mesh(mainGearGeometry, gearMaterial);
        rightMainGear.position.set(-0.2, -0.65, 1.2);
        rightMainGear.castShadow = true;
        this.group.add(rightMainGear);

        // 車輪（サイズ調整）
        const wheelGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.1);
        const wheelMaterial = new THREE.MeshPhongMaterial({ color: 0x222222 });
        
        // 前輪
        const frontWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        frontWheel.position.set(1.2, -0.9, 0);
        frontWheel.rotation.x = Math.PI / 2;
        this.group.add(frontWheel);

        // 左主輪
        const leftWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        leftWheel.position.set(-0.2, -1.1, -1.2);
        leftWheel.rotation.x = Math.PI / 2;
        this.group.add(leftWheel);

        // 右主輪
        const rightWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        rightWheel.position.set(-0.2, -1.1, 1.2);
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