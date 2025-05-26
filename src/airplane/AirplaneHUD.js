export class AirplaneHUD {
    constructor(airplane) {
        this.airplane = airplane;
        this.hudElement = null;
        this.isVisible = true;
        this.createHUD();
        this.setupToggleKey();
    }

    createHUD() {
        // HUDコンテナの作成
        this.hudElement = document.createElement('div');
        this.hudElement.id = 'airplane-hud';
        this.hudElement.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            background: rgba(0, 0, 0, 0.7);
            color: #00ff00;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            padding: 15px;
            border-radius: 5px;
            border: 2px solid #00ff00;
            min-width: 280px;
            z-index: 1000;
            box-shadow: 0 0 10px rgba(0, 255, 0, 0.3);
        `;

        // スタイル追加
        const style = document.createElement('style');
        style.textContent = `
            #airplane-hud .hud-row {
                display: flex;
                justify-content: space-between;
                margin: 3px 0;
                border-bottom: 1px solid rgba(0, 255, 0, 0.2);
                padding-bottom: 2px;
            }
            #airplane-hud .hud-label {
                color: #88ff88;
            }
            #airplane-hud .hud-value {
                color: #ffffff;
                font-weight: bold;
            }
            #airplane-hud .hud-title {
                color: #00ffff;
                font-size: 16px;
                font-weight: bold;
                text-align: center;
                margin-bottom: 10px;
                border-bottom: 2px solid #00ffff;
                padding-bottom: 5px;
            }
            #airplane-hud .hud-controls {
                margin-top: 10px;
                padding-top: 10px;
                border-top: 1px solid rgba(0, 255, 0, 0.3);
                font-size: 11px;
                color: #aaffaa;
            }
            #airplane-hud .warning {
                color: #ff4444 !important;
                animation: blink 1s infinite;
            }
            @keyframes blink {
                0%, 50% { opacity: 1; }
                51%, 100% { opacity: 0.3; }
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(this.hudElement);
        this.updateHUD();
        
        // 定期更新開始
        this.updateInterval = setInterval(() => {
            if (this.isVisible) {
                this.updateHUD();
            }
        }, 100); // 10 FPS更新
    }

    updateHUD() {
        if (!this.airplane || !this.hudElement) return;

        const flightData = this.airplane.getFlightData();
        const controlStatus = this.airplane.controller.getControlStatus();
        
        // 速度をkm/hに変換
        const speedKmh = (flightData.speed * 3.6).toFixed(1);
        const altitudeM = flightData.altitude.toFixed(1);
        const headingDeg = (flightData.heading * 180 / Math.PI).toFixed(0);
        
        // 状態判定
        const isStalled = flightData.speed < this.airplane.physics.stallSpeed;
        const isOverspeed = flightData.speed > 60; // 220 km/h
        const isLowAltitude = flightData.altitude < 3;
        
        this.hudElement.innerHTML = `
            <div class="hud-title">FLIGHT DATA</div>
            
            <div class="hud-row">
                <span class="hud-label">SPEED:</span>
                <span class="hud-value ${isOverspeed ? 'warning' : ''}">${speedKmh} km/h</span>
            </div>
            
            <div class="hud-row">
                <span class="hud-label">ALTITUDE:</span>
                <span class="hud-value ${isLowAltitude && flightData.isFlying ? 'warning' : ''}">${altitudeM} m</span>
            </div>
            
            <div class="hud-row">
                <span class="hud-label">HEADING:</span>
                <span class="hud-value">${headingDeg}°</span>
            </div>
            
            <div class="hud-row">
                <span class="hud-label">THROTTLE:</span>
                <span class="hud-value">${(flightData.throttle * 100).toFixed(0)}%</span>
            </div>
            
            <div class="hud-row">
                <span class="hud-label">STATUS:</span>
                <span class="hud-value ${isStalled ? 'warning' : ''}">${this.getFlightStatus(flightData, isStalled)}</span>
            </div>
            
            <div class="hud-row">
                <span class="hud-label">POSITION:</span>
                <span class="hud-value">${flightData.position.x.toFixed(1)}, ${flightData.position.z.toFixed(1)}</span>
            </div>
            
            ${this.createControlIndicators(controlStatus)}
            
            <div class="hud-controls">
                <strong>CONTROLS:</strong><br>
                W/S: Throttle | ↑↓: Pitch | ←→: Roll<br>
                A/D: Yaw | Space: Brake | R: Reset<br>
                1-4: Camera | H: Hide HUD
            </div>
        `;
    }

    getFlightStatus(flightData, isStalled) {
        if (flightData.isOnGround) {
            return flightData.speed > 5 ? 'TAXI' : 'PARKED';
        } else if (isStalled) {
            return 'STALL';
        } else if (flightData.speed < this.airplane.physics.takeoffSpeed) {
            return 'CLIMBING';
        } else {
            return 'FLYING';
        }
    }

    createControlIndicators(controlStatus) {
        const throttleBar = this.createBar(controlStatus.throttle, '#00ff00');
        const pitchBar = this.createBar(Math.abs(controlStatus.pitch), controlStatus.pitch < 0 ? '#ff8800' : '#8800ff');
        const yawBar = this.createBar(Math.abs(controlStatus.yaw), controlStatus.yaw < 0 ? '#ff0088' : '#0088ff');
        const rollBar = this.createBar(Math.abs(controlStatus.roll), controlStatus.roll < 0 ? '#ff4400' : '#44ff00');

        return `
            <div class="hud-row">
                <span class="hud-label">THR:</span>
                <span class="hud-value">${throttleBar}</span>
            </div>
            <div class="hud-row">
                <span class="hud-label">PITCH:</span>
                <span class="hud-value">${pitchBar} ${controlStatus.pitch > 0 ? '↑' : controlStatus.pitch < 0 ? '↓' : '─'}</span>
            </div>
            <div class="hud-row">
                <span class="hud-label">YAW:</span>
                <span class="hud-value">${yawBar} ${controlStatus.yaw > 0 ? '←' : controlStatus.yaw < 0 ? '→' : '─'}</span>
            </div>
            <div class="hud-row">
                <span class="hud-label">ROLL:</span>
                <span class="hud-value">${rollBar} ${controlStatus.roll > 0 ? '⟲' : controlStatus.roll < 0 ? '⟳' : '─'}</span>
            </div>
        `;
    }

    createBar(value, color = '#00ff00') {
        const width = Math.round(value * 10);
        const bar = '█'.repeat(width) + '░'.repeat(10 - width);
        return `<span style="color: ${color}">${bar}</span>`;
    }

    setupToggleKey() {
        this.boundToggle = this.onToggleKey.bind(this);
        document.addEventListener('keydown', this.boundToggle);
    }

    onToggleKey(event) {
        if (event.code === 'KeyH') {
            this.toggle();
        }
    }

    toggle() {
        this.isVisible = !this.isVisible;
        this.hudElement.style.display = this.isVisible ? 'block' : 'none';
        console.log('HUD', this.isVisible ? 'shown' : 'hidden');
    }

    show() {
        this.isVisible = true;
        this.hudElement.style.display = 'block';
    }

    hide() {
        this.isVisible = false;
        this.hudElement.style.display = 'none';
    }

    addWarningMessage(message, duration = 3000) {
        const warning = document.createElement('div');
        warning.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255, 0, 0, 0.9);
            color: white;
            font-family: 'Courier New', monospace;
            font-size: 18px;
            font-weight: bold;
            padding: 20px;
            border-radius: 10px;
            border: 3px solid #ff0000;
            z-index: 2000;
            animation: pulse 0.5s infinite alternate;
        `;
        
        const pulseStyle = document.createElement('style');
        pulseStyle.textContent = `
            @keyframes pulse {
                from { box-shadow: 0 0 20px rgba(255, 0, 0, 0.8); }
                to { box-shadow: 0 0 40px rgba(255, 0, 0, 1); }
            }
        `;
        document.head.appendChild(pulseStyle);
        
        warning.textContent = message;
        document.body.appendChild(warning);
        
        setTimeout(() => {
            document.body.removeChild(warning);
            document.head.removeChild(pulseStyle);
        }, duration);
    }

    dispose() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        if (this.hudElement) {
            document.body.removeChild(this.hudElement);
        }
        
        if (this.boundToggle) {
            document.removeEventListener('keydown', this.boundToggle);
        }
        
        console.log('Airplane HUD disposed');
    }
}