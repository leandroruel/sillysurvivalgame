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
            // Dispara 3 projéteis em leque para a gatling
            const numProjectiles = 3; // Hardcoded para garantir que sempre sejam criados 3 projéteis
            for (let i = 0; i < numProjectiles; i++) {
                const spread = (i - (numProjectiles - 1) / 2) * 0.1; // Ângulo fixo
                
                // Usa o método createProjectile para maior confiabilidade
                this.createProjectile(this.mesh.position.clone(), spread);
            }
            console.log("Gatling gun disparou 3 projéteis");
        } else {
            this.createProjectile(this.mesh.position.clone(), 0);
        }
        
        // Atira com os membros do squad (apenas se tivermos o squad powerup ou qualquer powerup ativo)
        if (this.squadMembers.length > 0) {
            // Log para debug - verifica quantos membros estão atirando
            console.log(`${this.squadMembers.length} membros do squad estão atirando`);
            
            this.squadMembers.forEach(member => {
                if (this.currentPowerUp && this.currentPowerUp.type === 'gatling') {
                    // Dispara 3 projéteis em leque para a gatling
                    const numProjectiles = 3; // Hardcoded para garantir que sempre sejam criados 3 projéteis
                    for (let i = 0; i < numProjectiles; i++) {
                        const spread = (i - (numProjectiles - 1) / 2) * 0.1; // Ângulo fixo
                        
                        // Usa o método createProjectile para maior confiabilidade
                        this.createProjectile(member.position.clone(), spread);
                    }
                } else {
                    this.createProjectile(member.position.clone(), 0);
                }
            });
        }
        
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
        
        // Pequeno delay antes de iniciar o novo sistema de tiro
        setTimeout(() => {
            console.log(`Aplicando powerup: ${powerUp.type}`);
            
            switch(powerUp.type) {
                case 'gatling':
                    this.shootDelay = powerUp.fireRate;
                    this.damage = powerUp.damage;
                    console.log(`PowerUp Gatling ativado: Delay=${this.shootDelay}ms, Dano=${this.damage}, Projéteis=${powerUp.projectileCount}`);
                    this.startShooting();
                    break;
                case 'ak47':
                    this.shootDelay = powerUp.fireRate;
                    this.damage = powerUp.damage;
                    console.log(`PowerUp AK-47 ativado: Delay=${this.shootDelay}ms, Dano=${this.damage}`);
                    this.startShooting();
                    break;
                case 'bazooka':
                case 'grenade':
                    this.shootDelay = powerUp.fireRate;
                    this.damage = powerUp.damage;
                    console.log(`PowerUp ${powerUp.type} ativado: Delay=${this.shootDelay}ms, Dano=${this.damage}, Área=${powerUp.areaSize}`);
                    this.startShooting();
                    break;
                case 'squad':
                    this.addSquadMembers(powerUp.squadSize);
                    console.log(`PowerUp Squad ativado: ${powerUp.squadSize} membros`);
                    break;
            }
        }, 100);
        
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
        // Primeiro, remova quaisquer membros existentes
        this.removeSquadMembers();
        
        // Tamanho do círculo
        const radius = 0.8; // Reduzido para ficarem mais juntos
        
        for (let i = 0; i < count; i++) {
            // Calcula posição em círculo ao redor do jogador
            const angle = (i / count) * Math.PI * 2; // Distribui igualmente em círculo
            const offsetX = Math.sin(angle) * radius;
            const offsetZ = Math.cos(angle) * radius;
            
            // Cria o modelo para o membro do squad - usando cilindros para parecer com a imagem
            const geometry = new THREE.CylinderGeometry(0.2, 0.2, 0.8, 8);
            const material = new THREE.MeshPhongMaterial({
                color: 0x0066ff, // Azul mais vibrante, similar à imagem
                emissive: 0x0044aa,
                emissiveIntensity: 0.5
            });
            const member = new THREE.Mesh(geometry, material);
            
            // Posiciona o membro no círculo ao redor do jogador
            member.position.set(
                this.mesh.position.x + offsetX,
                this.mesh.position.y,
                this.mesh.position.z + offsetZ
            );
            member.castShadow = true;
            
            // Adiciona o membro à cena e à lista
            this.scene.add(member);
            this.squadMembers.push(member);
        }
        
        console.log(`Squad criado com ${count} membros em formação circular`);
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
            this.updateSquadPositions();
        }
        if (this.keys.right && this.mesh.position.x < 2.5) {
            this.mesh.position.x += this.moveSpeed;
            
            // Move os membros do squad junto
            this.updateSquadPositions();
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
    
    // Método para atualizar a posição dos membros do squad em formação circular
    updateSquadPositions() {
        if (this.squadMembers.length === 0) return;
        
        const radius = 1.0;
        
        this.squadMembers.forEach((member, index) => {
            const count = this.squadMembers.length;
            const angle = (index / count) * Math.PI * 2;
            const offsetX = Math.sin(angle) * radius;
            const offsetZ = Math.cos(angle) * radius;
            
            member.position.x = this.mesh.position.x + offsetX;
            member.position.z = this.mesh.position.z + offsetZ;
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