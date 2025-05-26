import * as THREE from 'three';

class ThreeJSApp {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.cube = null;
        this.animationId = null;
        
        this.init();
        this.animate();
    }

    init() {
        // シーンの作成
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0f0f0f);

        // カメラの作成
        const container = document.getElementById('scene-container');
        const width = container.clientWidth;
        const height = container.clientHeight;
        
        this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        this.camera.position.z = 5;

        // レンダラーの作成
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(width, height);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        container.appendChild(this.renderer.domElement);

        // 立方体の作成
        this.createCube();
        
        // ライトの追加
        this.addLights();
        
        // ウィンドウリサイズ対応
        window.addEventListener('resize', () => this.onWindowResize());
    }

    createCube() {
        // 立方体のジオメトリとマテリアル
        const geometry = new THREE.BoxGeometry(2, 2, 2);
        const material = new THREE.MeshPhongMaterial({ 
            color: 0x00ff88,
            shininess: 100
        });
        
        this.cube = new THREE.Mesh(geometry, material);
        this.cube.castShadow = true;
        this.cube.receiveShadow = true;
        
        this.scene.add(this.cube);
    }

    addLights() {
        // 環境光
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        this.scene.add(ambientLight);

        // ディレクショナルライト
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);

        // ポイントライト（色付き）
        const pointLight = new THREE.PointLight(0xff6600, 0.5, 50);
        pointLight.position.set(-5, 3, 3);
        this.scene.add(pointLight);
    }

    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());

        // 立方体を回転させる
        if (this.cube) {
            this.cube.rotation.x += 0.01;
            this.cube.rotation.y += 0.01;
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
        
        if (this.cube) {
            this.cube.geometry.dispose();
            this.cube.material.dispose();
        }
    }
}

// アプリケーションの初期化
let app;

document.addEventListener('DOMContentLoaded', () => {
    try {
        app = new ThreeJSApp();
        console.log('Three.js アプリケーションが正常に初期化されました');
    } catch (error) {
        console.error('Three.js アプリケーションの初期化に失敗しました:', error);
        
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

export default ThreeJSApp;