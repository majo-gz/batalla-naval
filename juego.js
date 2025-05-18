// Variables globales
const gameConfig = {
  boardSize: 8,
  cellSize: 40,
  playerShips: 0,
  enemyShips: 0,
  gameMode: '',
  isPlayerTurn: true,
  placingShips: false,
  shipsToPlace: 0,
  shipsPlaced: 0,
  remainingShips: [],
  doubleShot: false,
  blinkEffect: {},
  lastBlinkCleanup: 0,
  inventory: []
};

// Efectos de sonido
const sounds = {
  background: null,
  victory: null,
  defeat: null,
  playerHit: null,
  enemyHit: null,
  water: null,
  placeShip: null,
  isMusicPlaying: false
};

function preload() {
  sounds.background = loadSound('sonidos/musicaFondo.mp3');
  sounds.victory = loadSound('sonidos/victoria.mp3');
  sounds.defeat = loadSound('sonidos/derrota.mp3');
  sounds.playerHit = loadSound('sonidos/impactoJugador.mp3');
  sounds.enemyHit = loadSound('sonidos/impactoIA.mp3');
  sounds.water = loadSound('sonidos/agua.mp3');
  sounds.placeShip = loadSound('sonidos/colocarBarco.mp3');
}

function setup() {
  createCanvas(800, 400).parent('game-container');
  textAlign(CENTER, CENTER);
  
  setupEventListeners();
  initializeBoards();
  drawBoards();
  
  userStartAudio();
  frameRate(30);
}

function setupEventListeners() {
  document.getElementById('btn-rapido').addEventListener('click', startQuickGame);
  document.getElementById('btn-manual').addEventListener('click', showManualConfig);
  document.getElementById('btn-start-manual').addEventListener('click', startManualPlacement);
}

function initializeBoards() {
  gameConfig.playerBoard = createEmptyBoard();
  gameConfig.enemyBoard = createEmptyBoard();
}

function createEmptyBoard() {
  return Array(gameConfig.boardSize).fill().map(() => 
    Array(gameConfig.boardSize).fill('-')
  );
}

function drawBoards() {
  clear();

  drawBoard(gameConfig.playerBoard, 0, 0, false);
  drawBoard(gameConfig.enemyBoard, 480, 0, true);
}

function showScreen(id) {
  document.querySelectorAll('.pantalla').forEach(div => div.classList.add('oculto'));
  document.getElementById(id).classList.remove('oculto');
}

function drawBoard(board, x, y, isEnemy) {
  push();
  translate(x, y);
  
  for (let i = 0; i < gameConfig.boardSize; i++) {
    for (let j = 0; j < gameConfig.boardSize; j++) {
      let content = isEnemy && board[i][j] === 'O' ? '-' : board[i][j];
      setCellColor(content, i, j);
      
      stroke(0);
      rect(j * gameConfig.cellSize, i * gameConfig.cellSize, 
           gameConfig.cellSize, gameConfig.cellSize);
    }
  }
  
  pop();
}

function setCellColor(content, row, col) {
  const colors = {
    '-': '#F4F4F4',
    'O': '#87CEFA',
    'X': '#A9A9A9',
    'R': '#FFFF66',
    '!': '#E64832'
  };
  
  fill(colors[content] || '#F4F4F4');
}


function drawCoordinates() {
  fill(0);
  textSize(12);
  for (let i = 0; i < gameConfig.boardSize; i++) {
    text(i, i * gameConfig.cellSize + gameConfig.cellSize/2, -10);
    text(i, -15, i * gameConfig.cellSize + gameConfig.cellSize/2);
  }
}

function startQuickGame() {
  initGame('quick', Math.floor(random(3, 6)));
}

function showManualConfig() {
  gameConfig.gameMode = 'manual';
  initializeBoards();
  document.getElementById('manual-placement').style.display = 'block';
  updateStatus("Configura tu flota - Elige cuántos barcos deseas");
  drawBoards();
}

function startManualPlacement() {
  const ships = parseInt(document.getElementById('ship-amount').value);
  if (ships < 3 || ships > 10) {
    alert("Por favor elige entre 3 y 10 barcos");
    return;
  }
  
  initGame('manual', ships);
  gameConfig.placingShips = true;
  gameConfig.shipsPlaced = 0;
  document.getElementById('manual-placement').style.display = 'none';
  updateStatus(`Coloca tus ${ships} barcos. Haz clic en tu tablero.`);
}

function initGame(mode, shipCount) {
  gameConfig.gameMode = mode;
  initializeBoards();
  
  gameConfig.playerShips = shipCount;
  gameConfig.enemyShips = shipCount;
  
  placeRandomShips(gameConfig.playerBoard, gameConfig.playerShips);
  placeRandomShips(gameConfig.enemyBoard, gameConfig.enemyShips);
  
  initRemainingShips(gameConfig.enemyShips);
  updateShipCount();
  gameConfig.isPlayerTurn = true;
  
  startBackgroundMusic();
  drawBoards();
  showScreen('pantalla-juego');
}

