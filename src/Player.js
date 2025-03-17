import * as THREE from 'three';
import { Projectile } from './Projectile';
import { AudioManager } from './AudioManager';

export class Player {
    constructor(scene, onGameOver) {
        this.scene = scene;
        this.health = 100;
        this.damage = 20; // Aumentado para 20 para matar inimigos normais em 1 tiro
        this.moveSpeed = 0.1;
        this.position = { x: 0, y: 0.5, z: 8 }; // Posição inicial na ponte
        this.onGameOver = onGameOver;
        
        // Usa o AudioManager global
        this.audioManager = AudioManager.getInstance();
        
        // Lista de projéteis ativos
        this.projectiles = [];
        this.shootingInterval = null;
        this.canShoot = true;
        this.shootDelay = 50;
        this.lastShotTime = 0; // Para controle de taxa de tiro
        
        // Sistema de powerups
        this.activePowerUps = [];
        this.squadMembers = [];
        this.currentPowerUp = null;
        
        // Cria o modelo do jogador (temporariamente um cubo)
        const geometry = new THREE.BoxGeometry(0.5, 1, 0.5);
        const material = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(this.position.x, this.position.y, this.position.z);
        this.mesh.castShadow = true;
        
        this.scene.add(this.mesh);
        
        // Configuração dos controles
        this.keys = {
            left: false,
            right: false
        };
        
        // Event listeners para movimento
        window.addEventListener('keydown', (e) => this.onKeyDown(e));
        window.addEventListener('keyup', (e) => this.onKeyUp(e));
        
        // Inicia o sistema de tiro automático
        this.startShooting();
    }
    
    onKeyDown(event) {
        switch(event.key) {
            case 'ArrowLeft':
            case 'a':
                this.keys.left = true;
                break;
            case 'ArrowRight':
            case 'd':
                this.keys.right = true;
                break;
        }
    }
    
    onKeyUp(event) {
        switch(event.key) {
            case 'ArrowLeft':
            case 'a':
                this.keys.left = false;
                break;
            case 'ArrowRight':
            case 'd':
                this.keys.right = false;
                break;
        }
    }
    
    startShooting() {
        // Garante que o intervalo anterior seja limpo
        if (this.shootingInterval) {
            clearInterval(this.shootingInterval);
            this.shootingInterval = null;
        }
        
        console.log(`Iniciando sistema de tiro com delay: ${this.shootDelay}ms`);
        
        // Configura um novo intervalo de tiro
        this.shootingInterval = setInterval(() => {
            this.shoot();
        }, this.shootDelay);
        
        // Dispara imediatamente o primeiro tiro
        this.shoot();
    }
    
    shoot() {
        // Verifica se o jogador pode atirar e se o jogo está em andamento
        if (!this.canShoot) return;
        
        // Verifica se o jogo está pausado ou terminado
        const game = this.scene.userData.game;
        if (game && (game.isPaused || game.isGameOver)) return;
        
        const now = performance.now();
        if (now - this.lastShotTime < this.shootDelay) return;
        
        this.lastShotTime = now;
        
        // Toca o som do tiro
        this.audioManager.playShot();
        
        // Atira com o jogador principal
        if (this.currentPowerUp && this.currentPowerUp.type === 'gatling') {
            // Dispara múltiplos projéteis em leque para a gatling
            for (let i = 0; i < this.currentPowerUp.projectileCount; i++) {
                const spread = (i - (this.currentPowerUp.projectileCount - 1) / 2) * this.currentPowerUp.spreadAngle;
                const projectile = new Projectile(
                    this.scene,
                    this.mesh.position.clone(),
                    this.currentPowerUp.damage,
                    spread,
                    this.currentPowerUp.type,
                    0 // Gatling não tem dano em área
                );
                this.projectiles.push(projectile);
                
                // Verifica se o projétil foi realmente adicionado à cena
                if (!projectile.mesh || !projectile.mesh.parent) {
                    console.error('Erro ao criar projétil para gatling gun!');
                    // Tenta criar usando o método alternativo
                    this.createProjectile(this.mesh.position.clone(), spread);
                }
            }
        } else {
            this.createProjectile(this.mesh.position.clone(), 0);
        }
        
        // Atira com os membros do squad
        this.squadMembers.forEach(member => {
            if (this.currentPowerUp && this.currentPowerUp.type === 'gatling') {
                for (let i = 0; i < this.currentPowerUp.projectileCount; i++) {
                    const spread = (i - (this.currentPowerUp.projectileCount - 1) / 2) * this.currentPowerUp.spreadAngle;
                    const projectile = new Projectile(
                        this.scene,
                        member.position.clone(),
                        this.currentPowerUp.damage,
                        spread,
                        this.currentPowerUp.type,
                        0 // Gatling não tem dano em área
                    );
                    this.projectiles.push(projectile);
                    
                    // Verificação adicional
                    if (!projectile.mesh || !projectile.mesh.parent) {
                        console.error('Erro ao criar projétil para squad com gatling gun!');
                        // Tenta criar usando o método alternativo
                        this.createProjectile(member.position.clone(), spread);
                    }
                }
            } else {
                this.createProjectile(member.position.clone(), 0);
            }
        });
        
        // Cooldown do tiro
        this.canShoot = false;
        setTimeout(() => {
            this.canShoot = true;
        }, this.shootDelay);
    }
    
