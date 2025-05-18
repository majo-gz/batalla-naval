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
  predictionTurns: 0,
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

let loadingComplete = false;
let assetsLoaded = 0;
let totalAssets = 7;
function preload() {
  document.getElementById('loading-text').textContent = "Cargando sonidos...";
  
  // Load each sound with progress tracking
  sounds.background = loadSound('assets/sounds/musicaFondo.mp3', () => updateProgress(1), loadingError);
  sounds.victory = loadSound('assets/sounds/victoria.mp3', () => updateProgress(2), loadingError);
  sounds.defeat = loadSound('assets/sounds/derrota.mp3', () => updateProgress(3), loadingError);
  sounds.playerHit = loadSound('assets/sounds/impactoJugador.mp3', () => updateProgress(4), loadingError);
  sounds.enemyHit = loadSound('assets/sounds/impactoIA.mp3', () => updateProgress(5), loadingError);
  sounds.water = loadSound('assets/sounds/agua.mp3', () => updateProgress(6), loadingError);
  sounds.placeShip = loadSound('assets/sounds/colocarBarco.mp3', () => updateProgress(7), loadingError);
}

function updateProgress(assetNumber) {
    assetsLoaded++;
  document.getElementById('loading-progress').style.width = `${(assetsLoaded/totalAssets)*100}%`;
  //document.getElementById('loading-text').textContent = 
    //`Cargando... (${assetsLoaded}/${totalAssets}) ${assetNames[assetNumber-1]}`;
  
  if (assetsLoaded === totalAssets) {
    document.getElementById('loading-text').textContent = "¡Juego listo!";
    setTimeout(() => {
      document.getElementById('loading-screen').style.display = 'none';
      // Directly initialize what we need here
      userStartAudio(); // Activate audio system
      showScreen('pantalla-inicio'); // Show main menu
    }, 500);
  }
}

function loadingError(err) {
  console.error("Error loading sound:", err);
  assetsLoaded++; // Count failed assets too
  updateProgress(0); // Update progress without specific asset name
}

// Remove board initialization from setup()
function setup() {
  // Essential p5.js setup (must run immediately)
  createCanvas(800, 400).parent('game-container');
  textAlign(CENTER, CENTER);
  frameRate(30);
  
  // Setup event listeners (can run immediately)
  setupEventListeners();
  
  // Handle both loading scenarios:
  if (loadingComplete) {
    // Assets already loaded - start audio and show menu
    userStartAudio();
    showScreen('pantalla-inicio');
  } else {
    // Assets still loading - set up polling
    const loadingCheck = setInterval(() => {
      if (loadingComplete) {
        clearInterval(loadingCheck);
        userStartAudio();
        showScreen('pantalla-inicio');
      }
    }, 100);
  }
}

// Modified initializeBoards to only create when needed
function initializeBoards() {
  // Only create if we have a valid size
  if (gameConfig.boardSize > 0) {
    gameConfig.playerBoard = createEmptyBoard(gameConfig.boardSize);
    gameConfig.enemyBoard = createEmptyBoard(gameConfig.boardSize);
    return true;
  }
  return false;
}

function setupEventListeners() {
  document.getElementById('btn-rapido').addEventListener('click', startQuickGame);
  document.getElementById('btn-manual').addEventListener('click', showManualConfig);
  document.getElementById('btn-start-manual').addEventListener('click', startManualPlacement);
}

function createEmptyBoard(size) {
  return Array.from({length: size}, () => 
    Array(size).fill('-')
  );
}

// Essential drawing function (must be kept)
function drawBoard(board, x, y, isEnemy) {
  push();
  translate(x, y);
  
  // Calculate cell size based on current board size
  const cellSize = (width / 2) / gameConfig.boardSize;
  
  // Draw cells
  for (let i = 0; i < gameConfig.boardSize; i++) {
    for (let j = 0; j < gameConfig.boardSize; j++) {
      // Determine cell content (hide enemy ships if needed)
      let content = isEnemy && board[i][j] === 'O' ? '-' : board[i][j];
      
      // Set color based on content
      if (content === '-') fill('#F4F4F4');     // Water
      else if (content === 'O') fill('#87CEFA'); // Ship
      else if (content === 'X') fill('#A9A9A9'); // Miss
      else if (content === '!') fill('#E64832'); // Hit
      else if (content === 'R') fill('#FFFF66'); // Revealed
      
      // Draw cell
      stroke(0);
      rect(j * cellSize, i * cellSize, cellSize, cellSize);
    }
  }
  
  // Draw coordinates
  //fill(0);
  //textSize(12);
  //for (let i = 0; i < gameConfig.boardSize; i++) {
    //text(i, i * cellSize + cellSize/2, -10);  // Column labels
    //text(i, -15, i * cellSize + cellSize/2);  // Row labels
  //}
  
  pop();
}

function drawBoards() {
  clear();
  background(240);
  
  if (gameConfig.playerBoard && gameConfig.enemyBoard) {
    drawBoard(gameConfig.playerBoard, 0, 0, false);          // Player board (left)
    drawBoard(gameConfig.enemyBoard, width/2, 0, true);     // Enemy board (right)
  } else {
    // Show waiting message if boards not created yet
    fill(0);
    text("Selecciona un modo de juego", width/2, height/2);
  }
}

function showScreen(id) {
  document.querySelectorAll('.pantalla').forEach(div => div.classList.add('oculto'));
  document.getElementById(id).classList.remove('oculto');
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
  gameConfig.boardSize = 8; // Default size for quick game
  if (initializeBoards()) {
    initGame('quick', Math.floor(random(3, 6)));
  }
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
  const boardSize = parseInt(document.getElementById('grid-size').value);
  
  if (ships >= 3 && ships <= 15 && boardSize >= 5 && boardSize <= 15) {
    gameConfig.boardSize = boardSize;
    if (initializeBoards()) {
      initGame('manual', ships);
    }
  } else {
    alert("Configuración inválida");
  }
}


