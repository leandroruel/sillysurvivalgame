import * as THREE from 'three';
import { Projectile } from './Projectile';

export class Player {
    constructor(scene, onGameOver) {
        this.scene = scene;
        this.health = 100;
        this.damage = 20; // Aumentado para 20 para matar inimigos normais em 1 tiro
        this.moveSpeed = 0.1;
        this.position = { x: 0, y: 0.5, z: 8 }; // Posição inicial na ponte
        this.onGameOver = onGameOver;
        
        // Lista de projéteis ativos
        this.projectiles = [];
        this.shootingInterval = null;
        this.canShoot = true;
        this.shootDelay = 50; // Reduzido de 500 para 50ms
        
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
        if (this.shootingInterval) {
            clearInterval(this.shootingInterval);
        }
        
        this.shootingInterval = setInterval(() => {
            this.shoot();
        }, this.shootDelay);
    }
    
    shoot() {
        if (!this.canShoot) return;
        
        // Atira com o jogador principal
        if (this.currentPowerUp && this.currentPowerUp.type === 'gatling') {
            // Dispara múltiplos projéteis em leque para a gatling
            for (let i = 0; i < this.currentPowerUp.projectileCount; i++) {
                const spread = (i - (this.currentPowerUp.projectileCount - 1) / 2) * this.currentPowerUp.spreadAngle;
                this.createProjectile(this.mesh.position.clone(), spread);
            }
        } else {
            this.createProjectile(this.mesh.position.clone(), 0);
        }
        
        // Atira com os membros do squad
        this.squadMembers.forEach(member => {
            if (this.currentPowerUp && this.currentPowerUp.type === 'gatling') {
                for (let i = 0; i < this.currentPowerUp.projectileCount; i++) {
                    const spread = (i - (this.currentPowerUp.projectileCount - 1) / 2) * this.currentPowerUp.spreadAngle;
                    this.createProjectile(member.position.clone(), spread);
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
        const projectile = new Projectile(
            this.scene,
            position,
            this.damage,
            spread
        );
        this.projectiles.push(projectile);
    }
    
    addPowerUp(powerUpInfo) {
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
        
        switch(powerUp.type) {
            case 'gatling':
            case 'ak47':
                this.shootDelay = powerUp.fireRate;
                this.damage = powerUp.damage;
                this.startShooting();
                console.log(`PowerUp ativado: ${powerUp.type} - Dano: ${this.damage} - Taxa de tiro: ${this.shootDelay}ms`);
                break;
            case 'bazooka':
            case 'grenade':
                this.shootDelay = powerUp.fireRate;
                this.damage = powerUp.damage;
                // A área de dano é tratada na classe Projectile
                this.startShooting();
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