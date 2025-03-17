import * as THREE from 'three';

export class PowerUp {
    constructor(scene, type, position) {
        this.scene = scene;
        this.type = type;
        this.isActive = true;
        
        // Define as características baseadas no tipo
        switch(type) {
            case 'gatling':
                this.duration = 120000; // 2 minutos
                this.fireRate = 50; // 50ms entre tiros
                this.damage = 10;
                this.projectileCount = 3; // Número de projéteis por tiro
                this.spreadAngle = 0.1; // Ângulo de dispersão dos tiros
                this.color = 0xffff00;
                this.displayName = 'GATLING';
                break;
            case 'ak47':
                this.duration = 240000; // 4 minutos
                this.fireRate = 40; // 0.04 segundos (reduzido de 100ms)
                this.damage = 15;
                this.color = 0xff9900;
                this.displayName = 'AK-47';
                break;
            case 'bazooka':
                this.duration = 120000; // 2 minutos
                this.fireRate = 800; // 0.8 segundos
                this.damage = 40;
                this.areaSize = 2;
                this.color = 0xff0000;
                this.displayName = 'BAZOOKA';
                break;
            case 'grenade':
                this.duration = 120000; // 2 minutos
                this.fireRate = 10; // Ajustado para 10ms (era 800ms)
                this.damage = 20;
                this.areaSize = 1; // 1 quadrado ao redor do alvo
                this.color = 0x00ff00;
                this.displayName = 'GRANADA';
                break;
            case 'squad':
                this.duration = 300000; // 5 minutos
                this.squadSize = 8; // Aumentando para 8 soldados como na imagem
                this.color = 0x0066ff; // Cor azul como os soldados
                this.displayName = 'SQUAD';
                break;
        }
        
        // Cria o modelo do powerup
        const geometry = new THREE.SphereGeometry(0.3, 8, 8);
        const material = new THREE.MeshPhongMaterial({
            color: this.color,
            emissive: this.color,
            emissiveIntensity: 0.5
        });
        this.mesh = new THREE.Mesh(geometry, material);
        
        // Adiciona um efeito de brilho
        const glowGeometry = new THREE.SphereGeometry(0.4, 8, 8);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: this.color,
            transparent: true,
            opacity: 0.3
        });
        this.glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
        this.mesh.add(this.glowMesh);
        
        // Cria o texto do powerup
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 64;
        
        // Configura o estilo do texto
        context.fillStyle = '#ffffff';
        context.font = 'bold 32px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        
        // Desenha o texto
        context.fillText(this.displayName, canvas.width / 2, canvas.height / 2);
        
        // Cria a textura e o sprite
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({
            map: texture,
            transparent: true
        });
        this.textSprite = new THREE.Sprite(spriteMaterial);
        this.textSprite.scale.set(2, 0.5, 1);
        this.textSprite.position.y = 1;
        
        // Adiciona o sprite ao mesh principal
        this.mesh.add(this.textSprite);
        
        // Define a posição inicial
        this.mesh.position.copy(position);
        this.mesh.position.y = 0.5; // Altura fixa mais próxima do chão
        
        this.scene.add(this.mesh);
        
        // Inicia o timer de despawn
        setTimeout(() => {
            this.destroy();
        }, 5000); // O powerup desaparece após 5 segundos se não for coletado
    }
    
    update() {
        if (!this.isActive) return;
        
        // Faz o powerup girar e flutuar
        this.mesh.rotation.y += 0.05;
        this.mesh.position.y += Math.sin(Date.now() * 0.005) * 0.002;
        
        // Mantém o texto sempre virado para a câmera
        if (this.textSprite) {
            this.textSprite.rotation.y = -this.mesh.rotation.y;
        }
    }
    
    collect() {
        if (!this.isActive) return null;
        
        console.log('PowerUp sendo coletado:', this.type);
        const powerUpInfo = {
            type: this.type,
            duration: this.duration,
            fireRate: this.fireRate,
            damage: this.damage,
            areaSize: this.areaSize,
            squadSize: this.squadSize,
            color: this.color
        };
        
        this.destroy();
        return powerUpInfo;
    }
    
    destroy() {
        if (!this.isActive) return;
        
        this.isActive = false;
        this.scene.remove(this.mesh);
        this.mesh.geometry.dispose();
        this.mesh.material.dispose();
        if (this.glowMesh) {
            this.glowMesh.geometry.dispose();
            this.glowMesh.material.dispose();
        }
        if (this.textSprite) {
            this.textSprite.material.map.dispose();
            this.textSprite.material.dispose();
        }
    }
    
    getPosition() {
        return this.mesh.position;
    }
    
    checkCollision(position) {
        if (!this.isActive) return false;
        
        // Verifica se o projétil está na mesma altura aproximada
        const heightDiff = Math.abs(this.mesh.position.y - position.y);
        if (heightDiff > 0.5) return false;
        
        // Verifica a distância no plano XZ
        const xzDistance = new THREE.Vector2(
            this.mesh.position.x - position.x,
            this.mesh.position.z - position.z
        ).length();
        
        return xzDistance < 0.8; // Aumentado um pouco o raio de colisão
    }
} 