// Simplify initGame since boards are now created earlier
function initGame(mode, shipCount) {
  gameConfig.gameMode = mode;
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
    const items = ['radar', 'doble', 'prediccion', 'revelar'];
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

  if (gameConfig.predictionTurns > 0) {
    showHeatMap();
  }
}

function showHeatMap() {
  push();
  translate(width/2, 0);
  
  const heatMap = normalizeMap(calculateHeatMap(gameConfig.enemyBoard, gameConfig.remainingShips));
  for (let i = 0; i < gameConfig.boardSize; i++) {
    for (let j = 0; j < gameConfig.boardSize; j++) {
      const prob = heatMap[i][j];
      if (prob > 0) {
        fill(255, 0, 0, prob * 150);
        noStroke();
        rect(j * gameConfig.cellSize, i * gameConfig.cellSize, 
             gameConfig.cellSize, gameConfig.cellSize);
      }
    }
  }
  
  pop();
}

function calculateHeatMap(board, remainingShips) {
  const size = board.length;
  const map = Array.from({ length: size }, () => Array(size).fill(0));

  if (!Array.isArray(remainingShips)) return map;

  remainingShips.forEach(ship => {
    if (!ship || typeof ship.size !== 'number') return;
    
    const shipSize = ship.size;
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        checkHorizontalPlacement(i, j, shipSize, board, map);
        checkVerticalPlacement(i, j, shipSize, board, map);
      }
    }
  });

  return map;
}

function checkHorizontalPlacement(row, col, size, board, map) {
  if (col + size > board.length) return;
  
  let possible = true;
  for (let k = 0; k < size; k++) {
    if (board[row][col + k] !== '-') {
      possible = false;
      break;
    }
  }
  
  if (possible) {
    for (let k = 0; k < size; k++) {
      map[row][col + k]++;
    }
  }
}

function checkVerticalPlacement(row, col, size, board, map) {
  if (row + size > board.length) return;
  
  let possible = true;
  for (let k = 0; k < size; k++) {
    if (board[row + k][col] !== '-') {
      possible = false;
      break;
    }
  }
  
  if (possible) {
    for (let k = 0; k < size; k++) {
      map[row + k][col]++;
    }
  }
}

function normalizeMap(map) {
  const values = map.flat();
  const max = values.length > 0 ? Math.max(...values) : 1;
  
  return map.map(row =>
    row.map(value => max > 0 ? value / max : 0)
  );
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
  gameConfig.predictionTurns = 0;
  updateInventoryUI();
}

function getItemName(code) {
  const names = {
    'radar': 'Radar',
    'doble': 'Disparo Doble',
    'prediccion': 'Modo de Predicción',
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
    'prediccion': '🔮',
    'revelar': '👁️'
  };
  return icons[code] || '❓';
}

function getItemDescription(code) {
  const descs = {
    'radar': 'Revela un barco enemigo',
    'doble': 'Permite disparar dos veces',
    'prediccion': 'Muestra zonas probables de barcos',
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
    case 'prediccion':
      gameConfig.predictionTurns = 3;
      updateStatus("¡Modo predicción activado por 3 turnos!");
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

function cleanOldBlinks() {
  // Clean up blink effects older than 1 second (30 frames at 30fps)
  const currentFrame = frameCount;
  const framesToKeep = 30;
  
  if (currentFrame - gameConfig.lastBlinkCleanup > framesToKeep) {
    for (const key in gameConfig.blinkEffect) {
      if (currentFrame - gameConfig.blinkEffect[key] > framesToKeep) {
        delete gameConfig.blinkEffect[key];
      }
    }
    gameConfig.lastBlinkCleanup = currentFrame;
  }
}

function revealRandomShip() {
  const hiddenShips = [];
  
  // Find all hidden enemy ships
  for (let i = 0; i < gameConfig.boardSize; i++) {
    for (let j = 0; j < gameConfig.boardSize; j++) {
      if (gameConfig.enemyBoard[i][j] === 'O') {
        hiddenShips.push({row: i, col: j});
      }
    }
  }
  
  if (hiddenShips.length > 0) {
    // Select random ship to reveal
    const ship = hiddenShips[floor(random(hiddenShips.length))];
    gameConfig.enemyBoard[ship.row][ship.col] = 'R'; // Mark as revealed
    
    // Update UI and return success
    updateStatus("¡Radar activado! Se ha revelado un barco enemigo.");
    drawBoards();
    return true;
  }
  
  updateStatus("No hay barcos enemigos ocultos para revelar.");
  return false;
}

function revealRandomPosition() {
  const emptyCells = [];
  
  // Find all unrevealed empty cells
  for (let i = 0; i < gameConfig.boardSize; i++) {
    for (let j = 0; j < gameConfig.boardSize; j++) {
      if (gameConfig.enemyBoard[i][j] === '-') {
        emptyCells.push({row: i, col: j});
      }
    }
  }
  
  if (emptyCells.length > 0) {
    // Select random empty cell to reveal
    const cell = emptyCells[floor(random(emptyCells.length))];
    gameConfig.enemyBoard[cell.row][cell.col] = 'X'; // Mark as water
    
    // Update UI and return success
    updateStatus("¡Posición revelada! Se ha marcado como agua.");
    drawBoards();
    return true;
  }
  
  updateStatus("No hay celdas sin revelar.");
  return false;
}