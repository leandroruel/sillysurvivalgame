import * as THREE from 'three';

export class AudioManager {
    static instance = null;
    
    static getInstance() {
        if (!AudioManager.instance) {
            AudioManager.instance = new AudioManager();
        }
        return AudioManager.instance;
    }
    
    constructor() {
        if (AudioManager.instance) {
            return AudioManager.instance;
        }
        
        // Cria o listener de áudio
        this.listener = new THREE.AudioListener();
        
        // Pool de sons para reutilização
        this.soundPool = {
            shot: [],
            powerup: []
        };
        
        // Controle de carregamento
        this.loaded = false;
        this.loadPromises = [];
        
        // Carrega os sons
        this.loadPromises.push(this.loadSoundPool('shot', 'assets/sound-effects/shot-rifle-39.mp3', 5));
        this.loadPromises.push(this.loadSoundPool('powerup', 'assets/sound-effects/game-powerup.mp3', 2));
        
        // Aguarda todos os sons carregarem
        Promise.all(this.loadPromises).then(() => {
            console.log('Todos os sons foram carregados!');
            this.loaded = true;
            
            // Testa um som após carregar
            this.playShot();
        });
        
        AudioManager.instance = this;
    }
    
    loadSoundPool(type, path, count) {
        return new Promise((resolve) => {
            const audioLoader = new THREE.AudioLoader();
            let loadedCount = 0;
            
            audioLoader.load(path, (buffer) => {
                for (let i = 0; i < count; i++) {
                    const sound = new THREE.Audio(this.listener);
                    sound.setBuffer(buffer);
                    sound.setVolume(0.3);
                    
                    const soundItem = {
                        sound,
                        isPlaying: false
                    };
                    
                    // Configura o callback de fim corretamente
                    sound.onEnded = () => {
                        soundItem.isPlaying = false;
                        console.log(`Som ${type} terminou de tocar`);
                    };
                    
                    this.soundPool[type].push(soundItem);
                    loadedCount++;
                    
                    if (loadedCount === count) {
                        console.log(`Pool de sons ${type} carregado com ${count} sons`);
                        resolve();
                    }
                }
            });
        });
    }
    
    playSound(type) {
        if (!this.loaded) {
            console.log('Sons ainda não carregados...');
            return;
        }
        
        // Tenta encontrar um som que não esteja tocando
        let soundItem = this.soundPool[type].find(s => !s.sound.isPlaying);
        
        // Se não encontrar, pega o primeiro som e força a reprodução
        if (!soundItem) {
            soundItem = this.soundPool[type][0];
            if (soundItem.sound.isPlaying) {
                console.log(`Interrompendo som: ${type}`);
                soundItem.sound.stop();
            }
        }
        
        if (soundItem) {
            try {
                soundItem.isPlaying = true;
                soundItem.sound.play();
                console.log(`Tocando som: ${type}`);
            } catch (error) {
                console.error('Erro ao tocar som:', error);
                soundItem.isPlaying = false;
            }
        } else {
            console.warn(`Nenhum som disponível para ${type}`);
        }
    }
    
    playShot() {
        this.playSound('shot');
    }
    
    playPowerup() {
        this.playSound('powerup');
    }
    
    getListener() {
        return this.listener;
    }
    
    stopAllSounds() {
        if (!this.loaded) return;
        
        // Para todos os sons de tiro
        this.soundPool.shot.forEach(item => {
            if (item.sound.isPlaying) {
                item.sound.stop();
                item.isPlaying = false;
            }
        });
        
        // Para todos os sons de powerup
        this.soundPool.powerup.forEach(item => {
            if (item.sound.isPlaying) {
                item.sound.stop();
                item.isPlaying = false;
            }
        });
        
        console.log('Todos os sons foram parados');
    }
    
    setVolume(volume) {
        if (!this.loaded) return;
        
        // Ajusta o volume para todos os sons no pool
        Object.keys(this.soundPool).forEach(type => {
            this.soundPool[type].forEach(item => {
                item.sound.setVolume(volume);
            });
        });
        
        console.log(`Volume ajustado para: ${volume * 100}%`);
    }
} 