function initRemainingShips(count) {
  gameConfig.remainingShips = Array(count).fill().map(() => ({ size: 1 }));
}

function placeRandomShips(board, count) {
  let placed = 0;
  while (placed < count) {
    const x = floor(random(gameConfig.boardSize));
    const y = floor(random(gameConfig.boardSize));
    
    if (board[y][x] === '-') {
      board[y][x] = 'O';
      placed++;
    }
  }
}

function markHit(row, col) {
  gameConfig.blinkEffect[`${row},${col}`] = frameCount;
}

function mousePressed() {
  if (!gameConfig.gameMode) return;
  
  const canvasX = mouseX;
  const canvasY = mouseY;
  
  if (canvasX < 0 || canvasY < 0 || canvasX > width || canvasY > height) return;
  
  if (gameConfig.placingShips) {
    handleShipPlacement(canvasX, canvasY);
    return;
  }
  
  if (gameConfig.isPlayerTurn && canvasX > 480) {
    handlePlayerAttack(canvasX, canvasY);
  }
}

function handleShipPlacement(canvasX, canvasY) {
  if (canvasX < 480) {
    const col = floor(canvasX / gameConfig.cellSize);
    const row = floor(canvasY / gameConfig.cellSize);
    
    if (isValidCell(row, col) && gameConfig.playerBoard[row][col] === '-') {
      gameConfig.playerBoard[row][col] = 'O';
      gameConfig.shipsPlaced++;
      
      playSound(sounds.placeShip);
      updateShipCount();
      
      if (gameConfig.shipsPlaced >= gameConfig.shipsToPlace) {
        gameConfig.placingShips = false;
        updateStatus("Todos los barcos colocados. Tu turno!");
      } else {
        updateStatus(`Coloca tus barcos (${gameConfig.shipsToPlace - gameConfig.shipsPlaced} restantes)`);
      }
      
      drawBoards();
    }
  }
}

function handlePlayerAttack(canvasX, canvasY) {
  const col = floor((canvasX - 480) / gameConfig.cellSize);
  const row = floor(canvasY / gameConfig.cellSize);
  
  if (!isValidCell(row, col)) return;
  
  const cellValue = gameConfig.enemyBoard[row][col];
  
  if (cellValue === 'O' || cellValue === 'R') {
    gameConfig.enemyBoard[row][col] = '!';
    markHit(row, col);
    gameConfig.enemyShips--;
    updateStatus("¡Impacto! Has hundido un barco enemigo.");
    playSound(sounds.playerHit);
  } else if (cellValue === '-') {
    gameConfig.enemyBoard[row][col] = 'X';
    updateStatus("Agua... no hay barco en esa posición.");
    playSound(sounds.water);
  } else {
    return;
  }
  
  checkGameEnd('enemy');
  
  if (gameConfig.doubleShot) {
    gameConfig.doubleShot = false;
    updateStatus("¡Disparo doble activado! Puedes disparar una vez más.");
  } else {
    gameConfig.isPlayerTurn = false;
    drawBoards();
    setTimeout(aiTurn, 1000);
  }
  
  updateShipCount();
  drawBoards();
}

function isValidCell(row, col) {
  return row >= 0 && row < gameConfig.boardSize && 
         col >= 0 && col < gameConfig.boardSize;
}

function aiTurn() {
  let x, y;
  do {
    x = floor(random(gameConfig.boardSize));
    y = floor(random(gameConfig.boardSize));
  } while (['X', '!'].includes(gameConfig.playerBoard[y][x]));
  
  if (gameConfig.playerBoard[y][x] === 'O') {
    gameConfig.playerBoard[y][x] = '!';
    markHit(y, x);
    gameConfig.playerShips--;
    updateStatus("La IA ha impactado uno de tus barcos!");
    playSound(sounds.enemyHit);
  } else {
    gameConfig.playerBoard[y][x] = 'X';
    updateStatus("La IA ha atacado y falló. Tu turno!");
    playSound(sounds.water);
  }
  
  updateShipCount();
  drawBoards();
  
  checkGameEnd('player');
  startPlayerTurn();
}

function checkGameEnd(loser) {
  const shipsLeft = loser === 'player' ? gameConfig.playerShips : gameConfig.enemyShips;
  
  if (shipsLeft <= 0) {
    const isVictory = loser === 'enemy';
    updateStatus(isVictory ? "¡Felicidades! Has ganado el juego." : 
                  "¡La IA ha ganado! Mejor suerte la próxima vez.");
    
    stopBackgroundMusic();
    playSound(isVictory ? sounds.victory : sounds.defeat);
    
    showScreen(isVictory ? 'pantalla-victoria' : 'pantalla-derrota');
  }
}

function startPlayerTurn() {
  gameConfig.isPlayerTurn = true;
  tryGetItem();
  updateStatus("¡Tu turno!");
}

