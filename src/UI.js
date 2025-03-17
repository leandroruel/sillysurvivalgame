export class GameUI {
    constructor() {
        this.createGameUI();
        this.createGameOverUI();
        this.createPauseUI();
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
        
        // Cronômetro
        this.timerUI = document.createElement('div');
        this.timerUI.style.marginBottom = '10px';
        this.gameUI.appendChild(this.timerUI);
        
        // Pontuação
        this.scoreUI = document.createElement('div');
        this.scoreUI.style.marginBottom = '10px';
        this.gameUI.appendChild(this.scoreUI);
        
        // PowerUp Ativo
        this.powerUpUI = document.createElement('div');
        this.powerUpUI.style.marginBottom = '10px';
        this.powerUpUI.style.padding = '5px 10px';
        this.powerUpUI.style.backgroundColor = 'rgba(0,0,0,0.5)';
        this.powerUpUI.style.borderRadius = '5px';
        this.powerUpUI.style.display = 'none';
        this.gameUI.appendChild(this.powerUpUI);
        
        // Barra de vida
        this.healthBarContainer = document.createElement('div');
        this.healthBarContainer.style.width = '200px';
        this.healthBarContainer.style.height = '20px';
        this.healthBarContainer.style.backgroundColor = 'rgba(0,0,0,0.5)';
        this.healthBarContainer.style.border = '2px solid white';
        this.healthBarContainer.style.borderRadius = '10px';
        this.healthBarContainer.style.overflow = 'hidden';
        
        this.healthBar = document.createElement('div');
        this.healthBar.style.width = '100%';
        this.healthBar.style.height = '100%';
        this.healthBar.style.backgroundColor = '#4CAF50';
        this.healthBar.style.transition = 'width 0.3s ease-in-out';
        
        this.healthBarContainer.appendChild(this.healthBar);
        this.gameUI.appendChild(this.healthBarContainer);
        
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

    updateGameUI(gameTime, score, playerHealth, powerUpInfo = null) {
        // Atualiza o cronômetro
        const minutes = Math.floor(gameTime / 60000);
        const seconds = Math.floor((gameTime % 60000) / 1000);
        this.timerUI.textContent = `Tempo: ${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        // Atualiza a pontuação
        this.scoreUI.textContent = `Pontuação: ${score}`;
        
        // Atualiza o powerup
        if (powerUpInfo) {
            const timeLeft = Math.ceil((powerUpInfo.endTime - Date.now()) / 1000);
            this.powerUpUI.style.display = 'block';
            this.powerUpUI.style.backgroundColor = `#${powerUpInfo.color.toString(16).padStart(6, '0')}33`;
            this.powerUpUI.style.border = `2px solid #${powerUpInfo.color.toString(16).padStart(6, '0')}`;
            
            let powerUpText = '';
            switch(powerUpInfo.type) {
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
            this.powerUpUI.textContent = powerUpText;
        } else {
            this.powerUpUI.style.display = 'none';
        }
        
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