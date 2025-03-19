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
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(this.position.x, this.position.y, this.position.z);
        this.mesh.castShadow = false;
        
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
        
        // Garante que o shootDelay seja um valor válido
        if (!this.shootDelay || this.shootDelay < 10) {
            console.warn(`ShootDelay inválido (${this.shootDelay}ms), usando valor padrão de 50ms`);
            this.shootDelay = 50;
        }
        
        console.log(`Iniciando sistema de tiro com delay: ${this.shootDelay}ms, Power-up: ${this.currentPowerUp ? this.currentPowerUp.type : 'nenhum'}`);
        
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
        
        // Determina o tipo de tiro com base no powerup atual
        const currentWeaponType = this.currentPowerUp ? this.currentPowerUp.type : null;
        
        // Log para identificar o tipo de arma atual em cada tiro
        console.log(`Tiro atual: ${currentWeaponType || 'arma padrão'}, Delay: ${this.shootDelay}ms`);
        
        // Atira com o jogador principal
        this.fireWeapon(this.mesh.position.clone(), currentWeaponType);
        
        // Atira com os membros do squad, se existirem
        if (this.squadMembers.length > 0) {
            console.log(`${this.squadMembers.length} membros do squad estão atirando com ${currentWeaponType || 'arma padrão'}`);
            
            this.squadMembers.forEach((member, index) => {
                // Para debug: mostra a posição de cada membro ao atirar
                console.log(`Membro ${index}: posição (${member.position.x.toFixed(2)}, ${member.position.y.toFixed(2)}, ${member.position.z.toFixed(2)})`);
                
                // Garante que a posição é válida antes de atirar
                if (member && member.position) {
                    this.fireWeapon(member.position.clone(), currentWeaponType);
                }
            });
        }
        
        // Cooldown do tiro
        this.canShoot = false;
        setTimeout(() => {
            this.canShoot = true;
        }, this.shootDelay);
    }
    
    // Método para disparar uma arma com base no tipo de powerup
    fireWeapon(position, weaponType) {
        try {
            // Log para debug do tipo de arma
            console.log(`Disparando arma tipo: ${weaponType || 'padrão'} da posição (${position.x.toFixed(2)}, ${position.y.toFixed(2)}, ${position.z.toFixed(2)})`);
            
            switch(weaponType) {
                case 'gatling':
                    // Dispara 3 projéteis em leque para a gatling
                    const numProjectiles = 3;
                    for (let i = 0; i < numProjectiles; i++) {
                        const spread = (i - (numProjectiles - 1) / 2) * 0.1;
                        this.createProjectile(position, spread, weaponType);
                    }
                    break;
                    
                case 'ak47':
                    // Tratamento específico para AK-47
                    console.log("Disparando AK-47");
                    this.createProjectile(position, 0, 'ak47');
                    break;
                    
                case 'bazooka':
                    // Tratamento específico para Bazooka
                    console.log("Disparando Bazooka");
                    this.createProjectile(position, 0, 'bazooka');
                    break;
                    
                case 'grenade':
                    // Tratamento específico para Granada
                    console.log("Disparando Granada");
                    this.createProjectile(position, 0, 'grenade');
                    break;
                    
                default:
                    // Arma padrão dispara um único projétil
                    this.createProjectile(position, 0, weaponType);
                    break;
            }
        } catch (error) {
            console.error('Erro ao disparar arma:', error);
        }
    }
    
    createProjectile(position, spread = 0, forcedPowerUpType = null) {
        // Define o tipo de powerup a ser usado
        let powerUpType = forcedPowerUpType || null;
        let areaSize = 0;
        
        // Se não foi forçado um tipo específico, usa o powerup atual
        if (!powerUpType && this.currentPowerUp) {
            powerUpType = this.currentPowerUp.type;
        }
        
        // Define a área de dano com base no tipo de powerup
        if (powerUpType === 'bazooka') {
            areaSize = 2; // Garante que a bazooka sempre tenha área 2
        } else if (powerUpType === 'grenade') {
            areaSize = 1; // Garante que a granada sempre tenha área 1
        } else if (this.currentPowerUp && this.currentPowerUp.areaSize) {
            areaSize = this.currentPowerUp.areaSize;
        }
        
        try {
            // Clona a posição para evitar problemas de referência
            const projectilePosition = new THREE.Vector3(position.x, position.y, position.z);
            
            // Log detalhado para debug
            console.log(`Criando projétil: tipo=${powerUpType}, área=${areaSize}, dano=${this.damage}`);
            
            const projectile = new Projectile(
                this.scene,
                projectilePosition,
                this.damage,
                spread,
                powerUpType,
                areaSize
            );
            this.projectiles.push(projectile);
            
            // Log para debug
            console.debug(`Projétil criado na posição ${projectilePosition.x.toFixed(2)}, ${projectilePosition.y.toFixed(2)}, ${projectilePosition.z.toFixed(2)} com powerup ${powerUpType || 'nenhum'}`);
        } catch (error) {
            console.error('Erro ao criar projétil:', error);
        }
    }
    
    addPowerUp(powerUpInfo) {
        // Toca o som do powerup
        this.audioManager.playPowerup();
        
        const powerUp = {
            ...powerUpInfo,
            startTime: Date.now(),
            endTime: Date.now() + powerUpInfo.duration,
            timerId: null, // Identificador para o temporizador de remoção
            isActive: true // Flag para controlar se o powerup está realmente ativo
        };
        
        // Limpa qualquer temporizador ativo para este tipo de powerup
        this.clearPowerUpTimer(powerUp.type);
        
        // Se é um powerup de arma, remove qualquer outro powerup de arma ativo
        if (powerUp.type !== 'squad') {
            this.activePowerUps = this.activePowerUps.filter(p => {
                // Se for um powerup de arma diferente, remove-o
                if (p.type !== 'squad' && p.type !== powerUp.type && p.isActive) {
                    console.log(`Removendo powerup de arma anterior: ${p.type}`);
                    if (p.timerId) clearTimeout(p.timerId);
                    return false;
                }
                return true;
            });
        }
        
        // Verifica se já existe um powerup do mesmo tipo
        const existingPowerUpIndex = this.activePowerUps.findIndex(p => p.type === powerUp.type && p.isActive);
        if (existingPowerUpIndex >= 0) {
            // Atualiza o tempo de expiração do powerup existente
            this.activePowerUps[existingPowerUpIndex].endTime = powerUp.endTime;
            console.log(`PowerUp ${powerUp.type} renovado por mais ${powerUp.duration / 1000} segundos`);
        } else {
            // Adiciona o novo powerup à lista
            this.activePowerUps.push(powerUp);
        }
        
        // Atualiza o powerup atual (exceto se for squad, que deve ser combinado com outros)
        if (powerUp.type !== 'squad') {
            this.currentPowerUp = powerUp;
            
            // Atualiza a cor do jogador e dos membros do squad
            const powerUpColor = this.getPowerUpColor(powerUp.type);
            this.mesh.material.color.setHex(powerUpColor);
            
            // Atualiza a cor dos membros do squad também
            this.squadMembers.forEach(member => {
                member.material.color.setHex(powerUpColor);
            });
        }
        
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
                    console.log(`PowerUp Gatling ativado: Delay=${this.shootDelay}ms, Dano=${this.damage}`);
                    this.startShooting();
                    break;
                case 'ak47':
                    this.shootDelay = powerUp.fireRate;
                    this.damage = powerUp.damage;
                    console.log(`PowerUp AK-47 ativado: Delay=${this.shootDelay}ms, Dano=${this.damage}`);
                    // Força a atualização do tipo de powerup atual para AK-47
                    this.currentPowerUp = powerUp;
                    this.startShooting();
                    break;
                case 'bazooka':
                    this.shootDelay = powerUp.fireRate;
                    this.damage = powerUp.damage;
                    console.log(`PowerUp Bazooka ativado: Delay=${this.shootDelay}ms, Dano=${this.damage}, Área=${powerUp.areaSize}`);
                    // Força a atualização do tipo de powerup atual para Bazooka
                    this.currentPowerUp = powerUp;
                    this.startShooting();
                    break;
                case 'grenade':
                    this.shootDelay = powerUp.fireRate;
                    this.damage = powerUp.damage;
                    console.log(`PowerUp Granada ativado: Delay=${this.shootDelay}ms, Dano=${this.damage}, Área=${powerUp.areaSize}`);
                    // Força a atualização do tipo de powerup atual para Granada
                    this.currentPowerUp = powerUp;
                    this.startShooting();
                    break;
                case 'squad':
                    // Adiciona o squad apenas se não existir já (para evitar duplicação)
                    if (existingPowerUpIndex < 0) {
                        this.addSquadMembers(powerUp.squadSize);
                        console.log(`PowerUp Squad ativado: ${powerUp.squadSize} membros`);
                    } else {
                        console.log(`PowerUp Squad renovado: continuando com ${this.squadMembers.length} membros`);
                    }
                    // Reinicia o sistema de tiro para certificar-se que os membros do squad usem o power-up atual
                    this.startShooting();
                    break;
            }
        }, 100);
        
        // Remove o powerup quando expirar
        const timerId = setTimeout(() => {
            this.removePowerUp(powerUp);
        }, powerUp.duration);
        
        // Armazena o ID do timer para poder cancelá-lo se necessário
        if (existingPowerUpIndex >= 0) {
            this.activePowerUps[existingPowerUpIndex].timerId = timerId;
        } else {
            powerUp.timerId = timerId;
        }
    }
    
    // Limpa o temporizador de um tipo específico de powerup
    clearPowerUpTimer(type) {
        const existingPowerUp = this.activePowerUps.find(p => p.type === type && p.isActive);
        if (existingPowerUp && existingPowerUp.timerId) {
            clearTimeout(existingPowerUp.timerId);
            existingPowerUp.timerId = null;
            console.log(`Timer do powerup ${type} cancelado para renovação`);
        }
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
            // Marca o powerup como inativo em vez de removê-lo da lista
            this.activePowerUps[index].isActive = false;
            
            // Limpa o timer se existir
            if (this.activePowerUps[index].timerId) {
                clearTimeout(this.activePowerUps[index].timerId);
                this.activePowerUps[index].timerId = null;
            }
            
            // Verifica se ainda há um powerup de squad ativo
            const hasSquadPowerUp = this.activePowerUps.some(p => p.type === 'squad' && p.isActive);
            
            // Remove membros do squad apenas se o powerup que expirou for o de squad
            if (powerUp.type === 'squad') {
                console.log('PowerUp de squad expirou - removendo membros do squad');
                this.removeSquadMembers();
            }
            
            // Conta quantos powerups ativos ainda existem (excluindo os inativos)
            const activeCount = this.activePowerUps.filter(p => p.isActive).length;
            
            // Reseta as configurações padrão se não houver outros powerups ativos
            if (activeCount === 0) {
                this.shootDelay = 50;
                this.damage = 20;
                this.currentPowerUp = null;
                this.mesh.material.color.setHex(0x00ff00);
                this.startShooting();
            } else {
                // Procura outro powerup de arma ativo para aplicar
                const weaponPowerUp = this.activePowerUps.find(p => 
                    p.isActive && (p.type === 'gatling' || p.type === 'ak47' || 
                    p.type === 'bazooka' || p.type === 'grenade')
                );
                
                if (weaponPowerUp) {
                    this.currentPowerUp = weaponPowerUp;
                    this.shootDelay = weaponPowerUp.fireRate;
                    this.damage = weaponPowerUp.damage;
                    
                    const powerUpColor = this.getPowerUpColor(weaponPowerUp.type);
                    this.mesh.material.color.setHex(powerUpColor);
                    
                    // Atualiza os membros do squad também
                    this.squadMembers.forEach(member => {
                        member.material.color.setHex(powerUpColor);
                    });
                    
                    this.startShooting();
                } else {
                    // Aplica o próximo powerup da lista (provavelmente squad)
                    const nextActivePowerUp = this.activePowerUps.find(p => p.isActive);
                    if (nextActivePowerUp) {
                        this.currentPowerUp = nextActivePowerUp;
                        this.mesh.material.color.setHex(this.getPowerUpColor(this.currentPowerUp.type));
                    } else {
                        this.currentPowerUp = null;
                    }
                    
                    // Garante que o sistema de tiro continue funcionando
                    this.startShooting();
                }
            }
            
            console.log('PowerUp removido:', powerUp.type);
        }
    }
    
    addSquadMembers(count) {
        // Primeiro, remova quaisquer membros existentes
        this.removeSquadMembers();
        
        // Tamanho do círculo
        const radius = 0.7; // Reduzido para ficarem mais juntos
        
        console.log(`Adicionando ${count} membros ao squad`);
        
        for (let i = 0; i < count; i++) {
            // Calcula posição em círculo ao redor do jogador
            const angle = (i / count) * Math.PI * 2; // Distribui igualmente em círculo
            const offsetX = Math.sin(angle) * radius;
            const offsetZ = Math.cos(angle) * radius;
            
            // Cria o modelo para o membro do squad - usando cilindros para parecer com a imagem
            const geometry = new THREE.CylinderGeometry(0.2, 0.2, 0.8, 8);
            const material = new THREE.MeshBasicMaterial({
                color: 0x0066ff // Azul mais vibrante, similar à imagem
            });
            const member = new THREE.Mesh(geometry, material);
            
            // Posiciona o membro no círculo ao redor do jogador
            member.position.set(
                this.mesh.position.x + offsetX,
                this.mesh.position.y,
                this.mesh.position.z + offsetZ
            );
            member.castShadow = false; // Desativa sombras
            
            // Define propriedades importantes para o membro do squad
            member.isSquadMember = true; // Flag para identificação
            
            // Adiciona o membro à cena e à lista
            this.scene.add(member);
            this.squadMembers.push(member);
            
            console.log(`Membro ${i+1} adicionado na posição (${member.position.x.toFixed(2)}, ${member.position.y.toFixed(2)}, ${member.position.z.toFixed(2)})`);
        }
        
        // Aplica a cor do powerup atual aos membros do squad, se houver
        if (this.currentPowerUp && this.currentPowerUp.type !== 'squad') {
            const powerUpColor = this.getPowerUpColor(this.currentPowerUp.type);
            this.squadMembers.forEach(member => {
                member.material.color.setHex(powerUpColor);
            });
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
        }
        if (this.keys.right && this.mesh.position.x < 2.5) {
            this.mesh.position.x += this.moveSpeed;
        }
        
        // Atualiza a posição
        this.position.x = this.mesh.position.x;
        
        // Sempre atualiza a posição dos membros do squad, independente do movimento
        if (this.squadMembers.length > 0) {
            this.updateSquadPositions();
        }
        
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
        
        const radius = 0.7; // Mesmo valor usado na criação
        
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
    
    // Retorna apenas os powerups realmente ativos para exibição na UI
    getActivePowerUps() {
        return this.activePowerUps.filter(p => p.isActive);
    }
} 