function tryGetItem() {
  console.log("Sorteando ítem...");
  if (Math.random() < 0.3) {
    const items = ['radar', 'doble', 'revelar'];
    const item = items[Math.floor(Math.random() * items.length)];
    gameConfig.inventory.push(item);
    console.log(`Item obtenido: ${item}`);
    showMessage(`¡Has obtenido un ítem: ${getItemName(item)}!`);
    updateInventoryUI();
  }
}

function updateStatus(message) {
  document.getElementById('status').textContent = message;
}

function updateShipCount() {
  document.getElementById('ship-count').textContent = 
    `Tus barcos: ${gameConfig.playerShips} | Barcos enemigos: ${gameConfig.enemyShips}`;
}

function startBackgroundMusic() {
  if (!sounds.isMusicPlaying && sounds.background) {
    try {
      sounds.background.setVolume(0.3);
      sounds.background.loop();
      sounds.isMusicPlaying = true;
    } catch (e) {
      console.error("Error al iniciar música:", e);
    }
  }
}

function stopBackgroundMusic() {
  if (sounds.background && sounds.background.isPlaying()) {
    sounds.background.stop();
    sounds.isMusicPlaying = false;
  }
}

function playSound(sound) {
  if (sound) {
    try {
      sound.play();
    } catch (e) {
      console.error("Error al reproducir sonido:", e);
    }
  }
}

function draw() {
  cleanOldBlinks();
  drawBoards();
}

function showMessage(text) {
  const status = document.getElementById('status');
  if (!status) return;
  
  status.textContent = text;

  setTimeout(() => {
    updateStatus(gameConfig.isPlayerTurn ? "Tu turno" : "Turno de la IA");
  }, 3000);
}

function resetGame() {
  stopBackgroundMusic();
  showScreen('pantalla-inicio');
  initializeBoards();
  updateStatus("Esperando...");
  updateShipCount();

  gameConfig.inventory = [];
  gameConfig.doubleShot = false;
  updateInventoryUI();
}

function getItemName(code) {
  const names = {
    'radar': 'Radar',
    'doble': 'Disparo Doble',
    'revelar': 'Revelar Posición'
  };
  return names[code] || 'Ítem';
}

function updateInventoryUI() {
  const container = document.getElementById('inventario-items');
  if (!container) return;
  
  container.innerHTML = '';
  
  gameConfig.inventory.forEach(item => {
    const itemEl = document.createElement('div');
    itemEl.className = 'item-inventario';
    itemEl.innerHTML = `
      <div class="item-icono">${getItemIcon(item)}</div>
      <div class="item-info">
        <div class="item-nombre">${getItemName(item)}</div>
      </div>
    `;
    itemEl.title = getItemDescription(item);
    
    itemEl.addEventListener('click', () => {
      if (gameConfig.isPlayerTurn && gameConfig.gameMode) {
        useItem(item);
      }
    });
    
    container.appendChild(itemEl);
  });
}

function getItemIcon(code) {
  const icons = {
    'radar': '🔍',
    'doble': '💥',
    'revelar': '👁️'
  };
  return icons[code] || '❓';
}

function getItemDescription(code) {
  const descs = {
    'radar': 'Revela un barco enemigo',
    'doble': 'Permite disparar dos veces',
    'revelar': 'Muestra una posición enemiga'
  };
  return descs[code] || 'Ítem misterioso';
}

function useItem(item) {
  let used = false;
  
  switch(item) {
    case 'radar':
      used = revealRandomShip();
      break;
    case 'doble':
      gameConfig.doubleShot = true;
      updateStatus("¡Activado doble disparo!");
      used = true;
      break;
    case 'revelar':
      used = revealRandomPosition();
      break;
    default:
      updateStatus("Item desconocido.");
  }
  
  if (used) {
    const index = gameConfig.inventory.indexOf(item);
    if (index > -1) {
      gameConfig.inventory.splice(index, 1);
    }
    updateInventoryUI();
  }
}

function revealRandomShip() {
  const hiddenShips = [];
  
  for (let i = 0; i < gameConfig.boardSize; i++) {
    for (let j = 0; j < gameConfig.boardSize; j++) {
      if (gameConfig.enemyBoard[i][j] === 'O') {
        hiddenShips.push({row: i, col: j});
      }
    }
  }
  
  if (hiddenShips.length > 0) {
    const ship = hiddenShips[floor(random(hiddenShips.length))];
    gameConfig.enemyBoard[ship.row][ship.col] = 'R';
    
    updateStatus("¡Radar activado! Se ha revelado un barco enemigo.");
    drawBoards();
    return true;
  }
  
  updateStatus("No hay barcos enemigos para revelar.");
  return false;
}

function useRadar() {
  let revelados = 0;
  for (let i = 0; i < gameConfig.boardSize; i++) {
    for (let j = 0; j < gameConfig.boardSize; j++) {
      if (gameConfig.enemyBoard[i][j] === 'O' && random() > 0.7) { // 30% de chance por celda
        gameConfig.enemyBoard[i][j] = 'R';
        markHit(i, j);
        revelados++;
      }
    }
  }
  updateStatus(revelados > 0 ? `Radar reveló ${revelados} barcos!` : "No se encontraron barcos");
}