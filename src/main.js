import * as THREE from 'three';
import { Player } from './Player';
import { Enemy } from './Enemy';
import { PowerUp } from './PowerUp';
import { GameUI } from './UI';
import { AudioManager } from './AudioManager';

class Game {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: false, // Desativa antialiasing para melhor performance
            powerPreference: "high-performance" // Prioriza performance
        });
        
        // Inicializa o sistema de áudio
        this.audioManager = AudioManager.getInstance();
        this.camera.add(this.audioManager.getListener());
        
        // Expõe o jogo globalmente para acesso do painel de configurações
        window.game = this;
        
        // Adiciona referência do jogo e da câmera à cena
        this.scene.userData.game = this;
        this.scene.camera = this.camera;
        
        // Configuração inicial
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(1); // Força pixel ratio para 1 para melhor performance
        this.renderer.shadowMap.enabled = false; // Desativa sombras para melhor performance
        this.scene.background = new THREE.Color(0x87CEEB); // Céu azul
        
        document.body.appendChild(this.renderer.domElement);
        
        // Inicializa as variáveis do jogo
        this.isPaused = false;
        this.isGameOver = false;
        this.enemies = [];
        this.powerUps = [];
        this.waveSize = 30; // Tamanho inicial da onda
        
        // Configuração dos intervalos (em milissegundos)
        this.waveIntervalTime = 5000; // 5 segundos entre ondas
        this.difficultyIntervalTime = 120000; // 2 minutos para aumentar a dificuldade
        
        // Intervalos de spawn para diferentes tipos de powerups
        this.powerupSpawnRates = {
            gatling: 30000,   // 30 segundos (aumentado de 25)
            ak47: 35000,      // 35 segundos (aumentado de 30)
            bazooka: 40000,   // 40 segundos (aumentado de 35)
            grenade: 45000,   // 45 segundos (aumentado de 40)
            squad: 360000     // 6 minutos (maior que o tempo de despawn de 5 minutos)
        };
        
        // Contadores de tempo desde o último spawn para cada tipo
        this.lastPowerupSpawnTime = {
            gatling: 0,
            ak47: 0,
            bazooka: 0,
            grenade: 0,
            squad: 0
        };
        
        this.bossIntervalTime = 180000; // 3 minutos para o primeiro boss
        
        // IDs dos intervalos (serão definidos em startWaveSystem)
        this.waveInterval = null;
        this.difficultyInterval = null;
        this.powerupSpawnInterval = null;
        this.bossInterval = null;
        
        this.score = 0;
        this.startTime = Date.now();
        this.gameTime = 0;
        
        // Posicionamento da câmera isométrica
        this.camera.position.set(0, 10, 10);
        this.camera.lookAt(0, 0, 0);
        
        // Adiciona luz
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8); // Aumenta a luz ambiente para compensar a falta de sombras
        this.scene.add(ambientLight);
        
        // Inicializa a UI
        this.ui = new GameUI();
        
        // Adiciona o event listener para a tecla Enter
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !this.isGameOver) {
                this.togglePause();
            } else if (e.key === 'c' || e.key === 'C') {
                // Acessa as configurações (já implementado na UI)
                // Nada a fazer aqui, pois a UI já trata desse evento
            }
        });
        
        // Event listeners
        window.addEventListener('resize', () => this.onWindowResize(), false);
        
        // Inicializa o jogo
        this.init();
        this.animate();
    }
    
    togglePause() {
        this.isPaused = !this.isPaused;
        
        // Pausa/despause o jogo
        if (this.isPaused) {
            // Para todos os sons se o jogo estiver pausado
            this.audioManager.stopAllSounds();
        }
        
        // Atualiza a UI de pausa
        this.ui.togglePause(this.isPaused);
        
        if (this.isPaused) {
            // Para todos os intervalos
            if (this.waveInterval) clearInterval(this.waveInterval);
            if (this.difficultyInterval) clearInterval(this.difficultyInterval);
            if (this.powerupSpawnInterval) clearInterval(this.powerupSpawnInterval);
            if (this.bossInterval) clearInterval(this.bossInterval);
        } else {
            // Reinicia os intervalos
            this.startWaveSystem();
        }
    }
    
    gameOver(message) {
        if (this.isGameOver) return;
        
        console.log('Game Over:', message);
        this.isGameOver = true;
        
        // Para todos os sons no fim do jogo
        this.audioManager.stopAllSounds();
        
        // Mostra a tela de game over
        this.ui.showGameOver(message);
        
        // Para todos os intervalos
        if (this.waveInterval) clearInterval(this.waveInterval);
        if (this.difficultyInterval) clearInterval(this.difficultyInterval);
        if (this.powerupSpawnInterval) clearInterval(this.powerupSpawnInterval);
        if (this.bossInterval) clearInterval(this.bossInterval);
        
        // Para o jogador
        if (this.player) {
            this.player.die();
        }
        
        // Remove todos os inimigos ativos
        this.enemies.forEach(enemy => {
            if (enemy.isActive) {
                enemy.destroy();
            }
        });
        this.enemies = [];
        
        // Remove todos os powerups ativos
        this.powerUps.forEach(powerUp => {
            if (powerUp.isActive) {
                powerUp.destroy();
            }
        });
        this.powerUps = [];
    }
    
    init() {
        // Cria a ponte (plataforma do jogo)
        const bridgeGeometry = new THREE.BoxGeometry(6, 0.2, 20);
        const bridgeMaterial = new THREE.MeshBasicMaterial({ color: 0x808080 }); // Troca PhongMaterial por BasicMaterial
        this.bridge = new THREE.Mesh(bridgeGeometry, bridgeMaterial);
        this.bridge.receiveShadow = false; // Desativa recebimento de sombras
        this.scene.add(this.bridge);
        
        // Adiciona o jogador
        this.player = new Player(this.scene, (msg) => this.gameOver(msg));
        
        // Inicia o sistema de ondas
        this.startWaveSystem();
        
        // Adiciona luz
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8); // Aumenta a luz ambiente para compensar a falta de sombras
        this.scene.add(ambientLight);
        
        // Remove a luz direcional para melhor performance
    }
    
    startWaveSystem() {
        // Limpa intervalos anteriores se existirem
        if (this.waveInterval) clearInterval(this.waveInterval);
        if (this.difficultyInterval) clearInterval(this.difficultyInterval);
        if (this.powerupSpawnInterval) clearInterval(this.powerupSpawnInterval);
        if (this.bossInterval) clearInterval(this.bossInterval);
        
        // Cria uma nova onda a cada intervalo
        this.waveInterval = setInterval(() => {
            if (!this.isPaused && !this.isGameOver && this.enemies.length < 100) {
                this.spawnWave();
            }
        }, this.waveIntervalTime);
        
        // Aumenta a dificuldade a cada 2 minutos
        this.difficultyInterval = setInterval(() => {
            if (!this.isPaused && !this.isGameOver) {
                this.waveSize = Math.min(this.waveSize + 20, 100);
                console.log(`Dificuldade aumentada! Nova onda: ${this.waveSize} inimigos`);
            }
        }, this.difficultyIntervalTime);
        
        // Verifica a cada segundo qual powerup deve ser spawnado
        this.powerupSpawnInterval = setInterval(() => {
            if (!this.isPaused && !this.isGameOver) {
                this.checkPowerupSpawn();
            }
        }, 1000);
        
        // Spawna o boss a cada 3 minutos
        this.bossInterval = setInterval(() => {
            if (!this.isPaused && !this.isGameOver) this.spawnBoss();
        }, this.bossIntervalTime);
    }
    
    spawnWave() {
        const maxEnemiesPerFrame = 5; // Máximo de inimigos por frame
        let enemiesSpawned = 0;
        
        const spawnBatch = () => {
            for (let i = 0; i < maxEnemiesPerFrame && enemiesSpawned < this.waveSize; i++) {
                if (Math.random() < 0.9 && !this.isGameOver) { // 90% de chance de spawnar
                    this.enemies.push(new Enemy(this.scene, 'normal', (msg) => this.gameOver(msg)));
                }
                enemiesSpawned++;
            }
            
            if (enemiesSpawned < this.waveSize) {
                setTimeout(spawnBatch, 200); // Spawna próximo lote após 200ms
            }
        };
        
        spawnBatch();
    }
    
    spawnPowerupEnemy(forcedType = null) {
        if (!this.isGameOver) {
            const type = forcedType || 'random';
            console.log(`Inimigo com powerup spawnou! Tipo: ${type}`);
            const enemy = new Enemy(this.scene, 'powerup', (msg) => this.gameOver(msg));
            
            // Se um tipo específico foi forçado, define-o no inimigo
            if (forcedType) {
                enemy.forcedPowerupType = forcedType;
            }
            
            this.enemies.push(enemy);
        }
    }
    
    spawnBoss() {
        if (!this.isGameOver) {
            console.log('Boss spawned!');
            this.enemies.push(new Enemy(this.scene, 'boss', (msg) => this.gameOver(msg)));
        }
    }
    
    addScore(points) {
        this.score += points;
        this.updateUI();
    }
    
    updateUI() {
        this.ui.updateGameUI(
            this.gameTime,
            this.score,
            this.player ? this.player.health : 0,
            this.player ? this.player.currentPowerUp : null,
            this.player ? this.player.getActivePowerUps() : []
        );
    }
    
    checkCollisions() {
        if (!this.player) return;
        
        // Verifica colisões entre projéteis e inimigos/powerups
        this.player.projectiles.forEach(projectile => {
            if (!projectile.isActive) return;
            
            // Verifica colisões com inimigos
            this.enemies.forEach(enemy => {
                if (!enemy.isActive) return;
                
                if (enemy.checkCollision(projectile.getPosition())) {
                    enemy.takeDamage(projectile.damage);
                    
                    // Se é projétil com dano em área (granada ou bazooka)
                    if (projectile.hasAreaDamage()) {
                        this.applyAreaDamage(projectile, enemy);
                    }
                    
                    projectile.destroy();
                    
                    // Adiciona pontuação baseada no tipo de inimigo
                    if (!enemy.isActive) { // Se o inimigo foi destruído
                        if (enemy.type === 'boss') {
                            this.addScore(100);
                        } else if (enemy.type === 'powerup') {
                            this.addScore(30);
                        } else {
                            this.addScore(10);
                        }
                    }
                }
            });
            
            // Verifica colisões com powerups
            this.powerUps.forEach(powerUp => {
                if (!powerUp.isActive || !projectile.isActive) return;
                
                const projectilePos = projectile.getPosition();
                if (powerUp.checkCollision(projectilePos)) {
                    console.log('Projétil colidiu com powerup!');
                    const powerUpInfo = powerUp.collect();
                    if (powerUpInfo) {
                        console.log('PowerUp coletado:', powerUpInfo.type);
                        this.player.addPowerUp(powerUpInfo);
                        projectile.destroy();
                    }
                }
            });
        });
        
        // Verifica colisões entre jogador e inimigos
        this.enemies.forEach(enemy => {
            if (!enemy.isActive) return;
            
            if (enemy.checkCollision(this.player.mesh.position)) {
                this.player.takeDamage(enemy.damage);
                enemy.destroy();
            }
        });
        
        // Verifica colisão do jogador com powerups
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            if (this.powerUps[i].checkCollision(this.player.mesh.position)) {
                const powerUpInfo = this.powerUps[i].collect();
                
                // Adiciona o powerup ao jogador
                if (powerUpInfo) {
                    // Log detalhado para powerups coletados
                    console.log(`PowerUp coletado: ${powerUpInfo.type}`, powerUpInfo);
                    
                    // Log extra para AK-47
                    if (powerUpInfo.type === 'ak47') {
                        console.log('AK-47 coletada! Fire rate:', powerUpInfo.fireRate, 'ms, Dano:', powerUpInfo.damage);
                    }
                    
                    this.player.addPowerUp(powerUpInfo);
                    const scoreToAdd = 30;
                    this.score += scoreToAdd;
                    this.ui.updateScore(this.score);
                    this.ui.showFloatingText(`+${scoreToAdd}`, this.player.mesh.position);
                }
                
                // Remove o powerup da lista
                this.powerUps.splice(i, 1);
            }
        }
    }
    
    // Método para aplicar dano em área aos inimigos próximos
    applyAreaDamage(projectile, hitEnemy) {
        if (!projectile.hasAreaDamage()) return;
        
        const position = hitEnemy.mesh.position.clone();
        const areaSize = projectile.areaSize;
        
        console.log(`Aplicando dano em área (${areaSize} quadrados) em ${position.x}, ${position.z}`);
        
        // Percorre todos os inimigos para verificar quais estão na área de efeito
        this.enemies.forEach(enemy => {
            if (!enemy.isActive || enemy === hitEnemy) return; // Ignora o inimigo já atingido
            
            const distance = position.distanceTo(enemy.mesh.position);
            
            // Se está dentro da área de efeito (1 quadrado = 1 unidade)
            if (distance <= areaSize) {
                console.log(`Inimigo atingido pelo efeito de área! Distância: ${distance}`);
                enemy.takeDamage(projectile.damage);
                
                // Adiciona pontuação se o inimigo foi destruído
                if (!enemy.isActive) {
                    if (enemy.type === 'boss') {
                        this.addScore(100);
                    } else if (enemy.type === 'powerup') {
                        this.addScore(30);
                    } else {
                        this.addScore(10);
                    }
                }
            }
        });
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    update() {
        if (this.isPaused || this.isGameOver) return;
        
        this.gameTime = Date.now() - this.startTime;
        
        // Atualiza o jogador
        this.player.update();
        
        // Atualiza os projéteis
        for (let i = this.player.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.player.projectiles[i];
            projectile.update();
            
            // Remove projéteis inativos da lista
            if (!projectile.isActive) {
                this.player.projectiles.splice(i, 1);
            }
        }
        
        // Atualiza os inimigos
        this.enemies = this.enemies.filter(enemy => {
            enemy.update();
            return enemy.isActive;
        });
        
        // Atualiza os powerups
        this.powerUps = this.powerUps.filter(powerUp => {
            powerUp.update();
            return powerUp.isActive;
        });
        
        // Verifica colisões
        this.checkCollisions();
        
        this.updateUI();
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        if (!this.isGameOver && !this.isPaused) {
            this.update();
        }
        this.renderer.render(this.scene, this.camera);
    }
    
    // Verifica qual powerup deve ser spawnado baseado nas frequências
    checkPowerupSpawn() {
        const now = Date.now();
        let powerupToSpawn = null;
        let readyTimes = [];
        
        // Verifica para cada tipo de powerup se está na hora de spawnar
        for (const type in this.powerupSpawnRates) {
            const timeSinceLastSpawn = now - this.lastPowerupSpawnTime[type];
            const spawnRate = this.powerupSpawnRates[type];
            
            // Se passou tempo suficiente desde o último spawn deste tipo
            if (timeSinceLastSpawn >= spawnRate) {
                readyTimes.push({ type, timeSinceLastSpawn });
            }
        }
        
        // Se há algum powerup pronto para spawnar, escolhe o que está esperando há mais tempo
        if (readyTimes.length > 0) {
            readyTimes.sort((a, b) => b.timeSinceLastSpawn - a.timeSinceLastSpawn);
            powerupToSpawn = readyTimes[0].type;
            
            // Atualiza o tempo do último spawn para este tipo
            this.lastPowerupSpawnTime[powerupToSpawn] = now;
            
            // Spawna o powerup
            this.spawnPowerupEnemy(powerupToSpawn);
        }
    }
}

// Inicia o jogo
new Game(); 