import * as THREE from 'three';
import { Player } from './Player';
import { Enemy } from './Enemy';
import { PowerUp } from './PowerUp';
import { GameUI } from './UI';

class Game {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        
        // Adiciona referência do jogo à cena
        this.scene.userData.game = this;
        
        // Configuração inicial
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.scene.background = new THREE.Color(0x87CEEB); // Céu azul
        
        document.body.appendChild(this.renderer.domElement);
        
        // Estado do jogo
        this.isGameOver = false;
        this.isPaused = false;
        
        // Posicionamento da câmera isométrica
        this.camera.position.set(0, 10, 10);
        this.camera.lookAt(0, 0, 0);
        
        // Adiciona luz
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 5, 5);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);
        
        // Lista de inimigos e powerups
        this.enemies = [];
        this.powerUps = [];
        this.waveSize = 30;
        this.waveInterval = 5000; // 5 segundos entre ondas
        this.difficultyInterval = 120000; // 2 minutos para aumentar a dificuldade
        this.powerupEnemyInterval = 60000; // 1 minuto para spawnar inimigo com powerup
        this.bossInterval = 480000; // 8 minutos para o primeiro boss
        this.gameTime = 0;
        this.score = 0;
        
        // Inicializa a UI
        this.ui = new GameUI();
        
        // Adiciona o event listener para a tecla Enter
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !this.isGameOver) {
                this.togglePause();
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
        this.ui.togglePause(this.isPaused);
        
        if (this.isPaused) {
            // Para todos os intervalos
            if (this.waveInterval) clearInterval(this.waveInterval);
            if (this.difficultyInterval) clearInterval(this.difficultyInterval);
            if (this.powerupEnemyInterval) clearInterval(this.powerupEnemyInterval);
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
        this.ui.showGameOver(message);
        
        // Para todos os intervalos
        if (this.waveInterval) clearInterval(this.waveInterval);
        if (this.difficultyInterval) clearInterval(this.difficultyInterval);
        if (this.powerupEnemyInterval) clearInterval(this.powerupEnemyInterval);
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
        const bridgeMaterial = new THREE.MeshPhongMaterial({ color: 0x808080 });
        this.bridge = new THREE.Mesh(bridgeGeometry, bridgeMaterial);
        this.bridge.receiveShadow = true;
        this.scene.add(this.bridge);
        
        // Adiciona o jogador
        this.player = new Player(this.scene, (msg) => this.gameOver(msg));
        
        // Inicia o sistema de ondas
        this.startWaveSystem();
    }
    
    startWaveSystem() {
        // Limpa intervalos anteriores se existirem
        if (this.waveInterval) clearInterval(this.waveInterval);
        if (this.difficultyInterval) clearInterval(this.difficultyInterval);
        if (this.powerupEnemyInterval) clearInterval(this.powerupEnemyInterval);
        if (this.bossInterval) clearInterval(this.bossInterval);
        
        // Cria uma nova onda a cada intervalo
        this.waveInterval = setInterval(() => {
            if (!this.isPaused && !this.isGameOver) this.spawnWave();
        }, this.waveInterval);
        
        // Aumenta a dificuldade a cada 2 minutos
        this.difficultyInterval = setInterval(() => {
            if (!this.isPaused && !this.isGameOver) {
                this.waveSize += 20;
                console.log(`Dificuldade aumentada! Nova onda: ${this.waveSize} inimigos`);
            }
        }, this.difficultyInterval);
        
        // Spawna um inimigo com powerup a cada 1 minuto
        this.powerupEnemyInterval = setInterval(() => {
            if (!this.isPaused && !this.isGameOver) this.spawnPowerupEnemy();
        }, this.powerupEnemyInterval);
        
        // Spawna o boss a cada 8 minutos
        this.bossInterval = setInterval(() => {
            if (!this.isPaused && !this.isGameOver) this.spawnBoss();
        }, this.bossInterval);
    }
    
    spawnWave() {
        for (let i = 0; i < this.waveSize; i++) {
            setTimeout(() => {
                if (Math.random() < 0.9 && !this.isGameOver) { // 90% de chance de spawnar (para variar um pouco)
                    this.enemies.push(new Enemy(this.scene, 'normal', (msg) => this.gameOver(msg)));
                }
            }, i * 200); // Spawna inimigos com um pequeno delay entre eles
        }
    }
    
    spawnPowerupEnemy() {
        if (!this.isGameOver) {
            console.log('Inimigo com powerup spawnou!');
            this.enemies.push(new Enemy(this.scene, 'powerup', (msg) => this.gameOver(msg)));
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
            this.player ? this.player.currentPowerUp : null
        );
    }
    
    checkCollisions() {
        if (!this.player) return;
        
        // Verifica colisões entre projéteis e inimigos
        this.player.projectiles.forEach(projectile => {
            if (!projectile.isActive) return;
            
            this.enemies.forEach(enemy => {
                if (!enemy.isActive) return;
                
                if (enemy.checkCollision(projectile.getPosition())) {
                    enemy.takeDamage(projectile.damage);
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
            
            // Verifica colisões entre projéteis e powerups
            this.powerUps.forEach(powerUp => {
                if (!powerUp.isActive) return;
                
                if (powerUp.checkCollision(projectile.getPosition())) {
                    const powerUpInfo = powerUp.collect();
                    if (powerUpInfo) {
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
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    update() {
        if (this.isGameOver || this.isPaused) return;
        
        // Atualiza o tempo do jogo
        this.gameTime += 16.67; // Aproximadamente 60 FPS
        this.updateUI();
        
        // Atualiza o jogador
        if (this.player) {
            this.player.update();
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
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        if (!this.isGameOver && !this.isPaused) {
            this.update();
        }
        this.renderer.render(this.scene, this.camera);
    }
}

// Inicia o jogo
new Game(); 