    createProjectile(position, spread = 0) {
        // Se tiver um powerup ativo que tenha área de dano
        let powerUpType = null;
        let areaSize = 0;
        
        if (this.currentPowerUp) {
            powerUpType = this.currentPowerUp.type;
            
            if (this.currentPowerUp.areaSize) {
                areaSize = this.currentPowerUp.areaSize;
            }
        }
        
        const projectile = new Projectile(
            this.scene,
            position,
            this.damage,
            spread,
            powerUpType,
            areaSize
        );
        this.projectiles.push(projectile);
    }
    
    addPowerUp(powerUpInfo) {
        // Toca o som do powerup
        this.audioManager.playPowerup();
        
        const powerUp = {
            ...powerUpInfo,
            startTime: Date.now(),
            endTime: Date.now() + powerUpInfo.duration
        };
        
        this.activePowerUps.push(powerUp);
        this.currentPowerUp = powerUp;
        
        // Atualiza a cor do jogador e dos membros do squad baseado no powerup
        const powerUpColor = this.getPowerUpColor(powerUp.type);
        this.mesh.material.color.setHex(powerUpColor);
        this.mesh.material.emissive.setHex(powerUpColor);
        this.mesh.material.emissiveIntensity = 0.3;
        
        // Para o intervalo de tiro atual para evitar conflitos
        if (this.shootingInterval) {
            clearInterval(this.shootingInterval);
            this.shootingInterval = null;
        }
        
        switch(powerUp.type) {
            case 'gatling':
            case 'ak47':
                this.shootDelay = powerUp.fireRate;
                this.damage = powerUp.damage;
                // Reinicia o sistema de tiro com a nova taxa
                setTimeout(() => {
                    this.startShooting();
                }, 100); // Pequeno delay para garantir que o intervalo anterior foi limpo
                console.log(`PowerUp ativado: ${powerUp.type} - Dano: ${this.damage} - Taxa de tiro: ${this.shootDelay}ms`);
                break;
            case 'bazooka':
            case 'grenade':
                this.shootDelay = powerUp.fireRate;
                this.damage = powerUp.damage;
                // A área de dano é tratada na classe Projectile
                setTimeout(() => {
                    this.startShooting();
                }, 100);
                console.log(`PowerUp ativado: ${powerUp.type} - Dano: ${this.damage} - Área: ${powerUp.areaSize}`);
                break;
            case 'squad':
                this.addSquadMembers(powerUp.squadSize);
                console.log(`PowerUp ativado: ${powerUp.type} - Squad size: ${powerUp.squadSize}`);
                break;
        }
        
        // Remove o powerup quando expirar
        setTimeout(() => {
            this.removePowerUp(powerUp);
        }, powerUp.duration);
    }
    
    getPowerUpColor(type) {
        switch(type) {
            case 'gatling':
                return 0xffff00;
            case 'ak47':
                return 0xff9900;
            case 'bazooka':
                return 0xff0000;
            case 'grenade':
                return 0x00ff00;
            case 'squad':
                return 0x0000ff;
            default:
                return 0x00ff00;
        }
    }
    
