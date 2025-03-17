import * as THREE from 'three';
import { PowerUp } from './PowerUp';

export class Enemy {
    constructor(scene, type = 'normal', onGameOver) {
        this.scene = scene;
        this.type = type;
        this.isActive = true;
        this.hasPowerUp = type === 'powerup';
        this.onGameOver = onGameOver;
        
        // Referência ao jogo para adicionar powerups
        this.game = scene.userData.game;
        
        // Define as características baseadas no tipo
        switch(type) {
            case 'boss':
                this.health = 800;
                this.damage = 50;
                this.speed = 0.02;
                this.size = 1.2;
                this.color = 0xff0000;
                break;
            case 'powerup':
                this.health = 50;
                this.damage = 10;
                this.speed = 0.015;
                this.size = 0.8;
                this.color = 0xff00ff;
                break;
            default: // normal
                this.health = 20;
                this.damage = 5;
                this.speed = 0.02;
                this.size = 0.6;
                this.color = 0xff4444;
        }
        
        // Cria o modelo do inimigo
        const geometry = new THREE.BoxGeometry(this.size, this.size, this.size);
        const material = new THREE.MeshPhongMaterial({ color: this.color });
        this.mesh = new THREE.Mesh(geometry, material);
        
        // Posição inicial aleatória no topo da tela
        this.mesh.position.set(
            (Math.random() - 0.5) * 5, // x entre -2.5 e 2.5
            this.size / 2 + 0.2,       // y acima da ponte
            -9                         // z no topo da tela
        );
        
        this.mesh.castShadow = true;
        this.scene.add(this.mesh);
    }
    
    update() {
        if (!this.isActive) return;
        
        // Move o inimigo para baixo
        this.mesh.position.z += this.speed;
        
        // Chama game over se o inimigo atravessar a ponte
        if (this.mesh.position.z > 9) {
            if (this.onGameOver) {
                this.onGameOver('Um inimigo atravessou a ponte!');
            }
            this.destroy();
            return;
        }
    }
    
    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            if (this.hasPowerUp) {
                this.dropPowerUp();
            }
            this.destroy();
        }
    }
    
    dropPowerUp() {
        const powerUpTypes = ['gatling', 'ak47', 'bazooka', 'grenade', 'squad'];
        const randomType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
        const powerUp = new PowerUp(this.scene, randomType, this.mesh.position.clone());
        
        // Adiciona o powerup à lista de powerups do jogo
        if (this.scene.userData.game) {
            this.scene.userData.game.powerUps.push(powerUp);
            console.log('PowerUp dropado:', randomType);
        }
    }
    
    destroy() {
        if (!this.isActive) return;
        
        this.isActive = false;
        this.scene.remove(this.mesh);
        this.mesh.geometry.dispose();
        this.mesh.material.dispose();
    }
    
    getPosition() {
        return this.mesh.position;
    }
    
    checkCollision(position) {
        const distance = this.mesh.position.distanceTo(position);
        return distance < this.size;
    }
} 