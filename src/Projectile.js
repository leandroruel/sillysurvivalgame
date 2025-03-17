import * as THREE from 'three';

export class Projectile {
    constructor(scene, position, damage, spread = 0) {
        this.scene = scene;
        this.damage = damage;
        this.speed = 0.3;
        this.isActive = true;
        
        // Cria o modelo do projétil
        const geometry = new THREE.SphereGeometry(0.1, 8, 8);
        const material = new THREE.MeshPhongMaterial({
            color: 0xffff00,
            emissive: 0xffff00,
            emissiveIntensity: 0.5
        });
        this.mesh = new THREE.Mesh(geometry, material);
        
        // Define a posição inicial
        this.mesh.position.copy(position);
        
        // Aplica o ângulo de dispersão
        this.direction = new THREE.Vector3(Math.sin(spread), 0, -1).normalize();
        
        this.scene.add(this.mesh);
    }
    
    update() {
        if (!this.isActive) return;
        
        // Move o projétil na direção calculada
        this.mesh.position.x += this.direction.x * this.speed;
        this.mesh.position.z += this.direction.z * this.speed;
        
        // Remove o projétil se sair da tela
        if (this.mesh.position.z < -10) {
            this.destroy();
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
} 