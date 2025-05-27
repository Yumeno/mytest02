export class AirplaneHUD {
    constructor(airplane) {
        this.airplane = airplane;
        this.hudElement = null;
        this.attitudeIndicator = null;
        this.isVisible = true;
        this.performanceStats = {
            frameRate: 0,
            frameCount: 0,
            lastTime: Date.now()
        };
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
            background: rgba(0, 0, 0, 0.8);
            color: #00ff00;
            font-family: 'Courier New', monospace;
            font-size: 13px;
            padding: 15px;
            border-radius: 8px;
            border: 2px solid #00ff00;
            min-width: 350px;
            z-index: 1000;
            box-shadow: 0 0 15px rgba(0, 255, 0, 0.4);
        `;

        // 姿勢計の作成
        this.createAttitudeIndicator();

        // スタイル追加
        const style = document.createElement('style');
        style.textContent = `
            #airplane-hud .hud-row {
                display: flex;
                justify-content: space-between;
                margin: 3px 0;
                border-bottom: 1px solid rgba(0, 255, 0, 0.2);
                padding-bottom: 2px;
                align-items: center;
            }
            #airplane-hud .hud-label {
                color: #88ff88;
                min-width: 80px;
            }
            #airplane-hud .hud-value {
                color: #ffffff;
                font-weight: bold;
                flex: 1;
                text-align: right;
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
            #airplane-hud .hud-section {
                margin: 10px 0;
                padding: 8px 0;
                border-top: 1px solid rgba(0, 255, 0, 0.3);
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
            #airplane-hud .gauge {
                display: inline-block;
                background: #001100;
                border: 1px solid #00ff00;
                padding: 2px 4px;
                border-radius: 3px;
                font-family: monospace;
                min-width: 60px;
                text-align: center;
            }
            .attitude-indicator {
                position: fixed;
                top: 10px;
                right: 10px;
                width: 120px;
                height: 120px;
                background: radial-gradient(circle, #001122 0%, #000033 100%);
                border: 3px solid #00ff00;
                border-radius: 50%;
                z-index: 1001;
                overflow: hidden;
            }
            .attitude-horizon {
                position: absolute;
                width: 200%;
                height: 200%;
                left: -50%;
                top: -50%;
                background: linear-gradient(to bottom, #4A90E2 0%, #4A90E2 50%, #8B4513 50%, #8B4513 100%);
                transform-origin: center center;
                transition: transform 0.1s ease-out;
            }
            .attitude-aircraft {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                color: #ffff00;
                font-weight: bold;
                font-size: 16px;
                z-index: 10;
                pointer-events: none;
            }
            .attitude-markings {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
            }
            .attitude-marking {
                position: absolute;
                background: #ffffff;
                transform-origin: center center;
            }
            .attitude-marking.pitch-10 {
                width: 30px;
                height: 1px;
                top: calc(50% - 12px);
                left: calc(50% - 15px);
            }
            .attitude-marking.pitch-20 {
                width: 20px;
                height: 1px;
                top: calc(50% - 24px);
                left: calc(50% - 10px);
            }
            .attitude-marking.pitch-neg10 {
                width: 30px;
                height: 1px;
                top: calc(50% + 12px);
                left: calc(50% - 15px);
            }
            .attitude-marking.pitch-neg20 {
                width: 20px;
                height: 1px;
                top: calc(50% + 24px);
                left: calc(50% - 10px);
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
                this.updatePerformanceStats();
            }
        }, 100); // 10 FPS更新
    }

    createAttitudeIndicator() {
        // 姿勢計の作成
        this.attitudeIndicator = document.createElement('div');
        this.attitudeIndicator.className = 'attitude-indicator';
        
        // 地平線
        const horizon = document.createElement('div');
        horizon.className = 'attitude-horizon';
        this.attitudeIndicator.appendChild(horizon);
        
        // 機体シンボル
        const aircraft = document.createElement('div');
        aircraft.className = 'attitude-aircraft';
        aircraft.innerHTML = '✈';
        this.attitudeIndicator.appendChild(aircraft);
        
        // ピッチマーキング
        const markings = document.createElement('div');
        markings.className = 'attitude-markings';
        
        // ピッチライン
        const pitchLines = [
            { class: 'pitch-20', label: '20' },
            { class: 'pitch-10', label: '10' },
            { class: 'pitch-neg10', label: '-10' },
            { class: 'pitch-neg20', label: '-20' }
        ];
        
        pitchLines.forEach(line => {
            const marking = document.createElement('div');
            marking.className = `attitude-marking ${line.class}`;
            markings.appendChild(marking);
        });
        
        this.attitudeIndicator.appendChild(markings);
        document.body.appendChild(this.attitudeIndicator);
    }

    updateHUD() {
        if (!this.airplane || !this.hudElement) return;

        const flightData = this.airplane.getFlightData();
        const controlStatus = this.airplane.controller.getControlStatus();
        
        // 基本飛行データの計算
        const speedKmh = (flightData.speed * 3.6).toFixed(1);
        const speedKnots = (flightData.speed * 1.944).toFixed(1);
        const altitudeM = flightData.altitude.toFixed(0);
        const altitudeFt = (flightData.altitude * 3.281).toFixed(0);
        const headingDeg = ((flightData.heading * 180 / Math.PI + 360) % 360).toFixed(0);
        
        // 姿勢データ（度単位）
        const pitchDeg = (flightData.rotation.z * 180 / Math.PI).toFixed(1);
        const rollDeg = (flightData.rotation.x * 180 / Math.PI).toFixed(1);
        const yawDeg = (flightData.rotation.y * 180 / Math.PI).toFixed(1);
        
        // 垂直速度計算
        const verticalSpeed = flightData.velocity.y.toFixed(1);
        const verticalSpeedFpm = (flightData.velocity.y * 196.85).toFixed(0); // fpm
        
        // 状態判定
        const isStalled = flightData.speed < this.airplane.physics.stallSpeed;
        const isOverspeed = flightData.speed > 60;
        const isLowAltitude = flightData.altitude < 3;
        const isExtremeAttitude = Math.abs(parseFloat(pitchDeg)) > 30 || Math.abs(parseFloat(rollDeg)) > 45;
        
        // 姿勢計の更新
        this.updateAttitudeIndicator(parseFloat(pitchDeg), parseFloat(rollDeg));
        
        this.hudElement.innerHTML = `
            <div class="hud-title">✈ FLIGHT INSTRUMENTS</div>
            
            <div class="hud-section">
                <div class="hud-row">
                    <span class="hud-label">SPEED:</span>
                    <span class="hud-value ${isOverspeed ? 'warning' : ''}">
                        <span class="gauge">${speedKnots} kt</span>
                        <span class="gauge">${speedKmh} km/h</span>
                    </span>
                </div>
                
                <div class="hud-row">
                    <span class="hud-label">ALTITUDE:</span>
                    <span class="hud-value ${isLowAltitude && flightData.isFlying ? 'warning' : ''}">
                        <span class="gauge">${altitudeFt} ft</span>
                        <span class="gauge">${altitudeM} m</span>
                    </span>
                </div>
                
                <div class="hud-row">
                    <span class="hud-label">V/S:</span>
                    <span class="hud-value">
                        <span class="gauge">${verticalSpeedFpm} fpm</span>
                        <span class="gauge">${verticalSpeed} m/s</span>
                    </span>
                </div>
            </div>
            
            <div class="hud-section">
                <div class="hud-row">
                    <span class="hud-label">HEADING:</span>
                    <span class="hud-value">
                        <span class="gauge">${headingDeg}°</span>
                        ${this.getCompassDirection(parseFloat(headingDeg))}
                    </span>
                </div>
                
                <div class="hud-row">
                    <span class="hud-label">PITCH:</span>
                    <span class="hud-value ${isExtremeAttitude ? 'warning' : ''}">
                        <span class="gauge">${pitchDeg}°</span>
                    </span>
                </div>
                
                <div class="hud-row">
                    <span class="hud-label">ROLL:</span>
                    <span class="hud-value ${isExtremeAttitude ? 'warning' : ''}">
                        <span class="gauge">${rollDeg}°</span>
                    </span>
                </div>
            </div>
            
            <div class="hud-section">
                <div class="hud-row">
                    <span class="hud-label">THROTTLE:</span>
                    <span class="hud-value">
                        <span class="gauge">${(flightData.throttle * 100).toFixed(0)}%</span>
                        ${this.createThrottleBar(flightData.throttle)}
                    </span>
                </div>
                
                <div class="hud-row">
                    <span class="hud-label">STATUS:</span>
                    <span class="hud-value ${isStalled ? 'warning' : ''}">${this.getFlightStatus(flightData, isStalled)}</span>
                </div>
                
                <div class="hud-row">
                    <span class="hud-label">POS:</span>
                    <span class="hud-value">${flightData.position.x.toFixed(0)}, ${flightData.position.z.toFixed(0)}</span>
                </div>
                
                <div class="hud-row">
                    <span class="hud-label">FPS:</span>
                    <span class="hud-value">
                        <span class="gauge">${this.performanceStats.frameRate.toFixed(0)}</span>
                    </span>
                </div>
            </div>
            
            ${this.createControlIndicators(controlStatus)}
            
            <div class="hud-controls">
                <strong>CONTROLS:</strong><br>
                W/S: Throttle | ↑↓: Pitch | ←→: Roll<br>
                A/D: Yaw | Space: Brake | R: Reset<br>
                1-5: Camera | H: Hide HUD | F: Debug
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

    updateAttitudeIndicator(pitch, roll) {
        if (!this.attitudeIndicator) return;
        
        const horizon = this.attitudeIndicator.querySelector('.attitude-horizon');
        if (horizon) {
            // ピッチとロールを適用（ピッチは上下移動、ロールは回転）
            const pitchOffset = pitch * 1.2; // ピッチの移動量調整
            horizon.style.transform = `translateY(${pitchOffset}px) rotate(${-roll}deg)`;
        }
    }

    updatePerformanceStats() {
        this.performanceStats.frameCount++;
        const now = Date.now();
        const elapsed = now - this.performanceStats.lastTime;
        
        if (elapsed >= 1000) {
            this.performanceStats.frameRate = (this.performanceStats.frameCount * 1000) / elapsed;
            this.performanceStats.frameCount = 0;
            this.performanceStats.lastTime = now;
        }
    }

    getCompassDirection(heading) {
        const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
        const index = Math.round(heading / 22.5) % 16;
        return directions[index];
    }

    createThrottleBar(throttle) {
        const segments = 10;
        const activeSegments = Math.round(throttle * segments);
        let bar = '';
        
        for (let i = 0; i < segments; i++) {
            if (i < activeSegments) {
                const color = i < 3 ? '#00ff00' : i < 7 ? '#ffff00' : '#ff8800';
                bar += `<span style="color: ${color}">█</span>`;
            } else {
                bar += `<span style="color: #333333">░</span>`;
            }
        }
        
        return bar;
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
        if (this.attitudeIndicator) {
            this.attitudeIndicator.style.display = this.isVisible ? 'block' : 'none';
        }
        console.log('HUD', this.isVisible ? 'shown' : 'hidden');
    }

    show() {
        this.isVisible = true;
        this.hudElement.style.display = 'block';
        if (this.attitudeIndicator) {
            this.attitudeIndicator.style.display = 'block';
        }
    }

    hide() {
        this.isVisible = false;
        this.hudElement.style.display = 'none';
        if (this.attitudeIndicator) {
            this.attitudeIndicator.style.display = 'none';
        }
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
        
        if (this.hudElement && this.hudElement.parentNode) {
            document.body.removeChild(this.hudElement);
        }
        
        if (this.attitudeIndicator && this.attitudeIndicator.parentNode) {
            document.body.removeChild(this.attitudeIndicator);
        }
        
        if (this.boundToggle) {
            document.removeEventListener('keydown', this.boundToggle);
        }
        
        console.log('Airplane HUD disposed');
    }
}