/**
 * 3D都市環境のテストスイート
 */

import * as THREE from 'three';
import UrbanEnvironment from '../src/main.js';

// テスト用のDOM環境をセットアップ
function setupTestEnvironment() {
    // テスト用のコンテナを作成
    const container = document.createElement('div');
    container.id = 'scene-container';
    container.style.width = '800px';
    container.style.height = '600px';
    document.body.appendChild(container);
    
    return container;
}

function cleanupTestEnvironment() {
    const container = document.getElementById('scene-container');
    if (container) {
        document.body.removeChild(container);
    }
}

describe('UrbanEnvironment', () => {
    let urbanEnv;
    let container;

    beforeEach(() => {
        container = setupTestEnvironment();
    });

    afterEach(() => {
        if (urbanEnv) {
            urbanEnv.dispose();
            urbanEnv = null;
        }
        cleanupTestEnvironment();
    });

    describe('初期化テスト', () => {
        test('正常に初期化される', () => {
            expect(() => {
                urbanEnv = new UrbanEnvironment();
            }).not.toThrow();
            
            expect(urbanEnv).toBeDefined();
            expect(urbanEnv.scene).toBeInstanceOf(THREE.Scene);
            expect(urbanEnv.camera).toBeInstanceOf(THREE.PerspectiveCamera);
            expect(urbanEnv.renderer).toBeInstanceOf(THREE.WebGLRenderer);
        });

        test('シーンに霧が設定されている', () => {
            urbanEnv = new UrbanEnvironment();
            expect(urbanEnv.scene.fog).toBeInstanceOf(THREE.Fog);
            expect(urbanEnv.scene.fog.color.getHex()).toBe(0x87CEEB);
        });

        test('カメラが正しい位置に配置されている', () => {
            urbanEnv = new UrbanEnvironment();
            expect(urbanEnv.camera.position.x).toBe(50);
            expect(urbanEnv.camera.position.y).toBe(30);
            expect(urbanEnv.camera.position.z).toBe(50);
        });

        test('レンダラーのシャドウマップが有効になっている', () => {
            urbanEnv = new UrbanEnvironment();
            expect(urbanEnv.renderer.shadowMap.enabled).toBe(true);
            expect(urbanEnv.renderer.shadowMap.type).toBe(THREE.PCFSoftShadowMap);
        });
    });

    describe('ジオメトリ生成テスト', () => {
        beforeEach(() => {
            urbanEnv = new UrbanEnvironment();
        });

        test('シーンに適切な数のオブジェクトが追加されている', () => {
            // スカイボックス、地面、道路、建物、街灯、草など
            expect(urbanEnv.scene.children.length).toBeGreaterThan(50);
        });

        test('建物オブジェクトが正しく生成されている', () => {
            expect(urbanEnv.cityObjects.length).toBe(27); // 9x3の建物配置
            
            urbanEnv.cityObjects.forEach(building => {
                expect(building).toBeInstanceOf(THREE.Mesh);
                expect(building.geometry).toBeInstanceOf(THREE.BoxGeometry);
                expect(building.material).toBeInstanceOf(THREE.MeshPhongMaterial);
                expect(building.castShadow).toBe(true);
                expect(building.receiveShadow).toBe(true);
            });
        });

        test('建物の位置が正しく設定されている', () => {
            const expectedPositions = [
                { x: 20, z: 20 }, { x: 35, z: 20 }, { x: 50, z: 20 },
                { x: -20, z: 20 }, { x: -35, z: 20 }, { x: -50, z: 20 }
            ];
            
            expectedPositions.forEach((expectedPos, index) => {
                if (urbanEnv.cityObjects[index]) {
                    expect(urbanEnv.cityObjects[index].position.x).toBe(expectedPos.x);
                    expect(urbanEnv.cityObjects[index].position.z).toBe(expectedPos.z);
                }
            });
        });
    });

    describe('マテリアル設定テスト', () => {
        beforeEach(() => {
            urbanEnv = new UrbanEnvironment();
        });

        test('建物マテリアルが正しく設定されている', () => {
            const expectedColors = [
                0x8B4513, // 茶色（レンガ）
                0x708090, // スレートグレー（コンクリート）
                0x2F4F4F, // ダークスレートグレー
                0x696969, // グレー
                0x4682B4, // スチールブルー
                0x556B2F  // オリーブ
            ];

            urbanEnv.cityObjects.forEach((building, index) => {
                const expectedColor = expectedColors[index % expectedColors.length];
                expect(building.material.color.getHex()).toBe(expectedColor);
                expect(building.material.shininess).toBe(30);
            });
        });

        test('窓マテリアルが透明度を持っている', () => {
            // 建物に窓が追加されていることを確認
            const building = urbanEnv.cityObjects[0];
            expect(building.children.length).toBeGreaterThan(0);
            
            // 窓のマテリアルをチェック
            const window = building.children.find(child => 
                child.material && child.material.transparent
            );
            expect(window).toBeDefined();
            expect(window.material.opacity).toBe(0.7);
        });
    });

    describe('照明計算テスト', () => {
        beforeEach(() => {
            urbanEnv = new UrbanEnvironment();
        });

        test('環境光が設定されている', () => {
            const ambientLight = urbanEnv.scene.children.find(
                child => child instanceof THREE.AmbientLight
            );
            expect(ambientLight).toBeDefined();
            expect(ambientLight.intensity).toBe(0.3);
        });

        test('太陽光（ディレクショナルライト）が設定されている', () => {
            const sunLight = urbanEnv.scene.children.find(
                child => child instanceof THREE.DirectionalLight
            );
            expect(sunLight).toBeDefined();
            expect(sunLight.intensity).toBe(1.0);
            expect(sunLight.castShadow).toBe(true);
            expect(sunLight.shadow.mapSize.width).toBe(4096);
            expect(sunLight.shadow.mapSize.height).toBe(4096);
        });

        test('街灯のポイントライトが設定されている', () => {
            const pointLights = urbanEnv.scene.children.filter(
                child => child instanceof THREE.PointLight
            );
            expect(pointLights.length).toBe(8); // 8つの街灯
            
            pointLights.forEach(light => {
                expect(light.intensity).toBe(0.5);
                expect(light.distance).toBe(30);
                expect(light.castShadow).toBe(true);
            });
        });
    });

    describe('パフォーマンステスト', () => {
        beforeEach(() => {
            urbanEnv = new UrbanEnvironment();
        });

        test('フレームレート測定', (done) => {
            let frameCount = 0;
            const startTime = performance.now();
            
            const measureFrames = () => {
                frameCount++;
                
                if (frameCount >= 60) {
                    const endTime = performance.now();
                    const fps = 1000 / ((endTime - startTime) / frameCount);
                    
                    // 60FPSに近いパフォーマンスを期待
                    expect(fps).toBeGreaterThan(30);
                    done();
                } else {
                    requestAnimationFrame(measureFrames);
                }
            };
            
            measureFrames();
        }, 10000);

        test('メモリ使用量チェック', () => {
            const initialMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
            
            // 新しい環境を作成してメモリ使用量をチェック
            const testEnv = new UrbanEnvironment();
            
            if (performance.memory) {
                const memoryIncrease = performance.memory.usedJSHeapSize - initialMemory;
                // メモリ使用量が100MB以下であることを確認
                expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
            }
            
            testEnv.dispose();
        });
    });

    describe('レスポンシブテスト', () => {
        beforeEach(() => {
            urbanEnv = new UrbanEnvironment();
        });

        test('ウィンドウリサイズが正しく処理される', () => {
            const originalWidth = urbanEnv.camera.aspect;
            
            // コンテナサイズを変更
            container.style.width = '1200px';
            container.style.height = '800px';
            
            // リサイズイベントを発火
            urbanEnv.onWindowResize();
            
            // アスペクト比が更新されていることを確認
            expect(urbanEnv.camera.aspect).not.toBe(originalWidth);
            expect(urbanEnv.camera.aspect).toBe(1200 / 800);
        });
    });

    describe('クリーンアップテスト', () => {
        test('dispose メソッドが正しく動作する', () => {
            urbanEnv = new UrbanEnvironment();
            const renderer = urbanEnv.renderer;
            const cityObjects = [...urbanEnv.cityObjects];
            
            // dispose を呼び出し
            urbanEnv.dispose();
            
            // アニメーションが停止していることを確認
            expect(urbanEnv.animationId).toBeNull();
            
            // レンダラーとオブジェクトがクリーンアップされていることを確認
            expect(renderer.domElement.parentNode).toBeNull();
        });
    });
});

// E2Eテスト用のヘルパー関数
export const E2ETestHelpers = {
    async captureScreenshot() {
        // 実際のE2Eテストフレームワークでスクリーンショットを撮影
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve('screenshot-data');
            }, 100);
        });
    },

    async testDifferentResolutions() {
        const resolutions = [
            { width: 1920, height: 1080 },
            { width: 1366, height: 768 },
            { width: 375, height: 667 }
        ];

        for (const resolution of resolutions) {
            const container = document.getElementById('scene-container');
            container.style.width = `${resolution.width}px`;
            container.style.height = `${resolution.height}px`;
            
            // レンダリングテストを実行
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    },

    measureRenderTime() {
        const start = performance.now();
        // レンダリング処理
        const end = performance.now();
        return end - start;
    }
};