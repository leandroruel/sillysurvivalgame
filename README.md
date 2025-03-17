# Survival Game

Um jogo de sobrevivência em 3D onde você defende uma ponte contra hordas de inimigos.

## Como Jogar

- Use as teclas A/D ou Setas Esquerda/Direita para mover o jogador
- O jogador atira automaticamente
- Derrote inimigos para ganhar pontos
- Alguns inimigos dropam powerups quando derrotados
- Sobreviva o máximo que puder!

## Powerups

- **Gatling Gun**: Atira 30 balas a cada 0.5 segundos (dura 2 minutos)
- **AK-47**: Atira 10 balas a cada 0.5 segundos (dura 4 minutos)
- **Bazooka**: Tiro com área de dano de 2 quadrados (dura 2 minutos)
- **Lançador de Granadas**: Tiro com área de dano de 1 quadrado (dura 2 minutos)
- **Squad**: Adiciona 5 soldados ao seu esquadrão (dura 5 minutos)

## Inimigos

- **Soldado Normal**: 20 de vida, causa 5 de dano
- **Inimigo com Powerup**: 50 de vida, causa 10 de dano, dropa powerup quando derrotado
- **Boss**: 200 de vida, causa 50 de dano, movimento mais lento

## Mecânicas

- Ondas de inimigos a cada 5 segundos
- A quantidade de inimigos aumenta a cada 2 minutos
- O primeiro boss aparece após 8 minutos
- O jogador começa com 100 de vida
- Cada tiro causa 10 de dano

## Instalação

1. Clone o repositório
2. Instale as dependências:
```bash
npm install
```

3. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

4. Abra o navegador em `http://localhost:5173`

## Tecnologias Utilizadas

- Three.js para renderização 3D
- Vite como bundler e servidor de desenvolvimento 