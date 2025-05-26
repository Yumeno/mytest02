import * as THREE from 'three';
import { CameraManager, MouseFollowCameraController } from './camera/index.js';

class UrbanEnvironment {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.animationId = null;
        this.cityObjects = [];
        this.time = 0;
        this.cameraManager = null;
        
        this.init();
        this.animate();
    }

    init() {
        // シーンの作成
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x87CEEB, 50, 200);

        // カメラの作成
        const container = document.getElementById('scene-container');
        const width = container.clientWidth;
        const height = container.clientHeight;
        
        this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
        this.camera.position.set(50, 30, 50);
        this.camera.lookAt(0, 0, 0);

        // レンダラーの作成
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(width, height);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.setClearColor(0x87CEEB, 1);
        
        container.appendChild(this.renderer.domElement);

        // 環境の作成
        this.createSkybox();
        this.createGround();
        this.createRoads();
        this.createBuildings();
        this.addLights();
        
        // カメラコントロール
        this.setupCameraSystem();
        
        // ウィンドウリサイズ対応
        window.addEventListener('resize', () => this.onWindowResize());
    }

    createSkybox() {
        // グラデーションスカイボックス
        const skyGeometry = new THREE.SphereGeometry(500, 32, 32);
        const skyMaterial = new THREE.ShaderMaterial({
            uniforms: {
                topColor: { value: new THREE.Color(0x0077ff) },
                bottomColor: { value: new THREE.Color(0xffffff) },
                offset: { value: 30 },
                exponent: { value: 0.6 }
            },
            vertexShader: `
                varying vec3 vWorldPosition;
                void main() {
                    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                    vWorldPosition = worldPosition.xyz;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 topColor;
                uniform vec3 bottomColor;
                uniform float offset;
                uniform float exponent;
                varying vec3 vWorldPosition;
                void main() {
                    float h = normalize(vWorldPosition + offset).y;
                    gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
                }
            `,
            side: THREE.BackSide
        });
        
        const sky = new THREE.Mesh(skyGeometry, skyMaterial);
        this.scene.add(sky);
    }

    createGround() {
        // メイン地面
        const groundGeometry = new THREE.PlaneGeometry(200, 200, 20, 20);
        const groundMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x567d46,
            transparent: true,
            opacity: 0.8
        });
        
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        ground.position.y = -0.1;
        this.scene.add(ground);

        // 草のテクスチャ効果（ランダムな小さな立方体）
        for (let i = 0; i < 100; i++) {
            const grassGeometry = new THREE.BoxGeometry(0.1, 0.2, 0.1);
            const grassMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
            const grass = new THREE.Mesh(grassGeometry, grassMaterial);
            
            grass.position.x = (Math.random() - 0.5) * 180;
            grass.position.z = (Math.random() - 0.5) * 180;
            grass.position.y = 0.1;
            
            this.scene.add(grass);
        }
    }

    createRoads() {
        // メイン道路（縦）
        const mainRoadGeometry = new THREE.PlaneGeometry(8, 200);
        const roadMaterial = new THREE.MeshLambertMaterial({ color: 0x404040 });
        
        const mainRoad = new THREE.Mesh(mainRoadGeometry, roadMaterial);
        mainRoad.rotation.x = -Math.PI / 2;
        mainRoad.position.y = 0;
        mainRoad.receiveShadow = true;
        this.scene.add(mainRoad);

        // 交差道路（横）
        const crossRoad = new THREE.Mesh(
            new THREE.PlaneGeometry(200, 8),
            roadMaterial
        );
        crossRoad.rotation.x = -Math.PI / 2;
        crossRoad.position.y = 0;
        crossRoad.receiveShadow = true;
        this.scene.add(crossRoad);

        // 道路の白線
        this.createRoadMarkings();
    }

    createRoadMarkings() {
        const lineGeometry = new THREE.PlaneGeometry(1, 0.2);
        const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

        // 縦道路の白線
        for (let i = -90; i <= 90; i += 10) {
            const line = new THREE.Mesh(lineGeometry, lineMaterial);
            line.rotation.x = -Math.PI / 2;
            line.position.set(0, 0.01, i);
            this.scene.add(line);
        }

        // 横道路の白線
        for (let i = -90; i <= 90; i += 10) {
            const line = new THREE.Mesh(lineGeometry, lineMaterial);
            line.rotation.x = -Math.PI / 2;
            line.rotation.z = Math.PI / 2;
            line.position.set(i, 0.01, 0);
            this.scene.add(line);
        }
    }

    createBuildings() {
        const buildingPositions = [
            // 第1象限
            { x: 20, z: 20 }, { x: 35, z: 20 }, { x: 50, z: 20 },
            { x: 20, z: 35 }, { x: 35, z: 35 }, { x: 50, z: 35 },
            { x: 20, z: 50 }, { x: 35, z: 50 }, { x: 50, z: 50 },
            
            // 第2象限
            { x: -20, z: 20 }, { x: -35, z: 20 }, { x: -50, z: 20 },
            { x: -20, z: 35 }, { x: -35, z: 35 }, { x: -50, z: 35 },
            { x: -20, z: 50 }, { x: -35, z: 50 }, { x: -50, z: 50 },
            
            // 第3象限
            { x: -20, z: -20 }, { x: -35, z: -20 }, { x: -50, z: -20 },
            { x: -20, z: -35 }, { x: -35, z: -35 }, { x: -50, z: -35 },
            { x: -20, z: -50 }, { x: -35, z: -50 }, { x: -50, z: -50 },
            
            // 第4象限
            { x: 20, z: -20 }, { x: 35, z: -20 }, { x: 50, z: -20 },
            { x: 20, z: -35 }, { x: 35, z: -35 }, { x: 50, z: -35 },
            { x: 20, z: -50 }, { x: 35, z: -50 }, { x: 50, z: -50 }
        ];

        buildingPositions.forEach((pos, index) => {
            this.createBuilding(pos.x, pos.z, index);
        });
    }

    createBuilding(x, z, index) {
        // ランダムな建物サイズ
        const width = 8 + Math.random() * 4;
        const depth = 8 + Math.random() * 4;
        const height = 15 + Math.random() * 25;

        const geometry = new THREE.BoxGeometry(width, height, depth);
        
        // 建物タイプによる色分け
        const colors = [
            0x8B4513, // 茶色（レンガ）
            0x708090, // スレートグレー（コンクリート）
            0x2F4F4F, // ダークスレートグレー
            0x696969, // グレー
            0x4682B4, // スチールブルー
            0x556B2F  // オリーブ
        ];
        
        const material = new THREE.MeshPhongMaterial({
            color: colors[index % colors.length],
            shininess: 30
        });

        const building = new THREE.Mesh(geometry, material);
        building.position.set(x, height / 2, z);
        building.castShadow = true;
        building.receiveShadow = true;

        this.scene.add(building);
        this.cityObjects.push(building);

        // 窓の追加
        this.addWindows(building, width, height, depth);
    }

    addWindows(building, width, height, depth) {
        const windowMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffffcc,
            transparent: true,
            opacity: 0.7
        });

        // 前面の窓
        for (let y = 3; y < height - 2; y += 4) {
            for (let x = -width/2 + 2; x < width/2 - 1; x += 3) {
                const windowGeometry = new THREE.PlaneGeometry(1.5, 2);
                const window = new THREE.Mesh(windowGeometry, windowMaterial);
                window.position.set(x, y - height/2, depth/2 + 0.01);
                building.add(window);
            }
        }

        // 側面の窓
        for (let y = 3; y < height - 2; y += 4) {
            for (let z = -depth/2 + 2; z < depth/2 - 1; z += 3) {
                const windowGeometry = new THREE.PlaneGeometry(1.5, 2);
                const window = new THREE.Mesh(windowGeometry, windowMaterial);
                window.position.set(width/2 + 0.01, y - height/2, z);
                window.rotation.y = Math.PI / 2;
                building.add(window);
            }
        }
    }

    addLights() {
        // 環境光（柔らかい全体照明）
        const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
        this.scene.add(ambientLight);

        // 太陽光（メインディレクショナルライト）
        const sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
        sunLight.position.set(100, 100, 50);
        sunLight.castShadow = true;
        
        // シャドウマップの設定
        sunLight.shadow.mapSize.width = 4096;
        sunLight.shadow.mapSize.height = 4096;
        sunLight.shadow.camera.near = 0.5;
        sunLight.shadow.camera.far = 500;
        sunLight.shadow.camera.left = -150;
        sunLight.shadow.camera.right = 150;
        sunLight.shadow.camera.top = 150;
        sunLight.shadow.camera.bottom = -150;
        
        this.scene.add(sunLight);

        // 街灯の追加
        this.addStreetLights();
    }

    addStreetLights() {
        const streetLightPositions = [
            { x: 15, z: 15 }, { x: -15, z: 15 }, { x: 15, z: -15 }, { x: -15, z: -15 },
            { x: 30, z: 0 }, { x: -30, z: 0 }, { x: 0, z: 30 }, { x: 0, z: -30 }
        ];

        streetLightPositions.forEach(pos => {
            // ポール
            const poleGeometry = new THREE.CylinderGeometry(0.2, 0.2, 12);
            const poleMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
            const pole = new THREE.Mesh(poleGeometry, poleMaterial);
            pole.position.set(pos.x, 6, pos.z);
            pole.castShadow = true;
            this.scene.add(pole);

            // ライト
            const lightSphere = new THREE.Mesh(
                new THREE.SphereGeometry(0.5),
                new THREE.MeshBasicMaterial({ color: 0xffff88 })
            );
            lightSphere.position.set(pos.x, 11, pos.z);
            this.scene.add(lightSphere);

            // ポイントライト
            const pointLight = new THREE.PointLight(0xffff88, 0.5, 30);
            pointLight.position.set(pos.x, 11, pos.z);
            pointLight.castShadow = true;
            this.scene.add(pointLight);
        });
    }

    setupCameraSystem() {
        // カメラマネージャーの初期化
        this.cameraManager = new CameraManager(this.camera);
        
        // マウス追従カメラコントローラーを追加
        const mouseController = new MouseFollowCameraController(this.camera);
        this.cameraManager.addController('mouse', mouseController);
        
        // デフォルトコントローラーをアクティブ化
        this.cameraManager.switchController('mouse');
    }

    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());
        this.time += 0.01;

        // カメラの更新
        if (this.cameraManager) {
            this.cameraManager.update();
        }

        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize() {
        const container = document.getElementById('scene-container');
        const width = container.clientWidth;
        const height = container.clientHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    dispose() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        if (this.renderer) {
            this.renderer.dispose();
        }
        
        // カメラマネージャーのクリーンアップ
        if (this.cameraManager) {
            this.cameraManager.dispose();
        }
        
        // 全てのオブジェクトのクリーンアップ
        this.cityObjects.forEach(obj => {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) obj.material.dispose();
        });
    }
}

// アプリケーションの初期化
let app;

document.addEventListener('DOMContentLoaded', () => {
    try {
        app = new UrbanEnvironment();
        console.log('3D都市環境が正常に初期化されました');
        
        // 操作説明の更新
        const controls = document.querySelector('.controls p');
        if (controls) {
            controls.innerHTML = 'マウス移動: カメラ操作 | クリック: 自動回転ON/OFF<br>リアルタイム3D都市環境';
        }
    } catch (error) {
        console.error('3D都市環境の初期化に失敗しました:', error);
        
        // エラー表示
        const container = document.getElementById('scene-container');
        container.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: red; text-align: center; padding: 20px;">
                <div>
                    <h3>エラーが発生しました</h3>
                    <p>${error.message}</p>
                    <p>ブラウザのコンソールで詳細を確認してください。</p>
                </div>
            </div>
        `;
    }
});

// クリーンアップ
window.addEventListener('beforeunload', () => {
    if (app) {
        app.dispose();
    }
});

export default UrbanEnvironment;