export class GameUI {
    constructor() {
        // Adiciona estilos personalizados para o slider
        this.addCustomStyles();
        
        // Inicializa variáveis para cálculo de FPS
        this.frames = 0;
        this.lastTime = performance.now();
        this.fps = 0;
        
        this.createGameUI();
        this.createGameOverUI();
        this.createPauseUI();
        this.createSettingsUI();
        
        // Event listener para abrir as configurações com a tecla C
        window.addEventListener('keydown', (e) => {
            if (e.key === 'c' || e.key === 'C') {
                this.toggleSettings();
            }
        });
    }

    addCustomStyles() {
        // Cria um elemento de estilo
        const style = document.createElement('style');
        style.textContent = `
            input[type=range] {
                -webkit-appearance: none;
                width: 100%;
                height: 10px;
                border-radius: 5px;
                background: #444;
                outline: none;
            }
            
            input[type=range]::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background: #4CAF50;
                cursor: pointer;
            }
            
            input[type=range]::-moz-range-thumb {
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background: #4CAF50;
                cursor: pointer;
            }
        `;
        document.head.appendChild(style);
    }

    createGameUI() {
        // Container principal da UI
        this.gameUI = document.createElement('div');
        this.gameUI.style.position = 'fixed';
        this.gameUI.style.top = '20px';
        this.gameUI.style.right = '20px';
        this.gameUI.style.color = 'white';
        this.gameUI.style.fontFamily = 'Arial, sans-serif';
        this.gameUI.style.fontSize = '18px';
        this.gameUI.style.textShadow = '2px 2px 2px rgba(0,0,0,0.5)';
        
        // Contador de FPS
        this.fpsCounter = document.createElement('div');
        this.fpsCounter.style.position = 'fixed';
        this.fpsCounter.style.top = '20px';
        this.fpsCounter.style.left = '20px';
        this.fpsCounter.style.color = 'white';
        this.fpsCounter.style.fontFamily = 'Arial, sans-serif';
        this.fpsCounter.style.fontSize = '18px';
        this.fpsCounter.style.textShadow = '2px 2px 2px rgba(0,0,0,0.5)';
        document.body.appendChild(this.fpsCounter);
        
        // Cronômetro
        this.timerUI = document.createElement('div');
        this.timerUI.style.marginBottom = '10px';
        this.gameUI.appendChild(this.timerUI);
        
        // Pontuação
        this.scoreUI = document.createElement('div');
        this.scoreUI.style.marginBottom = '10px';
        this.gameUI.appendChild(this.scoreUI);
        
        // PowerUps Ativos
        this.powerUpUI = document.createElement('div');
        this.powerUpUI.style.marginBottom = '10px';
        this.powerUpUI.style.padding = '10px';
        this.powerUpUI.style.backgroundColor = 'rgba(0,0,0,0.5)';
        this.powerUpUI.style.borderRadius = '5px';
        this.powerUpUI.style.display = 'none';
        this.powerUpUI.style.maxWidth = '200px';
        this.gameUI.appendChild(this.powerUpUI);
        
        // Barra de vida
        this.healthBarContainer = document.createElement('div');
        this.healthBarContainer.style.width = '200px';
        this.healthBarContainer.style.height = '20px';
        this.healthBarContainer.style.backgroundColor = 'rgba(0,0,0,0.5)';
        this.healthBarContainer.style.border = '2px solid white';
        this.healthBarContainer.style.borderRadius = '10px';
        this.healthBarContainer.style.overflow = 'hidden';
        this.healthBarContainer.style.marginBottom = '10px';
        
        this.healthBar = document.createElement('div');
        this.healthBar.style.width = '100%';
        this.healthBar.style.height = '100%';
        this.healthBar.style.backgroundColor = '#4CAF50';
        this.healthBar.style.transition = 'width 0.3s ease-in-out';
        
        this.healthBarContainer.appendChild(this.healthBar);
        this.gameUI.appendChild(this.healthBarContainer);
        
        // Ícone de configurações
        this.settingsButton = document.createElement('div');
        this.settingsButton.textContent = '⚙️ Configurações (C)';
        this.settingsButton.style.cursor = 'pointer';
        this.settingsButton.style.backgroundColor = 'rgba(0,0,0,0.5)';
        this.settingsButton.style.padding = '5px 10px';
        this.settingsButton.style.borderRadius = '5px';
        this.settingsButton.style.display = 'inline-block';
        this.settingsButton.addEventListener('click', () => this.toggleSettings());
        
        this.gameUI.appendChild(this.settingsButton);
        
        document.body.appendChild(this.gameUI);
    }

