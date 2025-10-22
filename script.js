// Galactic Defender - Jogo Espacial com Asteroides
class GalacticDefender {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gameState = 'menu'; // menu, playing, paused, gameOver
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('galacticHighScore')) || 0;
        this.lives = 3;
        this.level = 1;
        this.skin = 0;
        
        // Elementos do jogo
        this.player = null;
        this.bullets = [];
        this.asteroids = [];
        this.particles = [];
        this.powerUps = [];
        this.stars = [];
        this.allies = [];
        
        // Controles
        this.keys = {};
        this.mouse = { x: 0, y: 0 };
        this.touchControls = {
            up: false,
            down: false,
            left: false,
            right: false
        };
        
        // Sistema de Missões
        this.missions = [
            { id: 1, title: "Defenda 5 Planetas", description: "Destrua 20 asteroides", target: 20, progress: 0, reward: 100, completed: false },
            { id: 2, title: "Colete Energia Cósmica", description: "Colete 3 power-ups", target: 3, progress: 0, reward: 150, completed: false },
            { id: 3, title: "Sobreviva ao Perigo", description: "Alcance o nível 3", target: 3, progress: 0, reward: 200, completed: false }
        ];
        
        // Sistema de Habilidades
        this.skills = {
            'escudo-luz': { name: 'Escudo da Luz', unlocked: false, active: false, duration: 0 },
            'aura-sagrada': { name: 'Aura Sagrada', unlocked: false, active: false, duration: 0 },
            'velocidade-luz': { name: 'Velocidade da Luz', unlocked: false, active: false, duration: 0 },
            'teletransporte': { name: 'Teletransporte', unlocked: false, active: false, cooldown: 0 },
            'raio-cosmico': { name: 'Raio Cósmico', unlocked: false, active: false, cooldown: 0 },
            'explosao-solar': { name: 'Explosão Solar', unlocked: false, active: false, cooldown: 0 }
        };
        
        // Sistema de Aliados
        this.alliesActive = false;
        this.allyCooldown = 0;
        
        // Economia
        this.celestialCoins = parseInt(localStorage.getItem('celestialCoins')) || 0;
        this.achievementPoints = parseInt(localStorage.getItem('achievementPoints')) || 0;
        
        // Eventos Cósmicos
        this.currentEvent = null;
        this.eventProgress = 0;
        this.eventTarget = 20;
        this.eventEndTime = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 dias
        
        // Skins disponíveis
        this.skins = [
            { id: 0, name: "Nave Estelar", color: "#667fff", requirement: 0, unlocked: true },
            { id: 1, name: "Caça Vermelho", color: "#ff6b6b", requirement: 1000, unlocked: false },
            { id: 2, name: "Interceptor Verde", color: "#51cf66", requirement: 2500, unlocked: false },
            { id: 3, name: "Nave Fantasma", color: "#cc5de8", requirement: 5000, unlocked: false },
            { id: 4, name: "Destroyer Dourado", color: "#ffd43b", requirement: 10000, unlocked: false },
            { id: 5, name: "Nave Lendária", color: "#ff922b", requirement: 20000, unlocked: false }
        ];
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupGame();
        this.createStars();
        this.loadSkins();
        this.updateUI();
        this.hideLoadingScreen();
        this.showDonationPanel();
        this.gameLoop();
        
        // Iniciar música de fundo
        this.playBackgroundMusic();
        
        // Iniciar assistente
        this.startAssistant();
    }

    setupEventListeners() {
        // Controles de teclado
        document.addEventListener('keydown', (e) => {
            // Prevenir comportamento padrão apenas para teclas de jogo
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'w', 'a', 's', 'd'].includes(e.key)) {
                e.preventDefault();
            }
            
            this.keys[e.key] = true;
            
            if (e.key === ' ' && this.gameState === 'playing') {
                this.shoot();
            }
            
            if (e.key === 'p' || e.key === 'P') {
                this.togglePause();
            }
            
            if (e.key === 'Escape') {
                this.showPage('home');
            }
            
            // Ativar habilidades com teclas numéricas
            if (e.key >= '1' && e.key <= '6' && this.gameState === 'playing') {
                this.activateSkill(parseInt(e.key) - 1);
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });

        // Controles de mouse
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });

        this.canvas.addEventListener('click', () => {
            if (this.gameState === 'playing') {
                this.shoot();
            }
        });

        // Controles touch para mobile
        this.setupTouchControls();

        // Botões da UI
        document.getElementById('startBtn').addEventListener('click', () => {
            this.startGame();
        });

        document.getElementById('pauseBtn').addEventListener('click', () => {
            this.togglePause();
        });

        document.getElementById('restartBtn').addEventListener('click', () => {
            this.startGame();
        });

        document.getElementById('equipSkinBtn').addEventListener('click', () => {
            this.equipSelectedSkin();
        });

        document.getElementById('allyBtn').addEventListener('click', () => {
            this.toggleAllies();
        });

        // Painel de doação
        document.getElementById('closeDonation').addEventListener('click', () => {
            this.hideDonationPanel();
        });

        document.getElementById('donateLater').addEventListener('click', () => {
            this.hideDonationPanel();
        });

        document.querySelector('.copy-btn').addEventListener('click', (e) => {
            const code = e.target.closest('.copy-btn').getAttribute('data-code');
            this.copyToClipboard(code);
        });

        // Navegação entre páginas
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.getAttribute('data-page');
                this.showPage(page);
            });
        });

        document.querySelectorAll('[data-page]').forEach(element => {
            if (element.tagName === 'BUTTON') {
                element.addEventListener('click', () => {
                    const page = element.getAttribute('data-page');
                    this.showPage(page);
                });
            }
        });

        // Fechar modal
        document.querySelector('.modal-close').addEventListener('click', () => {
            this.hideGameOverModal();
        });

        // Sistema de habilidades
        document.querySelectorAll('.unlock-skill').forEach(button => {
            button.addEventListener('click', (e) => {
                const skillCard = e.target.closest('.skill-card');
                const skillId = skillCard.getAttribute('data-skill');
                this.unlockSkill(skillId);
            });
        });

        // Filtros de ranking
        document.querySelectorAll('.filter-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                e.target.classList.add('active');
                this.updateRanking();
            });
        });
    }

    setupTouchControls() {
        const upBtn = document.getElementById('upBtn');
        const downBtn = document.getElementById('downBtn');
        const leftBtn = document.getElementById('leftBtn');
        const rightBtn = document.getElementById('rightBtn');
        const shootBtn = document.getElementById('shootBtn');

        // Controles de movimento
        const addTouchListeners = (button, direction) => {
            button.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.touchControls[direction] = true;
            });

            button.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.touchControls[direction] = false;
            });

            button.addEventListener('touchcancel', (e) => {
                e.preventDefault();
                this.touchControls[direction] = false;
            });
        };

        addTouchListeners(upBtn, 'up');
        addTouchListeners(downBtn, 'down');
        addTouchListeners(leftBtn, 'left');
        addTouchListeners(rightBtn, 'right');

        // Controle de tiro
        shootBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this.gameState === 'playing') {
                this.shoot();
            }
        });

        // Detectar se é um dispositivo móvel
        this.isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        if (this.isMobile) {
            document.querySelector('.mobile-controls').style.display = 'flex';
        }
    }

    setupGame() {
        this.player = {
            x: this.canvas.width / 2,
            y: this.canvas.height - 100,
            width: 50,
            height: 70,
            speed: 6,
            color: this.skins[this.skin].color,
            shield: false,
            shieldTime: 0
        };
    }

    createStars() {
        this.stars = [];
        for (let i = 0; i < 100; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 2 + 1,
                speed: Math.random() * 2 + 0.5,
                brightness: Math.random() * 155 + 100
            });
        }
    }

    startGame() {
        this.gameState = 'playing';
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.bullets = [];
        this.asteroids = [];
        this.particles = [];
        this.powerUps = [];
        this.allies = [];
        this.setupGame();
        this.hideGameOverModal();
        this.updateUI();
        
        // Atualizar missões
        this.updateMissions();
    }

    togglePause() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
        } else if (this.gameState === 'paused') {
            this.gameState = 'playing';
        }
        this.updateUI();
    }

    shoot() {
        if (this.gameState !== 'playing') return;

        this.bullets.push({
            x: this.player.x,
            y: this.player.y - 20,
            width: 4,
            height: 12,
            speed: 10,
            color: this.skins[this.skin].color
        });
    }

    update() {
        if (this.gameState !== 'playing') return;

        this.movePlayer();
        this.updateBullets();
        this.updateAsteroids();
        this.updateParticles();
        this.updatePowerUps();
        this.updateAllies();
        this.updateSkills();
        this.checkCollisions();
        this.spawnAsteroids();
        this.spawnPowerUps();
        this.spawnEventItems();
    }

    movePlayer() {
        let speed = this.player.speed;
        
        // Aplicar velocidade da luz se ativa
        if (this.skills['velocidade-luz'].active) {
            speed *= 1.5;
        }
        
        // Controles de teclado
        if (this.keys['ArrowLeft'] || this.keys['a'] || this.touchControls.left) {
            this.player.x = Math.max(this.player.x - speed, this.player.width / 2);
        }
        if (this.keys['ArrowRight'] || this.keys['d'] || this.touchControls.right) {
            this.player.x = Math.min(this.player.x + speed, this.canvas.width - this.player.width / 2);
        }
        if (this.keys['ArrowUp'] || this.keys['w'] || this.touchControls.up) {
            this.player.y = Math.max(this.player.y - speed, this.player.height / 2);
        }
        if (this.keys['ArrowDown'] || this.keys['s'] || this.touchControls.down) {
            this.player.y = Math.min(this.player.y + speed, this.canvas.height - this.player.height / 2);
        }
        
        // Atualizar escudo
        if (this.player.shield) {
            this.player.shieldTime--;
            if (this.player.shieldTime <= 0) {
                this.player.shield = false;
            }
        }
    }

    updateBullets() {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            bullet.y -= bullet.speed;

            if (bullet.y < -bullet.height) {
                this.bullets.splice(i, 1);
            }
        }
    }

    updateAsteroids() {
        for (let i = this.asteroids.length - 1; i >= 0; i--) {
            const asteroid = this.asteroids[i];
            
            // Movimento com rotação
            asteroid.y += asteroid.speed;
            asteroid.rotation += asteroid.rotationSpeed;
            
            // Movimento lateral para alguns asteroides
            if (asteroid.type === 'moving') {
                asteroid.x += Math.sin(asteroid.y * 0.01) * 1.5;
            }

            if (asteroid.y > this.canvas.height + asteroid.size * 2) {
                this.asteroids.splice(i, 1);
            }
        }
    }

    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life--;

            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    updatePowerUps() {
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const powerUp = this.powerUps[i];
            powerUp.y += powerUp.speed;

            if (powerUp.y > this.canvas.height + powerUp.size) {
                this.powerUps.splice(i, 1);
            }
        }
    }

    updateAllies() {
        if (!this.alliesActive) return;
        
        // Atualizar aliados existentes
        for (let i = this.allies.length - 1; i >= 0; i--) {
            const ally = this.allies[i];
            ally.y -= ally.speed;
            
            // Atirar periodicamente
            if (Date.now() - ally.lastShot > 1000) {
                this.allyShoot(ally);
                ally.lastShot = Date.now();
            }
            
            if (ally.y < -ally.size) {
                this.allies.splice(i, 1);
            }
        }
        
        // Spawn de novos aliados
        if (this.allies.length < 2 && Math.random() < 0.01) {
            this.spawnAlly();
        }
    }

    updateSkills() {
        // Atualizar durações e cooldowns
        Object.keys(this.skills).forEach(skillId => {
            const skill = this.skills[skillId];
            
            if (skill.active && skill.duration) {
                skill.duration--;
                if (skill.duration <= 0) {
                    skill.active = false;
                    this.showNotification(`${skill.name} terminou!`);
                }
            }
            
            if (skill.cooldown && skill.cooldown > 0) {
                skill.cooldown--;
            }
        });
        
        // Atualizar cooldown dos aliados
        if (this.allyCooldown > 0) {
            this.allyCooldown--;
        }
    }

    spawnAsteroids() {
        const spawnChance = 0.03 + (this.level * 0.005);
        if (Math.random() < spawnChance) {
            const size = Math.random() * 30 + 25;
            const types = ['normal', 'moving', 'spinning'];
            const type = types[Math.floor(Math.random() * types.length)];
            
            // Asteroides de evento são especiais
            const isEventAsteroid = this.currentEvent && Math.random() < 0.2;
            
            this.asteroids.push({
                x: Math.random() * (this.canvas.width - size * 2) + size,
                y: -size,
                size: size,
                speed: Math.random() * 2 + 1 + (this.level * 0.2),
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.05,
                type: type,
                color: isEventAsteroid ? '#ffd43b' : this.getAsteroidColor(type),
                health: Math.ceil(size / 20),
                vertices: this.generateAsteroidShape(size),
                glowColor: isEventAsteroid ? 'rgba(255, 212, 59, 0.4)' : this.getAsteroidGlowColor(type),
                isEvent: isEventAsteroid
            });
        }
    }

    spawnPowerUps() {
        if (Math.random() < 0.002) {
            this.powerUps.push({
                x: Math.random() * (this.canvas.width - 30),
                y: -30,
                size: 20,
                speed: 2,
                type: Math.random() < 0.5 ? 'life' : 'score',
                color: Math.random() < 0.5 ? '#ff6b6b' : '#51cf66'
            });
        }
    }

    spawnAlly() {
        this.allies.push({
            x: Math.random() * (this.canvas.width - 40),
            y: this.canvas.height + 50,
            size: 30,
            speed: 3,
            color: '#667fff',
            lastShot: Date.now()
        });
    }

    spawnEventItems() {
        if (!this.currentEvent) return;
        
        if (Math.random() < 0.005) {
            this.powerUps.push({
                x: Math.random() * (this.canvas.width - 30),
                y: -30,
                size: 25,
                speed: 2,
                type: 'event',
                color: '#ffd43b',
                glow: true
            });
        }
    }

    allyShoot(ally) {
        this.bullets.push({
            x: ally.x,
            y: ally.y - 10,
            width: 3,
            height: 8,
            speed: 8,
            color: '#667fff',
            isAlly: true
        });
    }

    generateAsteroidShape(size) {
        const vertices = [];
        const numPoints = 8 + Math.floor(Math.random() * 4);
        
        for (let i = 0; i < numPoints; i++) {
            const angle = (i / numPoints) * Math.PI * 2;
            const distance = size * (0.7 + Math.random() * 0.3);
            vertices.push({
                x: Math.cos(angle) * distance,
                y: Math.sin(angle) * distance
            });
        }
        
        return vertices;
    }

    getAsteroidColor(type) {
        const colors = {
            normal: ['#8B7355', '#A0522D', '#CD853F', '#8B4513', '#D2691E'],
            moving: ['#696969', '#808080', '#A9A9A9', '#708090', '#778899'],
            spinning: ['#556B2F', '#6B8E23', '#9ACD32', '#7CFC00', '#ADFF2F']
        };
        
        const colorSet = colors[type] || colors.normal;
        return colorSet[Math.floor(Math.random() * colorSet.length)];
    }

    getAsteroidGlowColor(type) {
        const glows = {
            normal: 'rgba(139, 115, 85, 0.3)',
            moving: 'rgba(105, 105, 105, 0.3)',
            spinning: 'rgba(85, 107, 47, 0.4)'
        };
        return glows[type] || glows.normal;
    }

    checkCollisions() {
        // Colisões entre balas e asteroides
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            for (let j = this.asteroids.length - 1; j >= 0; j--) {
                const bullet = this.bullets[i];
                const asteroid = this.asteroids[j];

                const dx = bullet.x - asteroid.x;
                const dy = bullet.y - asteroid.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < asteroid.size + bullet.width / 2) {
                    // Colisão detectada
                    asteroid.health--;
                    
                    if (asteroid.health <= 0) {
                        this.createAsteroidExplosion(asteroid);
                        
                        // Pontuação base
                        let points = 15 * this.level;
                        
                        // Bônus para asteroides especiais
                        if (asteroid.type === 'spinning') {
                            points += 25;
                        }
                        
                        // Bônus para asteroides de evento
                        if (asteroid.isEvent) {
                            points *= 2;
                            this.eventProgress++;
                            this.updateEventProgress();
                        }
                        
                        this.score += points;
                        this.asteroids.splice(j, 1);
                        
                        // Atualizar missão de destruir asteroides
                        this.updateMissionProgress('destroy', 1);
                    } else {
                        // Dano sem destruir
                        this.createParticles(asteroid.x, asteroid.y, asteroid.color, 5);
                    }
                    
                    this.bullets.splice(i, 1);
                    break;
                }
            }
        }

        // Colisões entre jogador e asteroides
        for (let i = this.asteroids.length - 1; i >= 0; i--) {
            const asteroid = this.asteroids[i];

            const dx = this.player.x - asteroid.x;
            const dy = this.player.y - asteroid.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < asteroid.size + this.player.width / 2) {
                // Verificar se o escudo está ativo
                if (this.player.shield) {
                    this.createAsteroidExplosion(asteroid);
                    this.asteroids.splice(i, 1);
                    this.showNotification('Escudo defendeu o ataque!');
                } else {
                    this.createAsteroidExplosion(asteroid);
                    this.createExplosion(this.player.x, this.player.y, '#ff6b6b');
                    this.asteroids.splice(i, 1);
                    this.lives--;

                    if (this.lives <= 0) {
                        this.gameOver();
                    }
                }
                break;
            }
        }

        // Colisões entre jogador e power-ups
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const powerUp = this.powerUps[i];

            const dx = this.player.x - powerUp.x;
            const dy = this.player.y - powerUp.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < powerUp.size + this.player.width / 2) {
                if (powerUp.type === 'life' && this.lives < 5) {
                    this.lives++;
                    this.showNotification('+1 Vida!');
                } else if (powerUp.type === 'score') {
                    this.score += 100 * this.level;
                    this.showNotification('+100 Pontos!');
                } else if (powerUp.type === 'event') {
                    this.score += 200 * this.level;
                    this.celestialCoins += 50;
                    this.showNotification('+50 Moedas Celestiais!');
                    this.saveEconomy();
                }
                
                // Atualizar missão de coletar power-ups
                if (powerUp.type !== 'event') {
                    this.updateMissionProgress('collect', 1);
                }
                
                this.powerUps.splice(i, 1);
                this.createParticles(powerUp.x, powerUp.y, powerUp.color, 10);
                break;
            }
        }

        // Atualizar nível baseado na pontuação
        const newLevel = Math.floor(this.score / 1000) + 1;
        if (newLevel > this.level) {
            this.level = newLevel;
            this.createParticles(this.canvas.width / 2, 100, '#ffd43b', 20);
            this.showNotification(`Nível ${this.level} alcançado!`);
            
            // Atualizar missão de alcançar nível
            this.updateMissionProgress('level', this.level);
        }
    }

    createAsteroidExplosion(asteroid) {
        const particleCount = Math.floor(asteroid.size * 0.8);
        for (let i = 0; i < particleCount; i++) {
            this.particles.push({
                x: asteroid.x,
                y: asteroid.y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                size: Math.random() * 3 + 1,
                color: asteroid.color,
                life: 40,
                type: 'rock'
            });
        }
        
        // Adicionar algumas partículas brilhantes
        for (let i = 0; i < 5; i++) {
            this.particles.push({
                x: asteroid.x,
                y: asteroid.y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                size: Math.random() * 2 + 1,
                color: '#ffd43b',
                life: 25,
                type: 'spark'
            });
        }
    }

    createExplosion(x, y, color) {
        for (let i = 0; i < 15; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                size: Math.random() * 4 + 2,
                color: color,
                life: 30,
                type: 'explosion'
            });
        }
    }

    createParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                size: Math.random() * 3 + 1,
                color: color,
                life: 20,
                type: 'generic'
            });
        }
    }

    gameOver() {
        this.gameState = 'gameOver';
        
        // Atualizar recorde
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('galacticHighScore', this.highScore.toString());
            this.unlockSkins();
        }
        
        // Conceder moedas baseadas na pontuação
        const coinsEarned = Math.floor(this.score / 10);
        this.celestialCoins += coinsEarned;
        this.saveEconomy();
        
        this.showGameOverModal();
        this.updateUI();
    }

    render() {
        // Limpar canvas
        this.ctx.fillStyle = '#090b15';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Desenhar estrelas
        this.renderStars();

        // Desenhar elementos do jogo
        this.renderPowerUps();
        this.renderAsteroids();
        this.renderBullets();
        this.renderParticles();
        this.renderAllies();
        this.renderPlayer();
        this.renderShield();

        // Desenhar UI do jogo
        this.renderGameUI();
    }

    renderStars() {
        this.ctx.fillStyle = 'white';
        for (const star of this.stars) {
            star.y += star.speed;
            if (star.y > this.canvas.height) {
                star.y = 0;
                star.x = Math.random() * this.canvas.width;
            }
            
            this.ctx.globalAlpha = star.brightness / 255;
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.globalAlpha = 1;
    }

    renderPlayer() {
        const skin = this.skins[this.skin];
        
        // Propulsor com efeito de chama
        this.ctx.fillStyle = '#ffa94d';
        this.ctx.beginPath();
        this.ctx.moveTo(this.player.x - 15, this.player.y + 35);
        this.ctx.lineTo(this.player.x + 15, this.player.y + 35);
        this.ctx.lineTo(this.player.x, this.player.y + 50 + Math.sin(Date.now() * 0.01) * 5);
        this.ctx.closePath();
        this.ctx.fill();

        // Corpo da nave
        this.ctx.fillStyle = skin.color;
        this.ctx.beginPath();
        this.ctx.moveTo(this.player.x, this.player.y - 25);
        this.ctx.lineTo(this.player.x - 25, this.player.y + 25);
        this.ctx.lineTo(this.player.x + 25, this.player.y + 25);
        this.ctx.closePath();
        this.ctx.fill();

        // Detalhes da nave
        this.ctx.fillStyle = this.lightenColor(skin.color, 30);
        this.ctx.beginPath();
        this.ctx.moveTo(this.player.x, this.player.y - 10);
        this.ctx.lineTo(this.player.x - 15, this.player.y + 15);
        this.ctx.lineTo(this.player.x + 15, this.player.y + 15);
        this.ctx.closePath();
        this.ctx.fill();

        // Cabine
        this.ctx.fillStyle = 'rgba(200, 230, 255, 0.8)';
        this.ctx.beginPath();
        this.ctx.arc(this.player.x, this.player.y, 10, 0, Math.PI * 2);
        this.ctx.fill();
    }

    renderShield() {
        if (this.player.shield) {
            this.ctx.strokeStyle = 'rgba(100, 200, 255, 0.7)';
            this.ctx.fillStyle = 'rgba(100, 200, 255, 0.2)';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(this.player.x, this.player.y, 40, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();
            
            // Efeito pulsante
            const pulse = Math.sin(Date.now() * 0.01) * 5;
            this.ctx.beginPath();
            this.ctx.arc(this.player.x, this.player.y, 40 + pulse, 0, Math.PI * 2);
            this.ctx.stroke();
        }
    }

    renderBullets() {
        for (const bullet of this.bullets) {
            // Laser principal
            this.ctx.fillStyle = bullet.color;
            this.ctx.fillRect(bullet.x - bullet.width / 2, bullet.y, bullet.width, bullet.height);
            
            // Efeito de brilho
            this.ctx.fillStyle = 'white';
            this.ctx.fillRect(bullet.x - 1, bullet.y + 2, 2, bullet.height - 6);
            
            // Rastro
            this.ctx.fillStyle = this.lightenColor(bullet.color, 50);
            this.ctx.fillRect(bullet.x - 1, bullet.y + bullet.height, 2, 8);
        }
    }

    renderAsteroids() {
        for (const asteroid of this.asteroids) {
            this.ctx.save();
            this.ctx.translate(asteroid.x, asteroid.y);
            this.ctx.rotate(asteroid.rotation);
            
            // Efeito de brilho para asteroides especiais
            if (asteroid.type === 'spinning' || asteroid.isEvent) {
                this.ctx.fillStyle = asteroid.glowColor;
                this.ctx.beginPath();
                this.ctx.moveTo(asteroid.vertices[0].x * 1.1, asteroid.vertices[0].y * 1.1);
                for (let i = 1; i < asteroid.vertices.length; i++) {
                    this.ctx.lineTo(asteroid.vertices[i].x * 1.1, asteroid.vertices[i].y * 1.1);
                }
                this.ctx.closePath();
                this.ctx.fill();
            }

            // Desenhar asteroide com forma irregular
            this.ctx.fillStyle = asteroid.color;
            this.ctx.beginPath();
            this.ctx.moveTo(asteroid.vertices[0].x, asteroid.vertices[0].y);
            
            for (let i = 1; i < asteroid.vertices.length; i++) {
                this.ctx.lineTo(asteroid.vertices[i].x, asteroid.vertices[i].y);
            }
            
            this.ctx.closePath();
            this.ctx.fill();
            
            // Detalhes da superfície do asteroide - padrão geométrico
            this.ctx.fillStyle = this.darkenColor(asteroid.color, 15);
            const detailCount = Math.floor(asteroid.size / 8);
            
            for (let i = 0; i < detailCount; i++) {
                const angle = (i / detailCount) * Math.PI * 2;
                const distance = asteroid.size * (0.3 + Math.random() * 0.3);
                const detailSize = asteroid.size * 0.08;
                
                // Criar padrões geométricos em vez de círculos simples
                this.ctx.save();
                this.ctx.translate(
                    Math.cos(angle) * distance,
                    Math.sin(angle) * distance
                );
                this.ctx.rotate(angle);
                
                // Detalhes em forma de losango ou triângulo
                if (Math.random() > 0.5) {
                    // Losango
                    this.ctx.beginPath();
                    this.ctx.moveTo(0, -detailSize);
                    this.ctx.lineTo(detailSize, 0);
                    this.ctx.lineTo(0, detailSize);
                    this.ctx.lineTo(-detailSize, 0);
                    this.ctx.closePath();
                } else {
                    // Triângulo
                    this.ctx.beginPath();
                    this.ctx.moveTo(0, -detailSize);
                    this.ctx.lineTo(detailSize, detailSize);
                    this.ctx.lineTo(-detailSize, detailSize);
                    this.ctx.closePath();
                }
                this.ctx.fill();
                this.ctx.restore();
            }
            
            // Padrão de linhas para asteroides em movimento
            if (asteroid.type === 'moving') {
                this.ctx.strokeStyle = this.lightenColor(asteroid.color, 20);
                this.ctx.lineWidth = 1;
                this.ctx.beginPath();
                for (let i = 0; i < 3; i++) {
                    const angle = (i / 3) * Math.PI * 2;
                    this.ctx.moveTo(0, 0);
                    this.ctx.lineTo(
                        Math.cos(angle) * asteroid.size * 0.8,
                        Math.sin(angle) * asteroid.size * 0.8
                    );
                }
                this.ctx.stroke();
            }
            
            this.ctx.restore();
            
            // Barra de saúde para asteroides com mais de 1 de vida
            if (asteroid.health > 1) {
                const barWidth = asteroid.size * 1.5;
                const barHeight = 4;
                const barX = asteroid.x - barWidth / 2;
                const barY = asteroid.y - asteroid.size - 10;
                
                // Fundo da barra
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                this.ctx.fillRect(barX, barY, barWidth, barHeight);
                
                // Saúde atual
                this.ctx.fillStyle = asteroid.health > 1 ? '#51cf66' : '#ff6b6b';
                this.ctx.fillRect(
                    barX, 
                    barY, 
                    (barWidth * asteroid.health) / Math.ceil(asteroid.size / 20), 
                    barHeight
                );
                
                // Borda da barra
                this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(barX, barY, barWidth, barHeight);
            }
        }
    }

    renderParticles() {
        for (const particle of this.particles) {
            this.ctx.globalAlpha = particle.life / (particle.type === 'spark' ? 25 : 30);
            
            if (particle.type === 'rock') {
                // Partículas de rocha (angulares)
                this.ctx.fillStyle = particle.color;
                this.ctx.beginPath();
                this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                this.ctx.fill();
            } else if (particle.type === 'spark') {
                // Partículas brilhantes
                this.ctx.fillStyle = particle.color;
                this.ctx.beginPath();
                this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Efeito de brilho
                this.ctx.fillStyle = 'white';
                this.ctx.beginPath();
                this.ctx.arc(particle.x, particle.y, particle.size * 0.5, 0, Math.PI * 2);
                this.ctx.fill();
            } else {
                // Partículas normais
                this.ctx.fillStyle = particle.color;
                this.ctx.beginPath();
                this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
        this.ctx.globalAlpha = 1;
    }

    renderPowerUps() {
        for (const powerUp of this.powerUps) {
            // Efeito pulsante
            const pulse = Math.sin(Date.now() * 0.01) * 2;
            
            this.ctx.fillStyle = powerUp.color;
            this.ctx.beginPath();
            this.ctx.arc(powerUp.x, powerUp.y, powerUp.size + pulse, 0, Math.PI * 2);
            this.ctx.fill();

            // Símbolo do power-up
            this.ctx.fillStyle = 'white';
            this.ctx.font = '14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            let symbol = '★';
            if (powerUp.type === 'life') symbol = '♥';
            if (powerUp.type === 'event') symbol = '⚡';
            
            this.ctx.fillText(symbol, powerUp.x, powerUp.y);
            
            // Anel brilhante
            this.ctx.strokeStyle = 'white';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.arc(powerUp.x, powerUp.y, powerUp.size + pulse + 3, 0, Math.PI * 2);
            this.ctx.stroke();
        }
    }

    renderAllies() {
        for (const ally of this.allies) {
            // Desenhar aliado
            this.ctx.fillStyle = ally.color;
            this.ctx.beginPath();
            this.ctx.moveTo(ally.x, ally.y - 15);
            this.ctx.lineTo(ally.x - 10, ally.y + 10);
            this.ctx.lineTo(ally.x + 10, ally.y + 10);
            this.ctx.closePath();
            this.ctx.fill();
            
            // Detalhes
            this.ctx.fillStyle = this.lightenColor(ally.color, 30);
            this.ctx.beginPath();
            this.ctx.moveTo(ally.x, ally.y - 5);
            this.ctx.lineTo(ally.x - 6, ally.y + 5);
            this.ctx.lineTo(ally.x + 6, ally.y + 5);
            this.ctx.closePath();
            this.ctx.fill();
        }
    }

    renderGameUI() {
        // Desenhar informações do jogo no canvas
        this.ctx.fillStyle = 'white';
        this.ctx.font = '16px Urbanist';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Pontuação: ${this.score}`, 20, 30);
        this.ctx.fillText(`Vidas: ${this.lives}`, 20, 60);
        this.ctx.fillText(`Nível: ${this.level}`, 20, 90);

        // Desenhar habilidades ativas
        let yOffset = 120;
        Object.keys(this.skills).forEach(skillId => {
            const skill = this.skills[skillId];
            if (skill.unlocked && skill.active) {
                this.ctx.fillStyle = 'rgba(100, 200, 255, 0.8)';
                this.ctx.fillText(`${skill.name}: ${skill.duration}s`, 20, yOffset);
                yOffset += 25;
            }
        });

        if (this.gameState === 'paused') {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = 'white';
            this.ctx.font = '36px Urbanist';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('JOGO PAUSADO', this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.font = '18px Urbanist';
            this.ctx.fillText('Pressione P para continuar', this.canvas.width / 2, this.canvas.height / 2 + 40);
        }
    }

    gameLoop() {
        this.update();
        this.render();
        this.updateUI();
        requestAnimationFrame(() => this.gameLoop());
    }

    updateUI() {
        // Atualizar elementos da UI
        document.getElementById('score').textContent = this.score;
        document.getElementById('lives').textContent = this.lives;
        document.getElementById('level').textContent = this.level;
        document.getElementById('highScore').textContent = this.highScore;

        // Atualizar botões
        const pauseBtn = document.getElementById('pauseBtn');
        if (this.gameState === 'playing') {
            pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pausar';
        } else if (this.gameState === 'paused') {
            pauseBtn.innerHTML = '<i class="fas fa-play"></i> Continuar';
        }

        // Atualizar botão de aliados
        const allyBtn = document.getElementById('allyBtn');
        if (this.alliesActive) {
            allyBtn.innerHTML = '<i class="fas fa-robot"></i> Aliados: ON';
            allyBtn.style.background = 'var(--success)';
        } else {
            allyBtn.innerHTML = '<i class="fas fa-robot"></i> Aliados: OFF';
            allyBtn.style.background = '';
        }
    }

    // Sistema de Skins
    loadSkins() {
        const savedSkins = localStorage.getItem('galacticSkins');
        if (savedSkins) {
            const skinsData = JSON.parse(savedSkins);
            this.skins.forEach(skin => {
                if (skinsData[skin.id]) {
                    skin.unlocked = true;
                }
            });
        }
        
        this.unlockSkins();
        this.renderSkins();
    }

    unlockSkins() {
        this.skins.forEach(skin => {
            if (!skin.unlocked && this.highScore >= skin.requirement) {
                skin.unlocked = true;
            }
        });
        this.saveSkins();
        this.renderSkins();
    }

    saveSkins() {
        const skinsData = {};
        this.skins.forEach(skin => {
            if (skin.unlocked) {
                skinsData[skin.id] = true;
            }
        });
        localStorage.setItem('galacticSkins', JSON.stringify(skinsData));
    }

    renderSkins() {
        const skinsGrid = document.getElementById('skinsGrid');
        skinsGrid.innerHTML = '';

        this.skins.forEach(skin => {
            const skinCard = document.createElement('div');
            skinCard.className = `skin-card ${skin.unlocked ? '' : 'locked'} ${skin.id === this.skin ? 'selected' : ''}`;
            skinCard.innerHTML = `
                <div class="skin-preview-canvas">
                    <canvas width="100" height="80" data-skin="${skin.id}"></canvas>
                </div>
                <div class="skin-name">${skin.name}</div>
                <div class="skin-requirement">Recorde: ${skin.requirement}</div>
                <div class="skin-status ${skin.unlocked ? 'unlocked' : 'locked'}">
                    ${skin.unlocked ? 'DESBLOQUEADA' : 'BLOQUEADA'}
                </div>
            `;

            if (skin.unlocked) {
                skinCard.addEventListener('click', () => {
                    this.selectSkin(skin.id);
                });
            }

            skinsGrid.appendChild(skinCard);
            this.renderSkinPreview(skin.id, skin.color);
        });

        this.updateSelectedSkinInfo();
    }

    renderSkinPreview(skinId, color) {
        const canvas = document.querySelector(`[data-skin="${skinId}"]`);
        const ctx = canvas.getContext('2d');

        // Limpar canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Desenhar nave
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(50, 20);
        ctx.lineTo(30, 60);
        ctx.lineTo(70, 60);
        ctx.closePath();
        ctx.fill();

        // Detalhes
        ctx.fillStyle = this.lightenColor(color, 30);
        ctx.beginPath();
        ctx.moveTo(50, 35);
        ctx.lineTo(40, 55);
        ctx.lineTo(60, 55);
        ctx.closePath();
        ctx.fill();

        // Cabine
        ctx.fillStyle = 'rgba(200, 230, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(50, 40, 8, 0, Math.PI * 2);
        ctx.fill();
    }

    selectSkin(skinId) {
        this.skin = skinId;
        this.player.color = this.skins[skinId].color;
        this.renderSkins();
        this.updateSelectedSkinInfo();
    }

    equipSelectedSkin() {
        this.showNotification('Skin equipada com sucesso!');
    }

    updateSelectedSkinInfo() {
        const selectedSkin = this.skins[this.skin];
        document.getElementById('selectedSkinName').textContent = selectedSkin.name;
        document.getElementById('skinStatus').textContent = selectedSkin.unlocked ? 'DESBLOQUEADA' : 'BLOQUEADA';
        document.getElementById('skinStatus').className = `skin-status ${selectedSkin.unlocked ? 'unlocked' : 'locked'}`;
        document.getElementById('skinRequirement').textContent = `Recorde: ${selectedSkin.requirement} pontos`;
        document.getElementById('skinProgress').textContent = selectedSkin.unlocked ? 'Desbloqueada' : 'Bloqueada';
        
        this.renderMainSkinPreview();
    }

    renderMainSkinPreview() {
        const canvas = document.getElementById('skinPreview');
        const ctx = canvas.getContext('2d');
        const skin = this.skins[this.skin];

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Fundo
        ctx.fillStyle = '#0f111f';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Desenhar nave
        ctx.fillStyle = skin.color;
        ctx.beginPath();
        ctx.moveTo(100, 30);
        ctx.lineTo(60, 120);
        ctx.lineTo(140, 120);
        ctx.closePath();
        ctx.fill();

        // Detalhes
        ctx.fillStyle = this.lightenColor(skin.color, 30);
        ctx.beginPath();
        ctx.moveTo(100, 60);
        ctx.lineTo(80, 100);
        ctx.lineTo(120, 100);
        ctx.closePath();
        ctx.fill();

        // Cabine
        ctx.fillStyle = 'rgba(200, 230, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(100, 70, 15, 0, Math.PI * 2);
        ctx.fill();

        // Propulsor
        ctx.fillStyle = '#ffa94d';
        ctx.beginPath();
        ctx.moveTo(85, 120);
        ctx.lineTo(115, 120);
        ctx.lineTo(100, 140);
        ctx.closePath();
        ctx.fill();
    }

    // Sistema de Missões
    updateMissions() {
        const missionsList = document.getElementById('missionsList');
        missionsList.innerHTML = '';

        this.missions.forEach(mission => {
            const missionCard = document.createElement('div');
            missionCard.className = `mission-card ${mission.completed ? 'completed' : ''}`;
            missionCard.innerHTML = `
                <div class="mission-header">
                    <h3 class="mission-title">${mission.title}</h3>
                    <div class="mission-reward">
                        <i class="fas fa-coins"></i>
                        ${mission.reward}
                    </div>
                </div>
                <p class="mission-description">${mission.description}</p>
                <div class="mission-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${(mission.progress / mission.target) * 100}%"></div>
                    </div>
                    <span class="progress-text">${mission.progress}/${mission.target}</span>
                </div>
            `;
            missionsList.appendChild(missionCard);
        });

        // Atualizar estatísticas
        document.getElementById('completedMissions').textContent = this.missions.filter(m => m.completed).length;
        document.getElementById('celestialCoins').textContent = this.celestialCoins;
        document.getElementById('achievementPoints').textContent = this.achievementPoints;
    }

    updateMissionProgress(type, value) {
        this.missions.forEach(mission => {
            if (mission.completed) return;

            if (type === 'destroy' && mission.description.includes('Destrua')) {
                mission.progress += value;
            } else if (type === 'collect' && mission.description.includes('Colete')) {
                mission.progress += value;
            } else if (type === 'level' && mission.description.includes('Alcance')) {
                mission.progress = Math.max(mission.progress, value);
            }

            if (mission.progress >= mission.target) {
                mission.completed = true;
                this.celestialCoins += mission.reward;
                this.achievementPoints += 10;
                this.showNotification(`Missão concluída: ${mission.title}! +${mission.reward} moedas`);
                this.saveEconomy();
            }
        });

        this.updateMissions();
    }

    // Sistema de Habilidades
    unlockSkill(skillId) {
        const skill = this.skills[skillId];
        if (!skill || skill.unlocked) return;

        const cost = this.getSkillCost(skillId);
        if (this.celestialCoins >= cost) {
            this.celestialCoins -= cost;
            skill.unlocked = true;
            this.showNotification(`Habilidade ${skill.name} desbloqueada!`);
            this.saveEconomy();
            this.updateSkillsUI();
        } else {
            this.showNotification('Moedas celestiais insuficientes!');
        }
    }

    getSkillCost(skillId) {
        const costs = {
            'escudo-luz': 500,
            'aura-sagrada': 1000,
            'velocidade-luz': 800,
            'teletransporte': 1500,
            'raio-cosmico': 1200,
            'explosao-solar': 2000
        };
        return costs[skillId] || 0;
    }

    activateSkill(skillIndex) {
        const skillIds = Object.keys(this.skills);
        if (skillIndex >= skillIds.length) return;

        const skillId = skillIds[skillIndex];
        const skill = this.skills[skillId];

        if (!skill.unlocked) return;

        if (skill.cooldown && skill.cooldown > 0) {
            this.showNotification(`${skill.name} em cooldown!`);
            return;
        }

        switch (skillId) {
            case 'escudo-luz':
                this.player.shield = true;
                this.player.shieldTime = 300; // 5 segundos
                skill.active = true;
                skill.duration = 300;
                break;
            case 'aura-sagrada':
                this.activateAura();
                skill.active = true;
                skill.duration = 180; // 3 segundos
                break;
            case 'velocidade-luz':
                skill.active = true;
                skill.duration = 240; // 4 segundos
                break;
            case 'teletransporte':
                this.teleportPlayer();
                skill.cooldown = 600; // 10 segundos
                break;
            case 'raio-cosmico':
                this.fireCosmicRay();
                skill.cooldown = 300; // 5 segundos
                break;
            case 'explosao-solar':
                this.solarExplosion();
                skill.cooldown = 900; // 15 segundos
                break;
        }

        this.showNotification(`${skill.name} ativada!`);
    }

    activateAura() {
        // Destruir asteroides próximos
        for (let i = this.asteroids.length - 1; i >= 0; i--) {
            const asteroid = this.asteroids[i];
            const dx = this.player.x - asteroid.x;
            const dy = this.player.y - asteroid.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 150) {
                this.createAsteroidExplosion(asteroid);
                this.score += 10 * this.level;
                this.asteroids.splice(i, 1);
            }
        }
    }

    teleportPlayer() {
        this.player.x = Math.random() * (this.canvas.width - 100) + 50;
        this.player.y = Math.random() * (this.canvas.height - 150) + 50;
        this.createParticles(this.player.x, this.player.y, '#8b5cf6', 20);
    }

    fireCosmicRay() {
        // Criar um raio que atravessa a tela
        for (let i = 0; i < 5; i++) {
            this.bullets.push({
                x: this.player.x + (i - 2) * 10,
                y: this.player.y - 20,
                width: 6,
                height: 20,
                speed: 15,
                color: '#8b5cf6',
                piercing: true
            });
        }
    }

    solarExplosion() {
        // Destruir todos os asteroides
        for (let i = this.asteroids.length - 1; i >= 0; i--) {
            const asteroid = this.asteroids[i];
            this.createAsteroidExplosion(asteroid);
            this.score += 20 * this.level;
            this.asteroids.splice(i, 1);
        }

        // Efeito visual
        this.createParticles(this.canvas.width / 2, this.canvas.height / 2, '#ffd43b', 50);
    }

    updateSkillsUI() {
        const activeSkills = document.getElementById('activeSkills');
        activeSkills.innerHTML = '';

        Object.keys(this.skills).forEach(skillId => {
            const skill = this.skills[skillId];
            if (skill.unlocked) {
                const skillElement = document.createElement('div');
                skillElement.className = 'active-skill';
                skillElement.innerHTML = `
                    <div class="active-skill-icon">
                        <i class="fas fa-star"></i>
                    </div>
                    <div class="active-skill-info">
                        <div class="active-skill-name">${skill.name}</div>
                        <div class="active-skill-desc">${skill.active ? 'Ativa' : 'Pronta'}</div>
                    </div>
                `;
                activeSkills.appendChild(skillElement);
            }
        });
    }

    // Sistema de Aliados
    toggleAllies() {
        if (this.allyCooldown > 0) {
            this.showNotification(`Aliados em cooldown: ${Math.ceil(this.allyCooldown / 60)}s`);
            return;
        }

        this.alliesActive = !this.alliesActive;
        
        if (this.alliesActive) {
            this.showNotification('Aliados ativados!');
            this.allyCooldown = 1800; // 30 segundos
        } else {
            this.showNotification('Aliados desativados');
            this.allies = [];
        }
    }

    // Sistema de Ranking
    updateRanking() {
        const userScore = this.highScore;
        const totalPlayers = 1247;
        const userRank = Math.max(1, Math.floor(totalPlayers * (1 - userScore / 50000)));
        
        document.getElementById('userRank').textContent = `#${userRank}`;
        document.getElementById('userScore').textContent = userScore;
        document.getElementById('totalPlayers').textContent = totalPlayers.toLocaleString();
        
        this.renderRankingTable();
    }

    renderRankingTable() {
        const tableBody = document.getElementById('rankingTable');
        tableBody.innerHTML = '';

        const rankings = [];
        for (let i = 1; i <= 10; i++) {
            rankings.push({
                position: i,
                name: `Jogador${i}`,
                score: Math.floor(50000 * (1 - i / 15) + Math.random() * 1000),
                level: Math.floor(Math.random() * 50) + 1
            });
        }

        if (this.highScore > 0 && !rankings.some(r => r.score <= this.highScore)) {
            rankings.push({
                position: 47,
                name: 'Você',
                score: this.highScore,
                level: Math.floor(this.highScore / 1000) + 1,
                isCurrentUser: true
            });
        }

        rankings.forEach(player => {
            const row = document.createElement('div');
            row.className = `ranking-item ${player.isCurrentUser ? 'current-user' : ''}`;
            row.innerHTML = `
                <div class="ranking-position ${player.position <= 3 ? `position-${player.position}` : ''}">
                    ${player.position <= 3 ? '<i class="fas fa-trophy"></i>' : ''}
                    ${player.position}
                </div>
                <div class="ranking-player">
                    <div class="player-avatar">
                        ${player.name.charAt(0).toUpperCase()}
                    </div>
                    <div class="player-name">${player.name}</div>
                </div>
                <div class="ranking-score">${player.score.toLocaleString()}</div>
                <div class="ranking-level">Nv. ${player.level}</div>
            `;
            tableBody.appendChild(row);
        });
    }

    // Sistema de Eventos Cósmicos
    updateEventProgress() {
        const progressBar = document.getElementById('eventProgress');
        const progressText = document.querySelector('.progress-text');
        
        if (progressBar && progressText) {
            const progressPercent = (this.eventProgress / this.eventTarget) * 100;
            progressBar.style.width = `${progressPercent}%`;
            progressText.textContent = `${this.eventProgress}/${this.eventTarget} Meteoros`;
        }

        // Atualizar timer do evento
        this.updateEventTimer();
    }

    updateEventTimer() {
        const now = Date.now();
        const timeLeft = this.eventEndTime - now;
        
        if (timeLeft <= 0) {
            // Evento terminou, iniciar novo
            this.startNewEvent();
            return;
        }
        
        const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
        
        const timerElement = document.getElementById('eventTimer');
        if (timerElement) {
            timerElement.textContent = `${days}d ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }

    startNewEvent() {
        this.currentEvent = {
            name: 'Chuva de Meteoros',
            type: 'meteor',
            endTime: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 dias
        };
        
        this.eventProgress = 0;
        this.eventTarget = 20;
        this.eventEndTime = this.currentEvent.endTime;
        
        this.showNotification('Novo Evento Cósmico: Chuva de Meteoros!');
        this.updateEventProgress();
    }

    // Sistema de Economia
    saveEconomy() {
        localStorage.setItem('celestialCoins', this.celestialCoins.toString());
        localStorage.setItem('achievementPoints', this.achievementPoints.toString());
    }

    // Painel de Doação
    showDonationPanel() {
        const donationPanel = document.getElementById('donationPanel');
        const hasSeenDonation = localStorage.getItem('hasSeenDonation');
        
        if (!hasSeenDonation) {
            donationPanel.style.display = 'flex';
            localStorage.setItem('hasSeenDonation', 'true');
        }
    }

    hideDonationPanel() {
        const donationPanel = document.getElementById('donationPanel');
        donationPanel.style.display = 'none';
    }

    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            this.showNotification('Código copiado para a área de transferência!');
        }).catch(err => {
            console.error('Erro ao copiar: ', err);
        });
    }

    // Assistente Galáctico
    startAssistant() {
        // Mensagens aleatórias do assistente
        const messages = [
            "Bem-vindo, Defensor! Pronto para proteger a galáxia?",
            "Não se esqueça de completar as missões diárias!",
            "Suas habilidades espirituais podem ser a chave para a vitória!",
            "Colete moedas celestiais para desbloquear poderes especiais!",
            "Os aliados automáticos podem te ajudar em batalhas difíceis!",
            "Eventos cósmicos oferecem recompensas especiais!"
        ];

        let messageIndex = 0;
        
        // Rotação de mensagens a cada 30 segundos
        setInterval(() => {
            const messageElement = document.getElementById('assistantMessage');
            if (messageElement) {
                messageElement.textContent = messages[messageIndex];
                messageIndex = (messageIndex + 1) % messages.length;
            }
        }, 30000);

        // Interação com o assistente
        const assistantIcon = document.querySelector('.assistant-icon');
        assistantIcon.addEventListener('click', () => {
            const randomMessage = messages[Math.floor(Math.random() * messages.length)];
            this.showNotification(`Assistente: ${randomMessage}`);
        });
    }

    // Música de Fundo
    playBackgroundMusic() {
        // Esta é uma implementação básica - em um projeto real, você usaria arquivos de áudio
        console.log('Música de fundo iniciada - Implementação de áudio real necessária');
        
        // Para uma implementação real, você usaria:
        // const audio = new Audio('path/to/background-music.mp3');
        // audio.loop = true;
        // audio.volume = 0.5;
        // audio.play();
    }

    // Utilitários
    lightenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return '#' + (
            0x1000000 +
            (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)
        ).toString(16).slice(1);
    }

    darkenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        return '#' + (
            0x1000000 +
            (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)
        ).toString(16).slice(1);
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: var(--primary);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10000;
            font-weight: 500;
            box-shadow: var(--shadow-lg);
            animation: slideInRight 0.3s ease;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    // Navegação entre páginas
    showPage(pageId) {
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });

        document.getElementById(pageId).classList.add('active');

        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-page="${pageId}"]`).classList.add('active');

        if (pageId === 'skins') {
            this.renderSkins();
        } else if (pageId === 'ranking') {
            this.updateRanking();
        } else if (pageId === 'missions') {
            this.updateMissions();
            this.updateEventProgress();
        } else if (pageId === 'skills') {
            this.updateSkillsUI();
        } else if (pageId === 'game') {
            this.canvas.focus();
        }
    }

    // Modal de Game Over
    showGameOverModal() {
        document.getElementById('finalScore').textContent = this.score;
        
        let message = 'Boa tentativa! Continue praticando!';
        if (this.score > this.highScore) {
            message = '🎉 Novo recorde! Incrível!';
        } else if (this.score > 1000) {
            message = 'Ótima pontuação! Você está melhorando!';
        }
        
        document.getElementById('resultMessage').textContent = message;
        document.getElementById('gameOverModal').classList.add('active');
    }

    hideGameOverModal() {
        document.getElementById('gameOverModal').classList.remove('active');
    }

    hideLoadingScreen() {
        document.getElementById('loadingScreen').style.display = 'none';
    }
}

// Inicializar o jogo quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    window.game = new GalacticDefender();
});

// Adicionar estilos de animação para notificações
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .current-user {
        background: rgba(88, 101, 242, 0.1) !important;
        border-left: 3px solid var(--primary);
    }
    
    .mission-card.completed {
        border-color: var(--success);
        background: rgba(16, 185, 129, 0.1);
    }
    
    .skill-card.unlocked {
        border-color: var(--success);
    }
`;
document.head.appendChild(style);