    removePowerUp(powerUp) {
        const index = this.activePowerUps.indexOf(powerUp);
        if (index > -1) {
            this.activePowerUps.splice(index, 1);
            
            // Reseta as configurações padrão se não houver outros powerups ativos
            if (this.activePowerUps.length === 0) {
                this.shootDelay = 50; // Reduzido de 500 para 50ms
                this.damage = 20;
                this.currentPowerUp = null;
                this.mesh.material.color.setHex(0x00ff00);
                this.mesh.material.emissive.setHex(0x000000);
                this.mesh.material.emissiveIntensity = 0;
                this.startShooting();
            } else {
                // Aplica o próximo powerup da lista
                this.currentPowerUp = this.activePowerUps[this.activePowerUps.length - 1];
                this.mesh.material.color.setHex(this.getPowerUpColor(this.currentPowerUp.type));
                this.mesh.material.emissive.setHex(this.getPowerUpColor(this.currentPowerUp.type));
            }
            
            // Remove membros do squad se for um powerup de squad
            if (powerUp.type === 'squad') {
                this.removeSquadMembers();
            }
            
            console.log('PowerUp removido:', powerUp.type);
        }
    }
    
    addSquadMembers(count) {
        for (let i = 0; i < count; i++) {
            const offset = (i + 1) * 0.6 * (i % 2 === 0 ? 1 : -1);
            const geometry = new THREE.BoxGeometry(0.5, 1, 0.5);
            const material = new THREE.MeshPhongMaterial({
                color: this.getPowerUpColor('squad'),
                emissive: this.getPowerUpColor('squad'),
                emissiveIntensity: 0.3
            });
            const member = new THREE.Mesh(geometry, material);
            
            member.position.set(
                this.mesh.position.x + offset,
                this.mesh.position.y,
                this.mesh.position.z
            );
            member.castShadow = true;
            
            this.scene.add(member);
            this.squadMembers.push(member);
        }
    }
    
    removeSquadMembers() {
        this.squadMembers.forEach(member => {
            this.scene.remove(member);
            member.geometry.dispose();
            member.material.dispose();
        });
        this.squadMembers = [];
    }
    
    update() {
        // Movimento do jogador
        if (this.keys.left && this.mesh.position.x > -2.5) {
            this.mesh.position.x -= this.moveSpeed;
            
            // Move os membros do squad junto
            this.squadMembers.forEach((member, index) => {
                const offset = (index + 1) * 0.6 * (index % 2 === 0 ? 1 : -1);
                member.position.x = this.mesh.position.x + offset;
            });
        }
        if (this.keys.right && this.mesh.position.x < 2.5) {
            this.mesh.position.x += this.moveSpeed;
            
            // Move os membros do squad junto
            this.squadMembers.forEach((member, index) => {
                const offset = (index + 1) * 0.6 * (index % 2 === 0 ? 1 : -1);
                member.position.x = this.mesh.position.x + offset;
            });
        }
        
        // Atualiza a posição
        this.position.x = this.mesh.position.x;
        
        // Atualiza os projéteis
        this.projectiles = this.projectiles.filter(projectile => {
            projectile.update();
            return projectile.isActive;
        });
        
        // Remove powerups expirados
        const now = Date.now();
        this.activePowerUps = this.activePowerUps.filter(powerUp => {
            return now < powerUp.endTime;
        });
    }
    
    takeDamage(amount) {
        this.health -= amount;
        console.log(`Vida do jogador: ${this.health}`);
        if (this.health <= 0) {
            this.health = 0; // Garante que a vida não fique negativa
            this.die();
        }
    }
    
    die() {
        if (this.health > 0) return; // Evita chamar die() múltiplas vezes
        
        console.log('Player died!');
        // Limpa o intervalo de tiro
        if (this.shootingInterval) {
            clearInterval(this.shootingInterval);
        }
        
        // Remove os membros do squad
        this.removeSquadMembers();
        
        // Remove os projéteis ativos
        this.projectiles.forEach(projectile => {
            if (projectile.isActive) {
                projectile.destroy();
            }
        });
        this.projectiles = [];
        
        // Chama o callback de game over
        if (this.onGameOver) {
            this.onGameOver('Você morreu!');
        }
    }
} 