    createGameOverUI() {
        // Cria o container da mensagem de game over
        this.gameOverUI = document.createElement('div');
        this.gameOverUI.style.position = 'fixed';
        this.gameOverUI.style.top = '50%';
        this.gameOverUI.style.left = '50%';
        this.gameOverUI.style.transform = 'translate(-50%, -50%)';
        this.gameOverUI.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        this.gameOverUI.style.color = 'white';
        this.gameOverUI.style.padding = '20px';
        this.gameOverUI.style.borderRadius = '10px';
        this.gameOverUI.style.textAlign = 'center';
        this.gameOverUI.style.display = 'none';
        
        // Adiciona o texto de game over
        const gameOverText = document.createElement('h1');
        gameOverText.textContent = 'Game Over';
        gameOverText.style.marginBottom = '20px';
        this.gameOverUI.appendChild(gameOverText);
        
        // Adiciona a mensagem de motivo
        this.gameOverMessage = document.createElement('p');
        this.gameOverMessage.style.marginBottom = '20px';
        this.gameOverUI.appendChild(this.gameOverMessage);
        
        // Adiciona o botão de reiniciar
        const restartButton = document.createElement('button');
        restartButton.textContent = 'Jogar Novamente';
        restartButton.style.padding = '10px 20px';
        restartButton.style.fontSize = '16px';
        restartButton.style.cursor = 'pointer';
        restartButton.style.backgroundColor = '#4CAF50';
        restartButton.style.border = 'none';
        restartButton.style.color = 'white';
        restartButton.style.borderRadius = '5px';
        restartButton.onclick = () => window.location.reload();
        this.gameOverUI.appendChild(restartButton);
        
        document.body.appendChild(this.gameOverUI);
    }

    createPauseUI() {
        // Cria o container da mensagem de pause
        this.pauseUI = document.createElement('div');
        this.pauseUI.style.position = 'fixed';
        this.pauseUI.style.top = '50%';
        this.pauseUI.style.left = '50%';
        this.pauseUI.style.transform = 'translate(-50%, -50%)';
        this.pauseUI.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        this.pauseUI.style.color = 'white';
        this.pauseUI.style.padding = '20px';
        this.pauseUI.style.borderRadius = '10px';
        this.pauseUI.style.textAlign = 'center';
        this.pauseUI.style.display = 'none';
        
        // Adiciona o texto de pause
        const pauseText = document.createElement('h1');
        pauseText.textContent = 'Jogo Pausado';
        pauseText.style.marginBottom = '20px';
        this.pauseUI.appendChild(pauseText);
        
        // Adiciona a instrução
        const instruction = document.createElement('p');
        instruction.textContent = 'Pressione ENTER para continuar';
        instruction.style.marginBottom = '20px';
        this.pauseUI.appendChild(instruction);
        
        document.body.appendChild(this.pauseUI);
    }

    createSettingsUI() {
        // Container das configurações
        this.settingsUI = document.createElement('div');
        this.settingsUI.style.position = 'fixed';
        this.settingsUI.style.top = '50%';
        this.settingsUI.style.left = '50%';
        this.settingsUI.style.transform = 'translate(-50%, -50%)';
        this.settingsUI.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        this.settingsUI.style.color = 'white';
        this.settingsUI.style.padding = '20px';
        this.settingsUI.style.borderRadius = '10px';
        this.settingsUI.style.textAlign = 'center';
        this.settingsUI.style.display = 'none';
        this.settingsUI.style.zIndex = '1000';
        this.settingsUI.style.minWidth = '300px';
        
        // Título das configurações
        const settingsTitle = document.createElement('h2');
        settingsTitle.textContent = 'Configurações';
        settingsTitle.style.marginBottom = '20px';
        this.settingsUI.appendChild(settingsTitle);
        
        // Controle de volume dos efeitos sonoros
        const soundVolumeContainer = document.createElement('div');
        soundVolumeContainer.style.marginBottom = '20px';
        soundVolumeContainer.style.textAlign = 'left';
        
        const soundVolumeLabel = document.createElement('label');
        soundVolumeLabel.textContent = 'Volume de efeitos sonoros: ';
        soundVolumeLabel.setAttribute('for', 'sound-volume');
        soundVolumeContainer.appendChild(soundVolumeLabel);
        
        const soundVolumeValue = document.createElement('span');
        soundVolumeValue.id = 'sound-volume-value';
        soundVolumeValue.style.marginLeft = '10px';
        
        // Recupera o volume atual (se existir) e garante que seja um número válido
        let currentVolume = 50; // Valor padrão
        const savedVolume = localStorage.getItem('soundVolume');
        if (savedVolume !== null && !isNaN(parseInt(savedVolume, 10))) {
            currentVolume = parseInt(savedVolume, 10);
        }
        
        // Atualiza o texto exibido para refletir o valor atual
        soundVolumeValue.textContent = `${currentVolume}%`;
        
        const soundVolumeSlider = document.createElement('input');
        soundVolumeSlider.type = 'range';
        soundVolumeSlider.id = 'sound-volume';
        soundVolumeSlider.min = '0';
        soundVolumeSlider.max = '100';
        soundVolumeSlider.value = String(currentVolume); // Converte explicitamente para string
        soundVolumeSlider.style.width = '100%';
        soundVolumeSlider.style.margin = '10px 0';
        
        soundVolumeSlider.addEventListener('input', (e) => {
            const volume = e.target.value;
            soundVolumeValue.textContent = `${volume}%`;
            this.updateVolume(volume / 100);
        });
        
        soundVolumeContainer.appendChild(document.createElement('br'));
        soundVolumeContainer.appendChild(soundVolumeSlider);
        soundVolumeContainer.appendChild(soundVolumeValue);
        
        this.settingsUI.appendChild(soundVolumeContainer);
        
        // Botão de fechar
        const closeButton = document.createElement('button');
        closeButton.textContent = 'Fechar';
        closeButton.style.padding = '10px 20px';
        closeButton.style.fontSize = '16px';
        closeButton.style.cursor = 'pointer';
        closeButton.style.backgroundColor = '#4CAF50';
        closeButton.style.border = 'none';
        closeButton.style.color = 'white';
        closeButton.style.borderRadius = '5px';
        closeButton.onclick = () => this.toggleSettings(false);
        this.settingsUI.appendChild(closeButton);
        
        document.body.appendChild(this.settingsUI);
        
        // Inicializa o volume com o valor armazenado
        this.updateVolume(currentVolume / 100);
    }

