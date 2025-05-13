let playerBoard = [];
let enemyBoard = [];
let boardSize = 8;
let cellSize = 40;
let playerShips = 0;
let enemyShips = 0;
let gameMode = '';
let isPlayerTurn = true;
let placingShips = false;
let shipsToPlace = 0;
let shipsPlaced = 0;

function setup() {
    createCanvas(800, 400).parent('game-container');
    textAlign(CENTER, CENTER);
    
    // Configurar listeners de botones
    document.getElementById('btn-rapido').addEventListener('click', startQuickGame);
    document.getElementById('btn-manual').addEventListener('click', showManualConfig);
    document.getElementById('btn-start-manual').addEventListener('click', startManualPlacement);
    
    // Inicializar tableros
    initializeBoards();
    drawBoards();
}

function initializeBoards() {
    playerBoard = createEmptyBoard();
    enemyBoard = createEmptyBoard();
}

function createEmptyBoard() {
    let board = [];
    for (let i = 0; i < boardSize; i++) {
        board[i] = [];
        for (let j = 0; j < boardSize; j++) {
            board[i][j] = '-'; // -: agua, O: barco, X: fallo, !: impacto
        }
    }
    return board;
}

function drawBoards() {
    clear();
    background(240);
    
    // Dibujar tablero del jugador
    drawBoard(playerBoard, 0, 0, false);
    
    // Dibujar tablero enemigo
    drawBoard(enemyBoard, width/2, 0, true);
}

function drawBoard(board, x, y, isEnemy) {
    push();
    translate(x, y);
    
    // Dibujar celdas
    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            // Dibujar celda
            stroke(0);
            fill(255);
            rect(j * cellSize, i * cellSize, cellSize, cellSize);
            
            // Dibujar contenido
            let content = board[i][j];
            if (isEnemy && content === 'O') content = '-'; // Ocultar barcos enemigos
            
            fill(0);
            if (content === 'O') fill(0, 0, 255); // Barco (azul)
            else if (content === 'X') fill(150);    // Fallo (gris)
            else if (content === '!') fill(255, 0, 0); // Impacto (rojo)
            
            text(content, j * cellSize + cellSize/2, i * cellSize + cellSize/2);
        }
    }
    
    // Dibujar coordenadas
    fill(0);
    textSize(12);
    for (let i = 0; i < boardSize; i++) {
        text(i, i * cellSize + cellSize/2, -10); // Columnas arriba
        text(i, -15, i * cellSize + cellSize/2); // Filas a la izquierda
    }
    
    pop();
}

function startQuickGame() {
    gameMode = 'quick';
    initializeBoards();
    
    // Colocar barcos aleatorios (3-5 para cada jugador)
    playerShips = Math.floor(random(3, 6));
    enemyShips = playerShips;
    
    placeRandomShips(playerBoard, playerShips);
    placeRandomShips(enemyBoard, enemyShips);
    
    updateStatus(`Modo Rápido - ${playerShips} barcos cada uno. Tu turno!`);
    updateShipCount();
    isPlayerTurn = true;
    placingShips = false;
    
    drawBoards();
}

function showManualConfig() {
    gameMode = 'manual';
    initializeBoards();
    document.getElementById('manual-placement').style.display = 'block';
    updateStatus("Configura tu flota - Elige cuántos barcos deseas");
    drawBoards();
}

function startManualPlacement() {
    shipsToPlace = parseInt(document.getElementById('ship-amount').value);
    if (shipsToPlace < 3 || shipsToPlace > 10) {
        alert("Por favor elige entre 3 y 10 barcos");
        return;
    }
    
    playerShips = shipsToPlace;
    enemyShips = shipsToPlace;
    shipsPlaced = 0;
    placingShips = true;
    
    // Colocar barcos enemigos aleatoriamente
    placeRandomShips(enemyBoard, enemyShips);
    
    document.getElementById('manual-placement').style.display = 'none';
    updateStatus(`Coloca tus ${shipsToPlace} barcos. Haz clic en tu tablero.`);
    updateShipCount();
    drawBoards();
}

function placeRandomShips(board, count) {
    let placed = 0;
    while (placed < count) {
        let x = floor(random(boardSize));
        let y = floor(random(boardSize));
        
        if (board[y][x] === '-') {
            board[y][x] = 'O';
            placed++;
        }
    }
}

function mousePressed() {
    if (!gameMode) return;
    
    // Modo manual: colocación de barcos
    if (placingShips) {
        // Verificar clic en tablero del jugador (mitad izquierda)
        if (mouseX > 0 && mouseX < width/2 && mouseY > 0 && mouseY < height) {
            let col = floor(mouseX / cellSize);
            let row = floor(mouseY / cellSize);
            
            if (playerBoard[row][col] === '-') {
                playerBoard[row][col] = 'O';
                shipsPlaced++;
                
                updateShipCount();
                
                if (shipsPlaced >= shipsToPlace) {
                    placingShips = false;
                    isPlayerTurn = true;
                    updateStatus("Todos los barcos colocados. Tu turno!");
                } else {
                    updateStatus(`Coloca tus barcos (${shipsToPlace - shipsPlaced} restantes)`);
                }
                
                drawBoards();
            }
        }
        return;
    }
    
    // Turno del jugador: ataque al tablero enemigo
    if (isPlayerTurn && !placingShips) {
        // Verificar clic en tablero enemigo (mitad derecha)
        if (mouseX > width/2 && mouseX < width && mouseY > 0 && mouseY < height) {
            let col = floor((mouseX - width/2) / cellSize);
            let row = floor(mouseY / cellSize);
            
            if (enemyBoard[row][col] === 'O') {
                enemyBoard[row][col] = '!';
                enemyShips--;
                updateStatus("¡Impacto! Has hundido un barco enemigo.");
            } else if (enemyBoard[row][col] === '-') {
                enemyBoard[row][col] = 'X';
                updateStatus("Agua... no hay barco en esa posición.");
            }
            
            isPlayerTurn = false;
            updateShipCount();
            drawBoards();
            
            // Verificar si el jugador ganó
            if (enemyShips <= 0) {
                updateStatus("¡Felicidades! Has ganado el juego.");
                return;
            }
            
            // Turno de la IA después de un breve retraso
            setTimeout(aiTurn, 1000);
        }
    }
}

function aiTurn() {
    // Ataque aleatorio de la IA
    let x, y;
    do {
        x = floor(random(boardSize));
        y = floor(random(boardSize));
    } while (playerBoard[y][x] === 'X' || playerBoard[y][x] === '!');
    
    if (playerBoard[y][x] === 'O') {
        playerBoard[y][x] = '!';
        playerShips--;
        updateStatus("La IA ha impactado uno de tus barcos!");
    } else {
        playerBoard[y][x] = 'X';
        updateStatus("La IA ha atacado y falló. Tu turno!");
    }
    
    isPlayerTurn = true;
    updateShipCount();
    drawBoards();
    
    // Verificar si la IA ganó
    if (playerShips <= 0) {
        updateStatus("¡La IA ha ganado! Mejor suerte la próxima vez.");
    }
}

function updateStatus(message) {
    document.getElementById('status').textContent = message;
}

function updateShipCount() {
    document.getElementById('ship-count').textContent = 
        `Tus barcos: ${playerShips} | Barcos enemigos: ${enemyShips}`;
}
