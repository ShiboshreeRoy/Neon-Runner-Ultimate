/**
         * NEON RUNNER ULTIMATE: CAREER EDITION
         * Features: Shop System, Parallax Backgrounds, Magnet, Stats, Inventory
 */

        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        
        // --- Data & Themes ---
        const THEMES = {
            'neon_city': {
                name: "NEON CITY",
                id: 'neon_city',
                bgTop: "#0b0b14", bgBottom: "#2d1b4e",
                accent: "#00f3ff", secondary: "#bc13fe", danger: "#ff2a6d",
                grid: "rgba(188, 19, 254, 0.3)",
                sunColor1: "#ffbd2a", sunColor2: "#ff2a6d",
                weather: 'clear',
                cost: 0
            },
            'mars_colony': {
                name: "MARS COLONY",
                id: 'mars_colony',
                bgTop: "#1f0c0c", bgBottom: "#4e1b1b",
                accent: "#ffaa00", secondary: "#ff5500", danger: "#ffffff",
                grid: "rgba(255, 85, 0, 0.3)",
                sunColor1: "#ffffff", sunColor2: "#ffaa00",
                weather: 'embers',
                cost: 500
            },
            'digital_void': {
                name: "DIGITAL VOID",
                id: 'digital_void',
                bgTop: "#000000", bgBottom: "#001100",
                accent: "#00ff00", secondary: "#008800", danger: "#ff0000",
                grid: "rgba(0, 255, 0, 0.2)",
                sunColor1: "#00ff00", sunColor2: "#003300",
                weather: 'matrix',
                cost: 1000
            },
            'midnight_tokyo': {
                name: "MIDNIGHT TOKYO",
                id: 'midnight_tokyo',
                bgTop: "#050510", bgBottom: "#100520",
                accent: "#ff00ff", secondary: "#00ffff", danger: "#ffff00",
                grid: "rgba(255, 0, 255, 0.2)",
                sunColor1: "#ff00ff", sunColor2: "#550055",
                weather: 'rain',
                cost: 2000
            }
        };

        const CONFIG = {
            gravity: 0.6,
            jumpForce: -11,
            doubleJumpForce: -9,
            dashForce: 15,
            groundHeight: 80,
            baseSpeed: 7,
            dashCooldownFrames: 300
        };

        // --- Save Data ---
        let playerData = JSON.parse(localStorage.getItem('neonRunnerData')) || {
            currency: 0,
            highScore: 0,
            inventory: ['neon_city'],
            equippedTheme: 'neon_city',
            stats: { runs: 0, totalDist: 0 }
        };

        // --- Game State ---
        let state = {
            isPlaying: false,
            isPaused: false,
            isMuted: localStorage.getItem('neonRunnerMuted') === 'true',
            score: 0,
            runCurrency: 0,
            speed: CONFIG.baseSpeed,
            frameCount: 0,
            shakeIntensity: 0,
            theme: THEMES[playerData.equippedTheme],
            timeScale: 1.0,
            warpTimer: 0,
            magnetTimer: 0
        };

        // --- Engine Vars ---
        let width, height;
        let animationId;
        
        // --- Entities ---
        let player;
        let obstacles = [];
        let powerups = [];
        let particles = [];
        let weatherParticles = [];
        let parallaxLayers = [];
        let gridOffset = 0;

        // --- Audio System ---
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const audioCtx = new AudioContext();

        document.getElementById('mute-btn').innerText = state.isMuted ? '🔇' : '🔊';

        function playSound(type) {
            if (state.isMuted || !state.isPlaying) return;
            if (audioCtx.state === 'suspended') audioCtx.resume();
            
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            const now = audioCtx.currentTime;

            switch(type) {
                case 'jump':
                    osc.type = 'square';
                    osc.frequency.setValueAtTime(150, now);
                    osc.frequency.exponentialRampToValueAtTime(400, now + 0.1);
                    gain.gain.setValueAtTime(0.05, now);
                    gain.gain.linearRampToValueAtTime(0, now + 0.1);
                    osc.start(); osc.stop(now + 0.1);
                    break;
                case 'dash':
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(800, now);
                    osc.frequency.linearRampToValueAtTime(1200, now + 0.2);
                    gain.gain.setValueAtTime(0.05, now);
                    gain.gain.linearRampToValueAtTime(0, now + 0.2);
                    osc.start(); osc.stop(now + 0.2);
                    break;
                case 'crash':
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(100, now);
                    osc.frequency.exponentialRampToValueAtTime(10, now + 0.3);
                    gain.gain.setValueAtTime(0.2, now);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
                    osc.start(); osc.stop(now + 0.3);
                    break;
                case 'pickup':
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(1200, now);
                    osc.frequency.linearRampToValueAtTime(2000, now + 0.1);
                    gain.gain.setValueAtTime(0.05, now);
                    gain.gain.linearRampToValueAtTime(0, now + 0.1);
                    osc.start(); osc.stop(now + 0.1);
                    break;
                case 'powerup':
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(400, now);
                    osc.frequency.linearRampToValueAtTime(800, now + 0.3);
                    gain.gain.setValueAtTime(0.1, now);
                    gain.gain.linearRampToValueAtTime(0, now + 0.3);
                    osc.start(); osc.stop(now + 0.3);
                    break;
                case 'buy':
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(600, now);
                    osc.frequency.setValueAtTime(900, now + 0.1);
                    gain.gain.setValueAtTime(0.1, now);
                    gain.gain.linearRampToValueAtTime(0, now + 0.2);
                    osc.start(); osc.stop(now + 0.2);
                    break;
            }
        }

        // --- Parallax System ---
        class ParallaxLayer {
            constructor(speedMod, yOffset, heightRange, count, color) {
                this.speedMod = speedMod;
                this.elements = [];
                this.color = color;
                this.yOffset = yOffset;
                
                for(let i=0; i<count; i++) {
                    this.elements.push({
                        x: Math.random() * width,
                        w: 20 + Math.random() * 50,
                        h: heightRange[0] + Math.random() * (heightRange[1] - heightRange[0])
                    });
                }
            }

            update(speed) {
                this.elements.forEach(el => {
                    el.x -= speed * this.speedMod;
                    if (el.x + el.w < 0) {
                        el.x = width + Math.random() * 100;
                    }
                });
            }

            draw(ctx, groundY) {
                ctx.fillStyle = this.color;
                this.elements.forEach(el => {
                    ctx.fillRect(el.x, groundY - el.h - this.yOffset, el.w, el.h);
                });
            }
        }

        // --- Classes ---

        class Player {
            constructor() {
                this.w = 40; this.h = 40;
                this.x = 80;
                this.y = 0;
                this.dy = 0;
                this.isGrounded = false;
                this.hasShield = false;
                this.jumpCount = 0;
                this.maxJumps = 2;
                this.trail = [];
                
                this.isDashing = false;
                this.dashTimer = 0;
                this.dashCooldown = 0;
                this.jumpLocked = false;
            }

            update() {
                // Dash
                if ((keys['ShiftLeft'] || keys['ShiftRight'] || swipeDirection === 'right') && this.dashCooldown <= 0) {
                    this.startDash();
                    swipeDirection = null;
                }

                // Fast Drop
                if ((keys['ArrowDown'] || keys['KeyS'] || swipeDirection === 'down') && !this.isGrounded && !this.isDashing) {
                    this.dy += 2 * state.timeScale;
                    createExplosion(this.x + this.w/2, this.y, 1, '#fff');
                    swipeDirection = null;
                }

                // Physics
                if (this.isDashing) {
                    this.dy = 0;
                    this.dashTimer--;
                    if (this.dashTimer <= 0) {
                        this.isDashing = false;
                        this.dashCooldown = CONFIG.dashCooldownFrames;
                    }
                    this.trail.push({x: this.x, y: this.y, alpha: 0.8, color: '#fff'});
                } else {
                    this.y += this.dy * state.timeScale;
                    const groundY = height - CONFIG.groundHeight - this.h;
                    if (this.y < groundY) {
                        this.dy += CONFIG.gravity * state.timeScale;
                        this.isGrounded = false;
                    } else {
                        this.y = groundY;
                        this.dy = 0;
                        this.isGrounded = true;
                        this.jumpCount = 0;
                    }
                }

                if (this.dashCooldown > 0) this.dashCooldown -= 1 * state.timeScale;

                // Jump
                if (keys['Space'] || keys['ArrowUp'] || touchActive) {
                    if (!this.jumpLocked && !this.isDashing) {
                        if (this.isGrounded) {
                            this.jump(CONFIG.jumpForce);
                        } else if (this.jumpCount < this.maxJumps) {
                            this.jump(CONFIG.doubleJumpForce);
                            createExplosion(this.x + this.w/2, this.y + this.h, 5, state.theme.accent);
                        }
                        this.jumpLocked = true;
                    }
                } else {
                    this.jumpLocked = false;
                }

                if (state.frameCount % 2 === 0) {
                    this.trail.push({x: this.x, y: this.y, alpha: 0.5, color: state.theme.accent});
                    if (this.trail.length > 8) this.trail.shift();
                }

                this.updateUI();
            }

            startDash() {
                this.isDashing = true;
                this.dashTimer = 15;
                playSound('dash');
                state.shakeIntensity = 5;
            }

            jump(force) {
                this.dy = force;
                this.isGrounded = false;
                this.jumpCount++;
                playSound('jump');
            }

            updateUI() {
                const bar = document.getElementById('dash-bar');
                const pct = 1 - (this.dashCooldown / CONFIG.dashCooldownFrames);
                bar.style.transform = `scaleX(${Math.max(0, Math.min(1, pct))})`;
                bar.style.backgroundColor = this.dashCooldown <= 0 ? state.theme.accent : '#555';
            }

            draw() {
                this.trail.forEach(t => {
                    ctx.fillStyle = t.color === '#fff' ? 'rgba(255,255,255,0.7)' : `rgba(${hexToRgb(state.theme.accent)}, ${t.alpha})`;
                    ctx.fillRect(t.x, t.y, this.w, this.h);
                    t.x -= (state.speed * state.timeScale);
                    t.alpha -= 0.05;
                });

                if (this.hasShield) {
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(this.x + this.w/2, this.y + this.h/2, 45, 0, Math.PI * 2);
                    ctx.strokeStyle = state.theme.secondary;
                    ctx.lineWidth = 2;
                    ctx.shadowBlur = 15;
                    ctx.shadowColor = state.theme.secondary;
                    ctx.stroke();
                    ctx.restore();
                }

                // Magnet Aura
                if (state.magnetTimer > 0) {
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(this.x + this.w/2, this.y + this.h/2, 100, 0, Math.PI * 2);
                    ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 + Math.sin(state.frameCount * 0.1) * 0.05})`;
                    ctx.lineWidth = 1;
                    ctx.stroke();
                    ctx.restore();
                }

                ctx.save();
                ctx.translate(this.x, this.y);
                
                if (this.isDashing) {
                    ctx.globalCompositeOperation = 'lighter';
                    ctx.fillStyle = '#fff';
                    ctx.shadowColor = '#fff';
                    ctx.shadowBlur = 30;
                } else {
                    ctx.shadowColor = state.theme.accent;
                    ctx.shadowBlur = 20;
                    ctx.fillStyle = '#000';
                }

                ctx.fillRect(0, 0, this.w, this.h);
                ctx.strokeStyle = this.isDashing ? '#fff' : state.theme.accent;
                ctx.lineWidth = 2;
                ctx.strokeRect(0, 0, this.w, this.h);
                
                if (!this.isDashing) {
                    ctx.fillStyle = state.theme.accent;
                    ctx.fillRect(12, 12, this.w - 24, this.h - 24);
                }
                ctx.restore();
            }
        }

        class Obstacle {
            constructor() {
                this.w = 30 + Math.random() * 20;
                this.h = 40 + Math.random() * 30;
                this.x = width + 100;
                this.markedForDeletion = false;
                
                const rand = Math.random();
                if (state.score > 2000 && rand < 0.25) {
                    this.type = 'drone'; 
                    this.y = height - CONFIG.groundHeight - 110; 
                    this.w = 40; this.h = 20;
                } else if (state.score > 4000 && rand > 0.85) {
                    this.type = 'roller';
                    this.y = height - CONFIG.groundHeight - 30;
                    this.w = 30; this.h = 30;
                } else {
                    this.type = 'block';
                    this.y = height - CONFIG.groundHeight - this.h;
                }
                this.rotation = 0;
            }

            update() {
                this.x -= (state.speed * state.timeScale);
                if (this.type === 'drone') this.rotation += 0.2 * state.timeScale;
                if (this.type === 'roller') this.rotation -= 0.1 * state.timeScale;
                if (this.x + this.w < -50) this.markedForDeletion = true;
            }

            draw() {
                ctx.save();
                ctx.translate(this.x + this.w/2, this.y + this.h/2);
                ctx.shadowBlur = 10;
                ctx.shadowColor = state.theme.danger;

                if (this.type === 'drone') {
                    ctx.rotate(this.rotation);
                    ctx.fillStyle = state.theme.danger;
                    ctx.beginPath();
                    ctx.moveTo(0, -15); ctx.lineTo(15, 0); ctx.lineTo(0, 15); ctx.lineTo(-15, 0);
                    ctx.fill();
                } else if (this.type === 'roller') {
                    ctx.rotate(this.rotation);
                    ctx.strokeStyle = state.theme.danger;
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.arc(0,0, 15, 0, Math.PI*2);
                    ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(0,-15); ctx.lineTo(0,15); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(-15,0); ctx.lineTo(15,0); ctx.stroke();
                } else {
                    ctx.fillStyle = '#111';
                    ctx.strokeStyle = state.theme.danger;
                    ctx.lineWidth = 2;
                    ctx.fillRect(-this.w/2, -this.h/2, this.w, this.h);
                    ctx.strokeRect(-this.w/2, -this.h/2, this.w, this.h);
                    ctx.fillStyle = state.theme.danger;
                    ctx.fillRect(-this.w/2 + 5, -5, this.w - 10, 10);
                }
                ctx.restore();
            }
        }

        class Particle {
            constructor(x, y, color, speed) {
                this.x = x; this.y = y; this.color = color;
                this.vx = (Math.random() - 0.5) * speed;
                this.vy = (Math.random() - 0.5) * speed;
                this.life = 1.0;
                this.size = Math.random() * 3 + 1;
            }
            update() {
                this.x += this.vx * state.timeScale; 
                this.y += this.vy * state.timeScale;
                this.life -= 0.03 * state.timeScale;
            }
            draw() {
                ctx.globalAlpha = Math.max(0, this.life);
                ctx.fillStyle = this.color;
                ctx.fillRect(this.x, this.y, this.size, this.size);
                ctx.globalAlpha = 1;
            }
        }

        class WeatherParticle {
            constructor(type) {
                this.reset(type);
                this.y = Math.random() * height;
                this.x = Math.random() * width;
            }
            reset(type) {
                this.type = type;
                this.x = Math.random() * width + width;
                this.y = -10;
                this.baseSpeedX = -state.speed - Math.random() * 5;
                this.baseSpeedY = 10 + Math.random() * 5;
                this.size = Math.random() * 2 + 1;
                
                if (type === 'embers') {
                    this.baseSpeedY = -1 - Math.random();
                    this.baseSpeedX = -2 - Math.random();
                    this.y = height + 10;
                    this.x = Math.random() * width;
                    this.color = `rgba(255, 100, 0, ${Math.random()})`;
                } else if (type === 'matrix') {
                    this.baseSpeedY = 15;
                    this.baseSpeedX = 0;
                    this.x = Math.random() * width;
                    this.color = '#00ff00';
                    this.char = String.fromCharCode(0x30A0 + Math.random() * 96);
                } else {
                    this.color = `rgba(200, 200, 255, ${Math.random() * 0.5})`;
                }
            }
            update() {
                this.x += this.baseSpeedX * state.timeScale;
                this.y += this.baseSpeedY * state.timeScale;
                
                if (this.type === 'embers') {
                    if (this.y < 0) this.reset(this.type);
                } else {
                    if (this.y > height) this.reset(this.type);
                }
            }
            draw() {
                ctx.fillStyle = this.color;
                if (this.type === 'matrix') {
                    ctx.font = '12px monospace';
                    ctx.fillText(this.char, this.x, this.y);
                } else {
                    ctx.fillRect(this.x, this.y, this.size, this.size);
                }
            }
        }

        // --- Helpers ---
        function hexToRgb(hex) {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '255,255,255';
        }

        function saveGame() {
            localStorage.setItem('neonRunnerData', JSON.stringify(playerData));
        }

        // --- Core Engine ---

        function init() {
            resize();
            window.addEventListener('resize', resize);
            window.addEventListener('blur', () => {
                if(state.isPlaying && !state.isPaused) togglePause();
            });
            updateHUD();
            updateTheme();
            createParallax();
        }

        function resize() {
            const c = document.getElementById('game-container');
            width = c.clientWidth; height = c.clientHeight;
            canvas.width = width; canvas.height = height;
            createParallax();
        }

        function createParallax() {
            parallaxLayers = [];
            // Far Buildings
            parallaxLayers.push(new ParallaxLayer(0.1, 0, [50, 100], 10, '#000')); 
            // Mid Buildings
            parallaxLayers.push(new ParallaxLayer(0.2, 0, [80, 150], 8, '#111')); 
            // Near Structures
            parallaxLayers.push(new ParallaxLayer(0.5, 0, [30, 60], 5, '#222')); 
        }

        function togglePause() {
            if (!state.isPlaying) return;
            state.isPaused = !state.isPaused;
            const pauseScreen = document.getElementById('pause-screen');
            const pauseBtn = document.getElementById('pause-btn');
            if (state.isPaused) {
                pauseScreen.classList.remove('hidden');
                pauseBtn.innerText = '▶';
                cancelAnimationFrame(animationId);
            } else {
                pauseScreen.classList.add('hidden');
                pauseBtn.innerText = 'II';
                update();
            }
        }

        function toggleMute() {
            state.isMuted = !state.isMuted;
            localStorage.setItem('neonRunnerMuted', state.isMuted);
            document.getElementById('mute-btn').innerText = state.isMuted ? '🔇' : '🔊';
        }

        function updateHUD() {
            document.getElementById('high-score').innerText = `RECORD: ${Math.floor(playerData.highScore)}`;
            document.getElementById('currency-display').innerText = `💎 ${playerData.currency}`;
            document.getElementById('shop-currency').innerText = `💎 ${playerData.currency}`;
        }

        function updateTheme() {
            const t = state.theme;
            document.documentElement.style.setProperty('--accent-color', t.accent);
            document.documentElement.style.setProperty('--secondary-color', t.secondary);
            document.documentElement.style.setProperty('--danger-color', t.danger);
            document.getElementById('level-name').innerText = t.name;
            
            weatherParticles = [];
            if (t.weather !== 'clear') {
                for(let i=0; i<60; i++) weatherParticles.push(new WeatherParticle(t.weather));
            }
            createParallax(); // Re-color layers if needed in future
        }

        function createExplosion(x, y, count, color) {
            for(let i=0; i<count; i++) particles.push(new Particle(x, y, color, 8));
        }

        function drawEnvironment() {
            const grad = ctx.createLinearGradient(0, 0, 0, height);
            grad.addColorStop(0, state.theme.bgTop);
            grad.addColorStop(1, state.theme.bgBottom);
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, width, height);

            // Sun
            ctx.save();
            const sunY = height - CONFIG.groundHeight - 50;
            const sunX = width / 2;
            const sunGrad = ctx.createLinearGradient(0, sunY - 80, 0, sunY + 80);
            sunGrad.addColorStop(0, state.theme.sunColor1);
            sunGrad.addColorStop(1, state.theme.sunColor2);
            ctx.fillStyle = sunGrad;
            ctx.shadowBlur = 40;
            ctx.shadowColor = state.theme.sunColor2;
            ctx.beginPath();
            ctx.arc(sunX, sunY, 100, 0, Math.PI * 2);
            ctx.fill();
            ctx.clip();
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            for(let i=0; i<10; i++) ctx.fillRect(sunX-150, sunY+(i*15)-20, 300, 4+i);
            ctx.restore();

            // Parallax
            const groundY = height - CONFIG.groundHeight;
            parallaxLayers.forEach((layer, index) => {
                // Dim further layers
                ctx.globalAlpha = 0.3 + (index * 0.2);
                layer.draw(ctx, groundY);
                ctx.globalAlpha = 1.0;
            });

            // Grid Floor
            ctx.save();
            ctx.fillStyle = '#000';
            ctx.fillRect(0, groundY, width, CONFIG.groundHeight);
            
            ctx.strokeStyle = state.theme.grid;
            ctx.lineWidth = 2;
            ctx.beginPath();
            gridOffset = (gridOffset + state.speed * state.timeScale) % 40;
            for(let i=0; i<CONFIG.groundHeight; i+=40) {
                let y = groundY + i + gridOffset;
                if (y > height) y -= CONFIG.groundHeight;
                ctx.moveTo(0, y); ctx.lineTo(width, y);
            }
            for(let i=-width; i<width*2; i+=120) {
                ctx.moveTo(i, groundY);
                ctx.lineTo((i - width/2)*4 + width/2, height);
            }
            ctx.stroke();
            ctx.strokeStyle = state.theme.accent;
            ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(width, groundY); ctx.stroke();
            ctx.restore();
        }

        function update() {
            if (!state.isPlaying || state.isPaused) return;

            // Powerup Timers
            if (state.warpTimer > 0) {
                state.warpTimer--;
                state.timeScale = 0.5;
                if(state.warpTimer === 0) state.timeScale = 1.0;
                document.getElementById('warp-status').style.opacity = 1;
            } else {
                document.getElementById('warp-status').style.opacity = 0;
            }

            if (state.magnetTimer > 0) {
                state.magnetTimer--;
                document.getElementById('magnet-status').style.opacity = 1;
            } else {
                document.getElementById('magnet-status').style.opacity = 0;
            }

            // Camera Shake
            ctx.save();
            if (state.shakeIntensity > 0) {
                ctx.translate((Math.random()-0.5)*state.shakeIntensity, (Math.random()-0.5)*state.shakeIntensity);
                state.shakeIntensity *= 0.9;
                if(state.shakeIntensity < 0.5) state.shakeIntensity = 0;
            }

            ctx.clearRect(0, 0, width, height);
            
            // Updates
            parallaxLayers.forEach(l => l.update(state.speed * state.timeScale));
            drawEnvironment();
            weatherParticles.forEach(p => { p.update(); p.draw(); });

            player.update();
            player.draw();

            // Spawn Logic
            if (state.frameCount % Math.floor(1200 / state.speed * (1 + Math.random())) === 0) {
                obstacles.push(new Obstacle());
            }
            // Spawn Powerups/Currency
            if (Math.random() < 0.015) {
                const rand = Math.random();
                let type = 'currency';
                if (rand > 0.8) type = 'shield';
                else if (rand > 0.6) type = 'warp';
                else if (rand > 0.4) type = 'magnet';
                
                powerups.push({x: width, y: height - 150 - Math.random()*100, w: 20, h: 20, type: type});
            }

            // Powerups Logic
            powerups.forEach((p, i) => {
                // Magnet Effect
                if (state.magnetTimer > 0 && p.x < player.x + 400 && p.x > player.x) {
                    p.x -= (state.speed * state.timeScale) + 5; // Move faster towards player
                    if (p.y > player.y) p.y -= 3;
                    if (p.y < player.y) p.y += 3;
                } else {
                    p.x -= state.speed * state.timeScale;
                }
                
                // Draw
                ctx.save();
                ctx.translate(p.x + 10, p.y + 10);
                if (p.type === 'shield') {
                    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI*2); ctx.fill();
                } else if (p.type === 'currency') {
                    ctx.fillStyle = '#ffd700'; ctx.font = '20px Arial'; ctx.fillText('💎', -10, 5);
                } else if (p.type === 'magnet') {
                    ctx.fillStyle = '#ff0000'; ctx.fillRect(-8,-8,16,16); ctx.fillStyle='#ccc'; ctx.fillRect(-8,-4,16,8);
                } else {
                    ctx.fillStyle = '#00f3ff'; ctx.fillRect(-6, -6, 12, 12); ctx.strokeStyle = '#fff'; ctx.strokeRect(-8, -8, 16, 16);
                }
                ctx.restore();
                
                // Collision
                if (checkRectCollide(player, p)) {
                    if (p.type === 'shield') {
                        player.hasShield = true;
                        document.getElementById('shield-status').style.opacity = 1;
                        playSound('powerup');
                        state.score += 50;
                    } else if (p.type === 'warp') {
                        state.warpTimer = 300;
                        playSound('powerup');
                    } else if (p.type === 'magnet') {
                        state.magnetTimer = 600; // 10 sec
                        playSound('powerup');
                    } else if (p.type === 'currency') {
                        state.runCurrency += 10;
                        playSound('pickup');
                    }
                    powerups.splice(i, 1);
                }
                if (p.x < -20) powerups.splice(i, 1);
            });

            // Obstacles
            obstacles.forEach((obs, i) => {
                obs.update();
                obs.draw();

                if (!player.isDashing && checkRectCollide(player, obs)) {
                    if (player.hasShield) {
                        player.hasShield = false;
                        obs.markedForDeletion = true;
                        document.getElementById('shield-status').style.opacity = 0;
                        createExplosion(obs.x, obs.y, 20, state.theme.secondary);
                        playSound('crash');
                        state.shakeIntensity = 15;
                    } else {
                        gameOver();
                    }
                }
                if (obs.markedForDeletion) obstacles.splice(i, 1);
            });

            particles.forEach((p, i) => {
                p.update(); p.draw();
                if(p.life <= 0) particles.splice(i, 1);
            });

            state.score += 0.2 * state.timeScale;
            state.speed += 0.001 * state.timeScale;
            state.frameCount++;
            
            document.getElementById('current-score').innerText = String(Math.floor(state.score)).padStart(5, '0');
            document.getElementById('currency-display').innerText = `💎 ${playerData.currency + state.runCurrency}`;

            ctx.restore();
            animationId = requestAnimationFrame(update);
        }

        function checkRectCollide(r1, r2) {
            return (r1.x < r2.x + r2.w - 10 && r1.x + r1.w > r2.x + 10 &&
                    r1.y < r2.y + r2.h - 10 && r1.y + r1.h > r2.y + 10);
        }

        // --- Shop Logic ---
        function openShop() {
            if (state.isPlaying) return;
            document.getElementById('shop-screen').classList.remove('hidden');
            document.getElementById('game-over-screen').classList.add('hidden');
            document.getElementById('start-screen').classList.add('hidden');
            renderShop();
        }

        function closeShop() {
            document.getElementById('shop-screen').classList.add('hidden');
            document.getElementById('start-screen').classList.remove('hidden');
        }

        function renderShop() {
            const container = document.getElementById('shop-items');
            container.innerHTML = '';
            
            Object.values(THEMES).forEach(theme => {
                const isOwned = playerData.inventory.includes(theme.id);
                const isEquipped = playerData.equippedTheme === theme.id;
                
                const item = document.createElement('div');
                item.className = `shop-item ${isOwned ? 'purchased' : ''} ${isEquipped ? 'active' : ''}`;
                item.innerHTML = `
                    <div style="font-weight:bold; color: ${theme.accent}">${theme.name}</div>
                    <div class="item-price">${isOwned ? (isEquipped ? 'EQUIPPED' : 'OWNED') : `💎 ${theme.cost}`}</div>
                `;
                
                item.onclick = () => {
                    if (isOwned) {
                        playerData.equippedTheme = theme.id;
                        state.theme = THEMES[theme.id];
                        updateTheme();
                        saveGame();
                        renderShop();
                        playSound('buy');
                    } else if (playerData.currency >= theme.cost) {
                        playerData.currency -= theme.cost;
                        playerData.inventory.push(theme.id);
                        saveGame();
                        updateHUD();
                        renderShop();
                        playSound('buy');
                    } else {
                        // cant afford sound
                    }
                };
                container.appendChild(item);
            });
        }

        // --- Flow Control ---

        function startCountdown() {
            document.getElementById('start-screen').classList.add('hidden');
            document.getElementById('countdown-screen').classList.remove('hidden');
            
            let count = 3;
            const cd = document.getElementById('countdown-screen');
            cd.innerText = count;
            
            const timer = setInterval(() => {
                count--;
                if(count > 0) {
                    cd.innerText = count;
                    playSound('pickup'); 
                } else {
                    clearInterval(timer);
                    cd.innerText = "GO!";
                    playSound('warp');
                    setTimeout(() => {
                        cd.classList.add('hidden');
                        startGame();
                    }, 500);
                }
            }, 800);
        }

        function startGame() {
            state.isPlaying = true;
            state.isPaused = false;
            state.score = 0;
            state.runCurrency = 0;
            state.speed = CONFIG.baseSpeed;
            state.theme = THEMES[playerData.equippedTheme];
            state.timeScale = 1.0;
            state.warpTimer = 0;
            state.magnetTimer = 0;
            
            player = new Player();
            obstacles = [];
            powerups = [];
            particles = [];
            state.frameCount = 0;
            
            document.getElementById('game-over-screen').classList.add('hidden');
            document.getElementById('shield-status').style.opacity = 0;
            document.getElementById('pause-btn').innerText = 'II';
            
            updateTheme();
            update();
        }

        function gameOver() {
            state.isPlaying = false;
            cancelAnimationFrame(animationId);
            playSound('crash');
            createExplosion(player.x, player.y, 50, state.theme.danger);
            state.shakeIntensity = 0;

            // Update stats
            playerData.currency += state.runCurrency;
            playerData.stats.runs++;
            playerData.stats.totalDist += Math.floor(state.score);
            
            if (state.score > playerData.highScore) {
                playerData.highScore = state.score;
            }
            saveGame();
            updateHUD();

            document.getElementById('final-score').innerText = Math.floor(state.score);
            document.getElementById('run-currency').innerText = state.runCurrency;
            document.getElementById('game-over-screen').classList.remove('hidden');
        }

        function resetGame() {
            document.getElementById('game-over-screen').classList.add('hidden');
            document.getElementById('pause-screen').classList.add('hidden');
            startCountdown();
        }

        // --- Inputs ---
        const keys = {};
        let touchActive = false;
        let touchStartX = 0;
        let touchStartY = 0;
        let swipeDirection = null;
        
        window.addEventListener('keydown', e => {
            keys[e.code] = true;
            if(e.code === 'Space' || e.code === 'ArrowDown' || e.code === 'ArrowUp') e.preventDefault();
            if(e.code === 'Escape') togglePause();
        });
        window.addEventListener('keyup', e => keys[e.code] = false);
        
        canvas.addEventListener('mousedown', () => touchActive = true);
        canvas.addEventListener('mouseup', () => touchActive = false);
        
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            touchActive = true;
            touchStartX = e.changedTouches[0].screenX;
            touchStartY = e.changedTouches[0].screenY;
        });
        
        canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            touchActive = false;
            const touchEndX = e.changedTouches[0].screenX;
            const touchEndY = e.changedTouches[0].screenY;
            const dx = touchEndX - touchStartX;
            const dy = touchEndY - touchStartY;
            if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
                if (dx > 0) swipeDirection = 'right';
            } else if (Math.abs(dy) > 50) {
                if (dy > 0) swipeDirection = 'down';
            }
        });

        init();