    updateVolume(volume) {
        // Salva o volume no localStorage
        localStorage.setItem('soundVolume', volume * 100);
        
        // Atualiza o volume no AudioManager
        if (window.game && window.game.audioManager) {
            window.game.audioManager.setVolume(volume);
        }
    }

    toggleSettings(show) {
        const isVisible = this.settingsUI.style.display === 'block';
        this.settingsUI.style.display = show !== undefined ? (show ? 'block' : 'none') : (isVisible ? 'none' : 'block');
    }

    updateFPS() {
        this.frames++;
        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastTime;

        if (deltaTime >= 1000) {
            this.fps = Math.round((this.frames * 1000) / deltaTime);
            this.fpsCounter.textContent = `FPS: ${this.fps}`;
            this.frames = 0;
            this.lastTime = currentTime;
        }
    }

    updateGameUI(gameTime, score, playerHealth, powerUpInfo = null, activePowerUps = []) {
        // Atualiza o FPS
        this.updateFPS();

        // Atualiza o cronômetro
        const minutes = Math.floor(gameTime / 60000);
        const seconds = Math.floor((gameTime % 60000) / 1000);
        this.timerUI.textContent = `Tempo: ${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        // Atualiza a pontuação
        this.scoreUI.textContent = `Pontuação: ${score}`;
        
        // Limpa qualquer UI de powerup existente
        while (this.powerUpUI.firstChild) {
            this.powerUpUI.removeChild(this.powerUpUI.firstChild);
        }
        
        // Se não há powerups ativos, oculta o container
        if (!activePowerUps || activePowerUps.length === 0) {
            this.powerUpUI.style.display = 'none';
            return;
        }
        
        // Exibe o container de powerups
        this.powerUpUI.style.display = 'block';
        this.powerUpUI.style.padding = '10px';
        
        // Para cada powerup ativo, cria uma entrada na UI
        activePowerUps.forEach(powerUp => {
            // Verifica se o powerup ainda está ativo
            if (!powerUp.isActive) return;
            
            const timeLeft = Math.ceil((powerUp.endTime - Date.now()) / 1000);
            if (timeLeft <= 0) return; // Ignora powerups expirados
            
            const powerUpElement = document.createElement('div');
            powerUpElement.style.marginBottom = '5px';
            powerUpElement.style.padding = '5px 10px';
            powerUpElement.style.backgroundColor = `#${powerUp.color.toString(16).padStart(6, '0')}33`;
            powerUpElement.style.border = `2px solid #${powerUp.color.toString(16).padStart(6, '0')}`;
            powerUpElement.style.borderRadius = '5px';
            
            let powerUpText = '';
            switch(powerUp.type) {
                case 'gatling':
                    powerUpText = `GATLING GUN (${timeLeft}s)`;
                    break;
                case 'ak47':
                    powerUpText = `AK-47 (${timeLeft}s)`;
                    break;
                case 'bazooka':
                    powerUpText = `BAZOOKA (${timeLeft}s)`;
                    break;
                case 'grenade':
                    powerUpText = `GRANADA (${timeLeft}s)`;
                    break;
                case 'squad':
                    powerUpText = `SQUAD (${timeLeft}s)`;
                    break;
            }
            powerUpElement.textContent = powerUpText;
            
            // Adiciona o elemento ao container
            this.powerUpUI.appendChild(powerUpElement);
        });
        
        // Atualiza a barra de vida
        if (playerHealth !== undefined) {
            const healthPercentage = (playerHealth / 100) * 100;
            this.healthBar.style.width = `${healthPercentage}%`;
            
            // Muda a cor da barra de vida baseado na porcentagem
            if (healthPercentage > 60) {
                this.healthBar.style.backgroundColor = '#4CAF50'; // Verde
            } else if (healthPercentage > 30) {
                this.healthBar.style.backgroundColor = '#FFA500'; // Laranja
            } else {
                this.healthBar.style.backgroundColor = '#FF0000'; // Vermelho
            }
        }
    }

    showGameOver(message) {
        this.gameOverMessage.textContent = message;
        this.gameOverUI.style.display = 'block';
    }

    togglePause(isPaused) {
        this.pauseUI.style.display = isPaused ? 'block' : 'none';
    }
} 