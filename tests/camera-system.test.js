import { AirplaneCameraController } from '../src/camera/AirplaneCameraController.js';
import { CameraManager } from '../src/camera/CameraManager.js';
import { Airplane } from '../src/airplane/Airplane.js';
import * as THREE from 'three';

// モックDOM環境
global.document = {
    createElement: jest.fn(() => ({
        style: {},
        appendChild: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
    })),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    body: {
        appendChild: jest.fn(),
        removeChild: jest.fn()
    },
    head: {
        appendChild: jest.fn(),
        removeChild: jest.fn()
    },
    querySelector: jest.fn(() => null)
};

global.window = {
    innerWidth: 1024,
    innerHeight: 768,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
};

global.performance = {
    now: jest.fn(() => Date.now())
};

global.requestAnimationFrame = jest.fn();
global.cancelAnimationFrame = jest.fn();

describe('Enhanced Camera System Tests', () => {
    let scene;
    let camera;
    let airplane;
    let cameraController;
    let cameraManager;

    beforeEach(() => {
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(75, 16/9, 0.1, 1000);
        airplane = new Airplane(scene);
        cameraController = new AirplaneCameraController(camera, airplane, scene);
        cameraManager = new CameraManager(camera);
    });

    afterEach(() => {
        if (cameraController) {
            cameraController.dispose();
        }
        if (cameraManager) {
            cameraManager.dispose();
        }
        if (airplane) {
            airplane.dispose();
        }
    });

    describe('AirplaneCameraController', () => {
        test('should initialize with enhanced configuration', () => {
            expect(cameraController.config.zoomMin).toBe(0.5);
            expect(cameraController.config.zoomMax).toBe(3.0);
            expect(cameraController.config.collisionAvoidanceDistance).toBe(5);
            expect(cameraController.mode).toBe('chase');
            expect(cameraController.zoomLevel).toBe(1.0);
        });

        test('should support all camera modes', () => {
            const modes = ['chase', 'cockpit', 'orbit', 'free', 'dynamic'];
            
            modes.forEach(mode => {
                cameraController.setMode(mode);
                expect(cameraController.mode).toBe(mode);
            });
        });

        test('should handle zoom functionality', () => {
            const initialZoom = cameraController.zoomLevel;
            
            // ズームイン
            cameraController.targetZoom = 2.0;
            cameraController.updateZoom(0.1);
            
            expect(cameraController.zoomLevel).not.toBe(initialZoom);
            
            // ズームリセット
            cameraController.resetZoom();
            expect(cameraController.targetZoom).toBe(1.0);
        });

        test('should update collision objects from scene', () => {
            // シーンに建物を追加
            const building = new THREE.Mesh(
                new THREE.BoxGeometry(10, 20, 10),
                new THREE.MeshBasicMaterial()
            );
            scene.add(building);
            
            cameraController.updateCollisionObjects();
            
            expect(cameraController.collisionObjects.length).toBeGreaterThan(0);
        });

        test('should avoid collisions', () => {
            // 衝突オブジェクトを設定
            const building = new THREE.Mesh(
                new THREE.BoxGeometry(10, 20, 10),
                new THREE.MeshBasicMaterial()
            );
            building.position.set(0, 10, 0);
            scene.add(building);
            cameraController.updateCollisionObjects();
            
            const airplanePos = new THREE.Vector3(0, 5, 0);
            const targetPos = new THREE.Vector3(0, 15, 0); // 建物と衝突する位置
            
            const safePos = cameraController.avoidCollisions(targetPos, airplanePos);
            
            // 安全な位置に調整されている
            expect(safePos.y).toBeGreaterThan(targetPos.y);
        });

        test('should handle chase mode with zoom adjustments', () => {
            cameraController.setMode('chase');
            cameraController.zoomLevel = 2.0;
            
            const flightData = airplane.getFlightData();
            cameraController.updateChaseMode(flightData, 0.016);
            
            // カメラ位置が飛行機から適切な距離に配置されている
            const distance = camera.position.distanceTo(flightData.position);
            const expectedDistance = cameraController.config.followDistance * 2.0;
            
            expect(distance).toBeCloseTo(expectedDistance, 1);
        });

        test('should handle dynamic mode adjustments', () => {
            cameraController.setMode('dynamic');
            
            // 高速飛行をシミュレート
            airplane.physics.velocity.set(50, 0, 0);
            airplane.physics.position.set(0, 30, 0);
            
            const flightData = airplane.getFlightData();
            cameraController.updateDynamicMode(flightData, 0.016);
            
            // 速度に応じてカメラ距離が調整されている
            const distance = camera.position.distanceTo(flightData.position);
            expect(distance).toBeGreaterThan(cameraController.config.followDistance);
        });

        test('should handle cockpit mode correctly', () => {
            cameraController.setMode('cockpit');
            
            const flightData = airplane.getFlightData();
            cameraController.updateCockpitMode(flightData, 0.016);
            
            // カメラがコックピット位置に配置されている
            const expectedPos = flightData.position.clone().add(cameraController.cockpitOffset);
            expect(camera.position.distanceTo(expectedPos)).toBeLessThan(1);
        });

        test('should handle orbit mode', () => {
            cameraController.setMode('orbit');
            
            const initialAngle = cameraController.orbitAngle;
            const flightData = airplane.getFlightData();
            
            cameraController.updateOrbitMode(flightData, 0.016);
            
            // 軌道角度が更新されている
            expect(cameraController.orbitAngle).not.toBe(initialAngle);
            
            // カメラが飛行機の周りを回転している
            const distance = camera.position.distanceTo(flightData.position);
            expect(distance).toBeCloseTo(cameraController.orbitRadius, 1);
        });

        test('should provide comprehensive camera info', () => {
            const info = cameraController.getCameraInfo();
            
            expect(info).toHaveProperty('mode');
            expect(info).toHaveProperty('position');
            expect(info).toHaveProperty('lookAt');
            expect(info).toHaveProperty('zoomLevel');
            expect(info).toHaveProperty('dynamicSettings');
        });

        test('should handle dynamic settings updates', () => {
            const newSettings = {
                speedBasedDistance: false,
                altitudeBasedHeight: false
            };
            
            cameraController.updateDynamicSettings(newSettings);
            const settings = cameraController.getDynamicSettings();
            
            expect(settings.speedBasedDistance).toBe(false);
            expect(settings.altitudeBasedHeight).toBe(false);
        });

        test('should dispose resources properly', () => {
            const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
            
            cameraController.dispose();
            
            expect(removeEventListenerSpy).toHaveBeenCalled();
        });
    });

    describe('Camera Manager Integration', () => {
        test('should manage multiple controllers', () => {
            cameraManager.addController('airplane', cameraController);
            
            expect(cameraManager.getControllerNames()).toContain('airplane');
            expect(cameraManager.getController('airplane')).toBe(cameraController);
        });

        test('should switch controllers correctly', () => {
            cameraManager.addController('airplane', cameraController);
            
            const switched = cameraManager.switchController('airplane');
            
            expect(switched).toBe(true);
            expect(cameraManager.getCurrentController()).toBe(cameraController);
            expect(cameraController.isActive).toBe(true);
        });

        test('should update active controller', () => {
            cameraManager.addController('airplane', cameraController);
            cameraManager.switchController('airplane');
            
            const updateSpy = jest.spyOn(cameraController, 'update');
            
            cameraManager.update();
            
            expect(updateSpy).toHaveBeenCalled();
        });
    });

    describe('Performance Tests', () => {
        test('should handle frequent camera updates efficiently', () => {
            cameraController.activate();
            const startTime = performance.now();
            
            // 1000回の更新サイクル
            for (let i = 0; i < 1000; i++) {
                cameraController.update(0.016);
            }
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            // 1000フレームが100ms以内で処理される
            expect(duration).toBeLessThan(100);
        });

        test('should maintain smooth camera movement', () => {
            cameraController.setMode('chase');
            cameraController.activate();
            
            const positions = [];
            
            // 複数フレームでの位置変化を記録
            for (let i = 0; i < 10; i++) {
                cameraController.update(0.016);
                positions.push(camera.position.clone());
            }
            
            // カメラが滑らかに移動している（急激な変化がない）
            for (let i = 1; i < positions.length; i++) {
                const distance = positions[i].distanceTo(positions[i-1]);
                expect(distance).toBeLessThan(5); // 1フレームでの移動距離が適切
            }
        });

        test('should handle collision detection efficiently', () => {
            // 複数の建物を追加
            for (let i = 0; i < 20; i++) {
                const building = new THREE.Mesh(
                    new THREE.BoxGeometry(10, 20, 10),
                    new THREE.MeshBasicMaterial()
                );
                building.position.set(
                    (Math.random() - 0.5) * 100,
                    10,
                    (Math.random() - 0.5) * 100
                );
                scene.add(building);
            }
            
            const startTime = performance.now();
            
            // 衝突検出を多数回実行
            for (let i = 0; i < 100; i++) {
                cameraController.updateCollisionObjects();
                const safePos = cameraController.avoidCollisions(
                    new THREE.Vector3(0, 10, 0),
                    new THREE.Vector3(0, 5, 0)
                );
            }
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            // 衝突検出が効率的に処理される
            expect(duration).toBeLessThan(50);
        });
    });

    describe('Visual Quality Tests', () => {
        test('should prevent camera shake', () => {
            cameraController.setMode('chase');
            cameraController.activate();
            
            // 飛行機を激しく動かす
            for (let i = 0; i < 50; i++) {
                airplane.physics.velocity.set(
                    (Math.random() - 0.5) * 100,
                    (Math.random() - 0.5) * 50,
                    (Math.random() - 0.5) * 100
                );
                cameraController.update(0.016);
            }
            
            // カメラの動きが滑らか（スムージングが効いている）
            expect(cameraController.config.smoothingFactor).toBeGreaterThan(0);
            expect(cameraController.config.smoothingFactor).toBeLessThan(1);
        });

        test('should maintain appropriate field of view', () => {
            cameraController.setMode('dynamic');
            
            // 高速飛行時
            airplane.physics.velocity.set(80, 0, 0);
            const flightData = airplane.getFlightData();
            cameraController.updateDynamicMode(flightData, 0.016);
            
            // カメラが適切な距離を保つ
            const distance = camera.position.distanceTo(flightData.position);
            expect(distance).toBeGreaterThan(cameraController.config.followDistance);
        });

        test('should handle rapid maneuvers smoothly', () => {
            cameraController.setMode('dynamic');
            cameraController.activate();
            
            const initialPosition = camera.position.clone();
            
            // 急激な機動をシミュレート
            airplane.physics.velocity.set(50, 20, 30);
            airplane.physics.rotation.set(0.5, 0.8, 0.3);
            
            for (let i = 0; i < 20; i++) {
                cameraController.update(0.016);
            }
            
            // カメラが追従しているが、滑らかに移動している
            const finalDistance = camera.position.distanceTo(initialPosition);
            expect(finalDistance).toBeGreaterThan(0);
            expect(finalDistance).toBeLessThan(100); // 過度に離れていない
        });
    });
});