import { Airplane } from '../src/airplane/Airplane.js';
import { AirplaneModel } from '../src/airplane/AirplaneModel.js';
import { AirplanePhysics } from '../src/airplane/AirplanePhysics.js';
import { AirplaneController } from '../src/airplane/AirplaneController.js';
import { AirplaneDebugger } from '../src/airplane/AirplaneDebugger.js';
import { AirplaneHUD } from '../src/airplane/AirplaneHUD.js';
import * as THREE from 'three';

// モックDOM環境
global.document = {
    createElement: jest.fn(() => ({
        style: {},
        className: '',
        innerHTML: '',
        appendChild: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        querySelector: jest.fn(() => ({
            style: { transform: '' }
        })),
        parentNode: document.body
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
    querySelector: jest.fn(() => ({
        style: { transform: '' }
    }))
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

describe('Airplane System Tests', () => {
    let scene;
    let airplane;

    beforeEach(() => {
        scene = new THREE.Scene();
        airplane = new Airplane(scene);
    });

    afterEach(() => {
        if (airplane) {
            airplane.dispose();
        }
    });

    describe('AirplaneModel', () => {
        test('should create airplane model with all components', () => {
            const model = new AirplaneModel();
            const group = model.getModel();
            
            expect(group).toBeInstanceOf(THREE.Group);
            expect(group.children.length).toBeGreaterThan(5); // 胴体、翼、尾翼、プロペラ、エンジンなど
        });

        test('should update propeller rotation', () => {
            const model = new AirplaneModel();
            const initialRotation = model.propeller.rotation.x;
            
            model.updatePropeller(5);
            
            expect(model.propeller.rotation.x).not.toBe(initialRotation);
        });

        test('should dispose resources properly', () => {
            const model = new AirplaneModel();
            const disposeSpy = jest.spyOn(model.group, 'traverse');
            
            model.dispose();
            
            expect(disposeSpy).toHaveBeenCalled();
        });
    });

    describe('AirplanePhysics', () => {
        let physics;

        beforeEach(() => {
            physics = new AirplanePhysics();
        });

        test('should initialize with default values', () => {
            expect(physics.position).toEqual(new THREE.Vector3(0, 5, 0));
            expect(physics.velocity).toEqual(new THREE.Vector3(0, 0, 0));
            expect(physics.mass).toBe(1000);
            expect(physics.thrust).toBe(0);
            expect(physics.isOnGround).toBe(false);
        });

        test('should update thrust based on throttle', () => {
            physics.setThrottle(0.5);
            physics.updateThrust();
            
            expect(physics.thrust).toBe(physics.maxThrust * 0.5);
        });

        test('should apply gravity when not on ground', () => {
            const initialVelocityY = physics.velocity.y;
            
            physics.update(0.1);
            
            expect(physics.velocity.y).toBeLessThan(initialVelocityY);
        });

        test('should generate lift when moving with positive angle of attack', () => {
            physics.velocity.set(20, 0, 0); // 速度を設定
            physics.rotation.x = Math.PI / 12; // 正の迎角
            
            physics.updateAerodynamics();
            
            expect(physics.lift).toBeGreaterThan(0);
        });

        test('should handle ground collision', () => {
            physics.position.y = 0.5; // 地面付近
            physics.velocity.y = -2; // 下向き速度
            
            physics.checkGroundCollision();
            
            expect(physics.isOnGround).toBe(true);
            expect(physics.velocity.y).toBe(0);
        });

        test('should detect stall conditions', () => {
            physics.velocity.set(5, 0, 0); // 失速速度以下
            
            expect(physics.getSpeed()).toBeLessThan(physics.stallSpeed);
            expect(physics.isFlying()).toBe(false);
        });

        test('should reset properly', () => {
            physics.position.set(100, 100, 100);
            physics.velocity.set(50, 50, 50);
            physics.setThrottle(1);
            
            physics.reset();
            
            expect(physics.position).toEqual(new THREE.Vector3(0, 5, 0));
            expect(physics.velocity).toEqual(new THREE.Vector3(0, 0, 0));
            expect(physics.controls.throttle).toBe(0);
        });

        test('should limit rotation angles', () => {
            physics.rotation.x = Math.PI; // 180度
            physics.rotation.z = Math.PI; // 180度
            
            physics.applyLimits();
            
            expect(physics.rotation.x).toBeLessThanOrEqual(Math.PI / 3); // ±60度制限
            expect(physics.rotation.z).toBeLessThanOrEqual(Math.PI / 2); // ±90度制限
        });
    });

    describe('AirplaneController', () => {
        let controller;
        let mockAirplane;

        beforeEach(() => {
            mockAirplane = {
                physics: {
                    setThrottle: jest.fn(),
                    setPitch: jest.fn(),
                    setYaw: jest.fn(),
                    setRoll: jest.fn(),
                    reset: jest.fn()
                },
                model: {
                    getModel: jest.fn(() => ({
                        position: new THREE.Vector3(),
                        rotation: new THREE.Euler()
                    }))
                }
            };
            controller = new AirplaneController(mockAirplane);
        });

        afterEach(() => {
            controller.dispose();
        });

        test('should initialize with correct key bindings', () => {
            expect(controller.keyBindings['KeyW']).toBe('throttleUp');
            expect(controller.keyBindings['ArrowUp']).toBe('pitchDown');
            expect(controller.keyBindings['KeyA']).toBe('yawLeft');
        });

        test('should activate and deactivate properly', () => {
            expect(controller.isActive).toBe(false);
            
            controller.activate();
            expect(controller.isActive).toBe(true);
            
            controller.deactivate();
            expect(controller.isActive).toBe(false);
        });

        test('should update throttle correctly', () => {
            controller.activate();
            controller.keys['KeyW'] = true;
            
            controller.updateThrottle(0.1);
            
            expect(controller.controlValues.throttle).toBeGreaterThan(0);
        });

        test('should return control values to neutral', () => {
            controller.activate();
            controller.controlValues.pitch = 0.5;
            
            // キーが押されていない状態で更新
            controller.updatePitch(0.1);
            
            expect(controller.controlValues.pitch).toBeLessThan(0.5);
        });

        test('should apply control values to airplane physics', () => {
            controller.activate();
            controller.controlValues.throttle = 0.8;
            controller.controlValues.pitch = 0.3;
            
            controller.update(0.1);
            
            expect(mockAirplane.physics.setThrottle).toHaveBeenCalledWith(0.8);
            expect(mockAirplane.physics.setPitch).toHaveBeenCalledWith(0.3);
        });
    });

    describe('Airplane Integration', () => {
        test('should create airplane with all components', () => {
            expect(airplane).toBeDefined();
            expect(airplane.model).toBeDefined();
            expect(airplane.physics).toBeDefined();
            expect(airplane.controller).toBeDefined();
            expect(airplane.debugger).toBeDefined();
            expect(airplane.mesh).toBeDefined();
        });

        test('should update all components in sync', () => {
            const deltaTime = 0.016;
            const initialPosition = airplane.physics.position.clone();
            
            // スロットルを設定して前進
            airplane.physics.setThrottle(1);
            airplane.update(deltaTime);
            
            // 物理位置と3Dモデル位置が同期していることを確認
            expect(airplane.mesh.position).toEqual(airplane.physics.position);
        });

        test('should handle crash events', () => {
            let crashCalled = false;
            airplane.setCrashCallback(() => {
                crashCalled = true;
            });
            
            airplane.physics.crash();
            
            expect(crashCalled).toBe(true);
        });

        test('should provide flight data', () => {
            const flightData = airplane.getFlightData();
            
            expect(flightData).toHaveProperty('position');
            expect(flightData).toHaveProperty('velocity');
            expect(flightData).toHaveProperty('speed');
            expect(flightData).toHaveProperty('altitude');
            expect(flightData).toHaveProperty('isFlying');
        });

        test('should reset to initial state', () => {
            // 飛行機を移動
            airplane.physics.position.set(100, 50, 100);
            airplane.physics.velocity.set(20, 10, 5);
            
            const resetPosition = new THREE.Vector3(10, 15, 20);
            airplane.reset(resetPosition);
            
            expect(airplane.physics.position).toEqual(resetPosition);
            expect(airplane.physics.velocity).toEqual(new THREE.Vector3(0, 0, 0));
        });
    });

    describe('Physics Simulation', () => {
        test('should simulate realistic takeoff sequence', () => {
            // 地上でスロットル全開
            airplane.physics.position.set(0, 1, 0);
            airplane.physics.setThrottle(1);
            
            // 数秒間シミュレーション
            for (let i = 0; i < 100; i++) {
                airplane.physics.update(0.1);
            }
            
            // 離陸速度に達している
            expect(airplane.physics.getSpeed()).toBeGreaterThan(airplane.physics.takeoffSpeed);
        });

        test('should maintain stable flight with proper controls', () => {
            // 飛行状態を設定
            airplane.physics.position.set(0, 20, 0);
            airplane.physics.velocity.set(25, 0, 0);
            airplane.physics.setThrottle(0.7);
            
            const initialAltitude = airplane.physics.getAltitude();
            
            // 安定飛行をシミュレーション
            for (let i = 0; i < 50; i++) {
                airplane.physics.update(0.1);
            }
            
            // 高度が大きく変化していない（±5m以内）
            const altitudeChange = Math.abs(airplane.physics.getAltitude() - initialAltitude);
            expect(altitudeChange).toBeLessThan(5);
        });

        test('should handle emergency scenarios', () => {
            // 高速での急降下
            airplane.physics.position.set(0, 100, 0);
            airplane.physics.velocity.set(0, -30, 0);
            airplane.physics.setThrottle(0);
            
            // 地面に向かって落下
            while (airplane.physics.position.y > 2) {
                airplane.physics.update(0.1);
            }
            
            // クラッシュが検知されること
            expect(airplane.physics.isOnGround).toBe(true);
        });
    });

    describe('Performance Tests', () => {
        test('should handle multiple update cycles efficiently', () => {
            const startTime = performance.now();
            
            // 1000回の更新サイクル
            for (let i = 0; i < 1000; i++) {
                airplane.update(0.016);
            }
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            // 1000フレームが100ms以内で処理される
            expect(duration).toBeLessThan(100);
        });

        test('should maintain 60fps target with complex physics', () => {
            const targetFrameTime = 16.67; // 60fps = 16.67ms per frame
            const measurements = [];
            
            for (let i = 0; i < 60; i++) {
                const frameStart = performance.now();
                
                // 複雑な飛行状態をシミュレート
                airplane.physics.setThrottle(Math.random());
                airplane.physics.setPitch((Math.random() - 0.5) * 0.5);
                airplane.physics.setRoll((Math.random() - 0.5) * 0.8);
                airplane.update(0.016);
                
                const frameEnd = performance.now();
                measurements.push(frameEnd - frameStart);
            }
            
            const avgFrameTime = measurements.reduce((a, b) => a + b, 0) / measurements.length;
            
            // 平均フレーム時間が目標値以下
            expect(avgFrameTime).toBeLessThan(targetFrameTime);
        });
    });

    describe('Debug System Tests', () => {
        test('should initialize physics with debug mode support', () => {
            const physics = new AirplanePhysics();
            expect(physics.isDebugMode).toBe(false);
        });

        test('should skip physics updates in debug mode', () => {
            airplane.physics.isDebugMode = true;
            airplane.physics.position.set(10, 10, 10);
            const initialPosition = airplane.physics.position.clone();
            
            airplane.physics.update(0.1);
            
            // Position should remain unchanged in debug mode
            expect(airplane.physics.position).toEqual(initialPosition);
        });

        test('should create debugger with airplane reference', () => {
            expect(airplane.debugger).toBeDefined();
            expect(airplane.debugger.airplane).toBe(airplane);
            expect(airplane.debugger.scene).toBe(scene);
        });

        test('should toggle debug mode', () => {
            const initialDebugMode = airplane.debugger.isDebugMode;
            airplane.debugger.toggleDebugMode();
            expect(airplane.debugger.isDebugMode).toBe(!initialDebugMode);
        });

        test('should have debug controls with correct sensitivity', () => {
            expect(airplane.debugger.debugControlSensitivity).toBeDefined();
            expect(airplane.debugger.debugControlSensitivity.roll).toBeGreaterThan(0);
            expect(airplane.debugger.debugControlSensitivity.pitch).toBeGreaterThan(0);
            expect(airplane.debugger.debugControlSensitivity.yaw).toBeGreaterThan(0);
        });
    });

    describe('AirplaneHUD', () => {
        let hud;
        let mockAirplane;

        beforeEach(() => {
            // Mock querySelector to return elements for attitude indicator
            document.querySelector = jest.fn(() => ({
                style: { transform: '' }
            }));
            
            mockAirplane = {
                getFlightData: jest.fn(() => ({
                    position: new THREE.Vector3(10, 20, 30),
                    velocity: new THREE.Vector3(15, 2, 0),
                    rotation: new THREE.Euler(0.1, 0.2, 0.05),
                    speed: 25,
                    altitude: 20,
                    heading: 1.57,
                    isFlying: true,
                    isOnGround: false,
                    throttle: 0.8,
                    fuel: 0.9
                })),
                controller: {
                    getControlStatus: jest.fn(() => ({
                        throttle: 0.8,
                        pitch: 0.2,
                        yaw: 0.1,
                        roll: -0.1
                    }))
                },
                physics: {
                    stallSpeed: 8,
                    takeoffSpeed: 12
                }
            };
            
            hud = new AirplaneHUD(mockAirplane);
        });

        afterEach(() => {
            if (hud) {
                hud.dispose();
            }
        });

        test('should initialize with airplane reference', () => {
            expect(hud.airplane).toBe(mockAirplane);
            expect(hud.isVisible).toBe(true);
        });

        test('should create HUD elements', () => {
            expect(hud.hudElement).toBeDefined();
            expect(hud.attitudeIndicator).toBeDefined();
        });

        test('should update attitude indicator with pitch and roll', () => {
            const pitch = 15;
            const roll = -10;
            
            hud.updateAttitudeIndicator(pitch, roll);
            
            // The attitude indicator should be updated (specific implementation depends on DOM mocking)
            expect(document.querySelector).toHaveBeenCalled();
        });

        test('should calculate compass direction correctly', () => {
            expect(hud.getCompassDirection(0)).toBe('N');
            expect(hud.getCompassDirection(90)).toBe('E');
            expect(hud.getCompassDirection(180)).toBe('S');
            expect(hud.getCompassDirection(270)).toBe('W');
            expect(hud.getCompassDirection(45)).toBe('NE');
        });

        test('should create throttle bar with correct colors', () => {
            const lowThrottle = hud.createThrottleBar(0.2);
            const midThrottle = hud.createThrottleBar(0.6);
            const highThrottle = hud.createThrottleBar(0.9);
            
            expect(lowThrottle).toContain('#00ff00'); // Green for low
            expect(midThrottle).toContain('#ffff00'); // Yellow for mid
            expect(highThrottle).toContain('#ff8800'); // Orange for high
        });

        test('should update performance stats', () => {
            const initialFrameCount = hud.performanceStats.frameCount;
            
            hud.updatePerformanceStats();
            
            expect(hud.performanceStats.frameCount).toBe(initialFrameCount + 1);
        });

        test('should toggle visibility correctly', () => {
            expect(hud.isVisible).toBe(true);
            
            hud.toggle();
            expect(hud.isVisible).toBe(false);
            
            hud.toggle();
            expect(hud.isVisible).toBe(true);
        });

        test('should show and hide HUD elements', () => {
            hud.hide();
            expect(hud.isVisible).toBe(false);
            
            hud.show();
            expect(hud.isVisible).toBe(true);
        });

        test('should get flight status correctly', () => {
            const groundedData = { isOnGround: true, speed: 2 };
            const flyingData = { isOnGround: false, speed: 15 };
            const stalledData = { isOnGround: false, speed: 5 };
            
            expect(hud.getFlightStatus(groundedData, false)).toBe('PARKED');
            expect(hud.getFlightStatus({ ...groundedData, speed: 8 }, false)).toBe('TAXI');
            expect(hud.getFlightStatus(flyingData, false)).toBe('FLYING');
            expect(hud.getFlightStatus(stalledData, true)).toBe('STALL');
        });

        test('should handle disposal properly', () => {
            const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
            
            hud.dispose();
            
            expect(clearIntervalSpy).toHaveBeenCalled();
        });
    });
});