import * as THREE from 'three';

export class AirplaneModel {
    constructor() {
        this.group = new THREE.Group();
        this.createAirplane();
    }

    createAirplane() {
        // 胴体（本体）
        const fuselageGeometry = new THREE.CylinderGeometry(0.3, 0.2, 4, 8);
        const fuselageMaterial = new THREE.MeshPhongMaterial({ color: 0x0066cc });
        const fuselage = new THREE.Mesh(fuselageGeometry, fuselageMaterial);
        fuselage.rotation.z = Math.PI / 2;
        fuselage.castShadow = true;
        this.group.add(fuselage);

        // 主翼
        const mainWingGeometry = new THREE.BoxGeometry(6, 0.1, 1.2);
        const wingMaterial = new THREE.MeshPhongMaterial({ color: 0x004499 });
        const mainWing = new THREE.Mesh(mainWingGeometry, wingMaterial);
        mainWing.position.z = -0.5;
        mainWing.castShadow = true;
        this.group.add(mainWing);

        // 尾翼（水平）
        const tailWingGeometry = new THREE.BoxGeometry(2, 0.1, 0.6);
        const tailWing = new THREE.Mesh(tailWingGeometry, wingMaterial);
        tailWing.position.x = -1.8;
        tailWing.position.z = -0.3;
        tailWing.castShadow = true;
        this.group.add(tailWing);

        // 尾翼（垂直）
        const verticalTailGeometry = new THREE.BoxGeometry(0.1, 1.2, 0.8);
        const verticalTail = new THREE.Mesh(verticalTailGeometry, wingMaterial);
        verticalTail.position.x = -1.8;
        verticalTail.position.y = 0.4;
        verticalTail.castShadow = true;
        this.group.add(verticalTail);

        // プロペラ
        const propellerGeometry = new THREE.BoxGeometry(0.05, 2.5, 0.1);
        const propellerMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
        this.propeller = new THREE.Mesh(propellerGeometry, propellerMaterial);
        this.propeller.position.x = 2.1;
        this.propeller.castShadow = true;
        this.group.add(this.propeller);

        // エンジン
        const engineGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.8, 8);
        const engineMaterial = new THREE.MeshPhongMaterial({ color: 0x666666 });
        const engine = new THREE.Mesh(engineGeometry, engineMaterial);
        engine.rotation.z = Math.PI / 2;
        engine.position.x = 1.6;
        engine.castShadow = true;
        this.group.add(engine);

        // コックピット
        const cockpitGeometry = new THREE.SphereGeometry(0.4, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2);
        const cockpitMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x88ccff, 
            transparent: true, 
            opacity: 0.8 
        });
        const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
        cockpit.position.x = 0.5;
        cockpit.position.y = 0.3;
        cockpit.castShadow = true;
        this.group.add(cockpit);

        // 着陸脚（簡略化）
        this.createLandingGear();
    }

    createLandingGear() {
        const gearMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
        
        // 前脚
        const frontGearGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.8);
        const frontGear = new THREE.Mesh(frontGearGeometry, gearMaterial);
        frontGear.position.set(1.2, -0.6, 0);
        frontGear.castShadow = true;
        this.group.add(frontGear);

        // 主脚（左）
        const mainGearGeometry = new THREE.CylinderGeometry(0.08, 0.08, 1.0);
        const leftMainGear = new THREE.Mesh(mainGearGeometry, gearMaterial);
        leftMainGear.position.set(-0.2, -0.7, -1.5);
        leftMainGear.castShadow = true;
        this.group.add(leftMainGear);

        // 主脚（右）
        const rightMainGear = new THREE.Mesh(mainGearGeometry, gearMaterial);
        rightMainGear.position.set(-0.2, -0.7, 1.5);
        rightMainGear.castShadow = true;
        this.group.add(rightMainGear);

        // 車輪
        const wheelGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.1);
        const wheelMaterial = new THREE.MeshPhongMaterial({ color: 0x222222 });
        
        // 前輪
        const frontWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        frontWheel.position.set(1.2, -1.0, 0);
        frontWheel.rotation.x = Math.PI / 2;
        this.group.add(frontWheel);

        // 左主輪
        const leftWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        leftWheel.position.set(-0.2, -1.2, -1.5);
        leftWheel.rotation.x = Math.PI / 2;
        this.group.add(leftWheel);

        // 右主輪
        const rightWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        rightWheel.position.set(-0.2, -1.2, 1.5);
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