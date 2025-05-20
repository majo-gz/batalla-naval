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
  inventory: [],
   protectedCells: [],
   enemyShipsTotal: 0
};

const gameStats = {
  hits: 0,          // Disparos acertados
  misses: 0,        // Disparos fallados
  gamesPlayed: 0,   // Partidas jugadas
  wins: 0,          // Partidas ganadas
  currentShots: 0,  // Disparos en partida actual
  totalShots: 0     // Disparos totales (todas las partidas)
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

let lastAttackPositions = [];

function preload() {
  sounds.background = loadSound('assets/sounds/musicaFondo.mp3');
  sounds.victory = loadSound('assets/sounds/victoria.mp3');
  sounds.defeat = loadSound('assets/sounds/derrota.mp3');
  sounds.playerHit = loadSound('assets/sounds/impactoJugador.mp3');
  sounds.enemyHit = loadSound('assets/sounds/impactoIA.mp3');
  sounds.water = loadSound('assets/sounds/agua.mp3');
  sounds.placeShip = loadSound('assets/sounds/colocarBarco.mp3');
  
  //sounds.radar =loadSound(Assets/sounds/radar.mp3)
}

function setup() {
  createCanvas(800, 340).parent('game-container');
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
  document.getElementById('btn-reiniciar-victoria').addEventListener('click', resetGame);
  document.getElementById('btn-reiniciar-derrota').addEventListener('click', resetGame);
    //document.getElementById('btn-reiniciar-derrota').addEventListener('click', resetGame);

  document.getElementById('btn-stats-end').addEventListener('click', function() {
    const statsPanel = document.getElementById('stats-panel');
    statsPanel.classList.toggle('oculto');
    this.textContent = statsPanel.classList.contains('oculto') 
        ? 'Ver estadísticas' 
        : 'Ocultar estadísticas';
});
}

function initializeBoards() {

    // Inicializar con valores por defecto si no existen
    gameConfig.boardSize = gameConfig.boardSize || 8;
    gameConfig.cellSize = gameConfig.cellSize || 40;

    // Crear tableros con validación
    try {
        gameConfig.playerBoard = createEmptyBoard(gameConfig.boardSize);
        gameConfig.enemyBoard = createEmptyBoard(gameConfig.boardSize);
        
        // Inicializar contadores relacionados
        gameConfig.playerShips = gameConfig.playerShips || 0;
        gameConfig.enemyShips = gameConfig.enemyShips || 0;
        
    } catch (error) {
        console.error("Error al inicializar tableros:", error);
        // Asignar tableros vacíos como fallback
        gameConfig.playerBoard = [['-']];
        gameConfig.enemyBoard = [['-']];
    }
}

function createEmptyBoard(size) {
    // Validar tamaño del tablero
    size = Math.max(5, Math.min(size || 8, 10)); // Entre 5 y 10 como límites
    
    return Array(size).fill().map(() => 
        Array(size).fill('-') // '-' representa celda vacía
    );
}

function drawBoards() {
  clear();

  drawBoard(gameConfig.playerBoard, 0, 0, false);
  drawBoard(gameConfig.enemyBoard, 480, 0, true);
}

function showScreen(id) {
    // Ocultar todas las pantallas
    document.querySelectorAll('.pantalla').forEach(div => {
        div.classList.add('oculto');
    });
    
    // Mostrar la pantalla solicitada
    document.getElementById(id).classList.remove('oculto');
}

function drawBoard(board, x, y, isEnemy) {
  push();
  translate(x, y);
  
  for (let i = 0; i < gameConfig.boardSize; i++) {
    for (let j = 0; j < gameConfig.boardSize; j++) {
      let content = isEnemy && board[i][j] === 'O' ? '-' : board[i][j];
      
      // 1. Handle blink effect first (this affects the cell content)
// Handle blink effect for this cell (verde)
const blinkKey = `${i},${j}`;
if (gameConfig.blinkEffect[blinkKey]) {
  const framesSinceHit = frameCount - gameConfig.blinkEffect[blinkKey];
  if (framesSinceHit < 10) { // Blink for 10 frames
    // Efecto de parpadeo verde
    const pulse = floor(framesSinceHit / 2) % 2;
    if (pulse === 0) {
      content = 'B'; // Usamos 'B' para blink verde
    }
  }
}
      
      // 2. Set base cell color
      setCellColor(content, i, j);
      
      // 3. Handle protected cell borders (drawn on top of base cell)
      const isProtected = !isEnemy && gameConfig.protectedCells.some(
        cell => cell.row === i && cell.col === j
      );
      
      if (isProtected) {
        stroke(0, 255, 0); // Green border for protected cells
        strokeWeight(2);
      } else {
        stroke(0); // Normal black border
        strokeWeight(1);
      }
      
      // 4. Draw the cell rectangle
      rect(j * gameConfig.cellSize, i * gameConfig.cellSize, 
           gameConfig.cellSize, gameConfig.cellSize);
    }
  }
  
  pop();
}

function setCellColor(content, row, col) {
  const colors = {
    '-': '#F4F4F4',  // Empty
    'O': '#87CEFA',  // Ship
    'X': '#A9A9A9',  // Miss
    'R': '#FFFF66',  // Revealed
    '!': '#E64832',  // Hit
    'P': '#90EE90',   // Protected (light green),
    'B': '#FFFF66'   // Blink verde (verde puro)
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
  console.log("showManualConfig called");
  gameConfig.gameMode = 'manual';
  initializeBoards();

  // Asegúrate de que el panel de configuración manual esté visible
document.getElementById('manual-placement').classList.remove('oculto');
  document.getElementById('manual-placement').style.display = 'block';
  // Asegúrate de que las pantallas de victoria y derrota estén ocultas
  //document.getElementById('pantalla-victoria').classList.add('oculto');
  //document.getElementById('pantalla-derrota').classList.add('oculto');

  updateStatus("Configura tu flota - Elige cuántos barcos deseas");
  drawBoards();
}


function startManualPlacement() {
  const ships = parseInt(document.getElementById('ship-amount').value) || 3;
  if (ships < 3 || ships > 10) {
    alert("Por favor elige entre 3 y 10 barcos");
    return;
  }
  
  
  gameConfig.placingShips = true;
  gameConfig.shipsPlaced = 0;
  gameConfig.shipsToPlace = ships;
  initGame('manual', ships);
  document.getElementById('manual-placement').style.display = 'none';
  updateStatus(`Coloca tus ${ships} barcos. Haz clic en tu tablero.`);
}

function initGame(mode, shipCount) {
  gameConfig.gameMode = mode;
  initializeBoards();
  
  

  gameConfig.playerShips = shipCount;
  gameConfig.enemyShips = shipCount;
  gameConfig.enemyShipsTotal = shipCount; // Guarda el total inicial de barcos
  gameStats.hits = 0;
  gameStats.misses = 0;
  gameStats.currentShots = 0;
  gameConfig.enemyShipsTotal = shipCount;
  
  if (gameConfig.gameMode !== 'manual') {placeRandomShips(gameConfig.playerBoard, gameConfig.playerShips);} 
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
    gameConfig.enemyShips--; // ← Esto ya está correcto
    updateShipCount();
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

  if (cellValue === 'O' || cellValue === 'R') {
    gameStats.hits++;
    gameStats.currentShots++;
    gameStats.totalShots++;
  } else if (cellValue === '-') {
    gameStats.misses++;
    gameStats.currentShots++;
    gameStats.totalShots++;
  }
  
  updateStats();
  
  updateShipCount();
  drawBoards();
}

function isValidCell(row, col) {
  return row >= 0 && row < gameConfig.boardSize && 
         col >= 0 && col < gameConfig.boardSize;
}

function aiTurn() {
  const attackCount = Math.random() < 0.6 ? 2 : 1; // 30% de chance de 2 ataques
  
  // Primer ataque inmediato
  performAIAttack();
  
  // Segundo ataque con retraso (si aplica)
  if (attackCount === 2) {
    updateStatus("¡La IA está preparando un ataque doble!");
    setTimeout(() => {
      performAIAttack();
      drawBoards();
      checkGameEnd('player');
      startPlayerTurn();
    }, 800);
  } else {
    updateShipCount();
    checkGameEnd('player');
    startPlayerTurn();
  }
}

function performAIAttack() {
  let x, y;
  let attempts = 0;
  const maxAttempts = 50;
  
  do {
    x = floor(random(gameConfig.boardSize));
    y = floor(random(gameConfig.boardSize));
    attempts++;
  } while (
    (['X', '!'].includes(gameConfig.playerBoard[y][x]) || 
     isCellProtected(y, x) ||
     lastAttackPositions.some(pos => pos.x === x && pos.y === y)) && 
    attempts < maxAttempts
  );
  
  lastAttackPositions.push({x, y});
  processAttackResult(y, x);
  
  updateShipCount();

  // Limpiar después del turno
  if (lastAttackPositions.length >= 2) {
    lastAttackPositions = [];
  }
}

// Helper functions (las mismas que antes)
function isCellProtected(row, col) {
  return gameConfig.protectedCells.some(
    cell => cell.row === row && cell.col === col
  );
}

function processAttackResult(row, col) {
  if (isCellProtected(row, col)) {
    gameConfig.playerBoard[row][col] = 'X';
    updateStatus("¡Defensa electrónica ha bloqueado un ataque enemigo!");
    gameConfig.playerBoard[y][x] = 'X'; // Marcar como ataque fallido
     gameStats.misses++;
    gameStats.currentShots++;
    gameStats.totalShots++;
    playSound(sounds.water);
  } 
  else if (gameConfig.playerBoard[row][col] === 'O') {
    gameConfig.playerBoard[row][col] = '!';
    markHit(row, col);
    gameConfig.playerShips--;
    gameStats.hits++;
    gameStats.currentShots++;
    gameStats.totalShots++;
    updateStatus("La IA ha impactado uno de tus barcos!");
    playSound(sounds.enemyHit);
  } else {
    gameConfig.playerBoard[row][col] = 'X';
    gameStats.misses++;
    gameStats.currentShots++;
    gameStats.totalShots++;
    updateStatus("La IA ha atacado y falló");
    playSound(sounds.water);
  }
}

function checkGameEnd(loser) {

  /*
    const isVictory = loser === 'enemy';
  
  if (isVictory) {
    gameStats.wins++;
    gameStats.gamesPlayed++;
  } else {
    gameStats.gamesPlayed++;
  }
  */ 

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
  if (Math.random() < 0.3) { // 30% de chance de obtener un ítem
    // Definir probabilidades (puedes ajustar estos valores)
    const itemRarities = {
      'doble': 30,
      'radar': 10,
      'revelar': 35,
      'defensa': 25
    };

    // Calcular total para normalización
    const total = Object.values(itemRarities).reduce((sum, val) => sum + val, 0);
    let random = Math.random() * total;
    
    // Seleccionar ítem basado en peso
    let selectedItem;
    for (const [item, weight] of Object.entries(itemRarities)) {
      if (random < weight) {
        selectedItem = item;
        break;
      }
      random -= weight;
    }

    gameConfig.inventory.push(selectedItem);
    console.log(`Item obtenido: ${selectedItem} (Rareza: ${itemRarities[selectedItem]}%)`);
    showMessage(`¡Has obtenido un ítem: ${getItemName(selectedItem)}!`);
    updateInventoryUI();
  }
}

function updateStatus(message) {
  document.getElementById('status').textContent = message;
}

function updateShipCount() {
  const playerShipsDisplay = gameConfig.playerShips > 0 ? gameConfig.playerShips : 0;
  const enemyShipsDisplay = gameConfig.enemyShips > 0 ? gameConfig.enemyShips : 0;
  
  document.getElementById('ship-count').textContent = 
    `Tus barcos: ${playerShipsDisplay} | Barcos enemigos: ${enemyShipsDisplay}`;
  
  // Actualizar estadísticas de hundimientos
  document.getElementById('stats-sunk').textContent = 
    gameConfig.enemyShipsTotal - enemyShipsDisplay;
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
    // 1. Stop all audio and clear any intervals
    stopBackgroundMusic();
    
    // 2. Completely reset game state
    gameConfig.playerShips = 0;
    gameConfig.enemyShips = 0;
    gameConfig.gameMode = '';
    gameConfig.isPlayerTurn = true;
    gameConfig.placingShips = false;
    gameConfig.shipsToPlace = 0;
    gameConfig.shipsPlaced = 0;
    gameConfig.doubleShot = false;
    gameConfig.predictionTurns = 0; // If using prediction feature
    gameConfig.turnNumber = 0; // If tracking turns
    
    // Reset arrays/objects by creating new instances
    gameConfig.remainingShips = [];
    gameConfig.inventory = [];
    gameConfig.protectedCells = [];
    gameConfig.blinkEffect = {};
    gameConfig.lastBlinkCleanup = 0;
    
    // 3. Reinitialize boards (using direct implementation)
    gameConfig.playerBoard = Array(gameConfig.boardSize).fill()
                          .map(() => Array(gameConfig.boardSize).fill('-'));
    gameConfig.enemyBoard = Array(gameConfig.boardSize).fill()
                         .map(() => Array(gameConfig.boardSize).fill('-'));
    
    // 4. Reset UI
    updateStatus("Selecciona un modo de juego");
    updateShipCount();
    updateInventoryUI();
    showScreen('pantalla-inicio');
    
    // 5. Redraw boards
    drawBoards();
    
    // 6. Safe sound play
    try {
        if (sounds.buttonClick && !sounds.buttonClick.isPlaying()) {
            sounds.buttonClick.play();
        }
    } catch (e) {
        console.error("Error playing reset sound:", e);
    }
}

function getItemName(code) {
  const names = {
    'radar': 'Radar',
    'doble': 'Disparo Doble',
    'revelar': 'Revelar Posición',
    'defensa': 'Defensa Electrónica' // Nuevo nombre
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
    'revelar': '👁️',
    'defensa': '🛡️' // Nuevo icono
  };
  return icons[code] || '❓';
}

function getItemDescription(code) {
  const descs = {
    'radar': 'Revela un barco enemigo',
    'doble': 'Permite disparar dos veces',
    'revelar': 'Muestra una posición enemiga',
    'defensa': 'Protege 2 celdas de tu tablero' // Nueva descripción
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
      used = revealRandomPositions();
      break;
    case 'defensa':
      used = protectRandomCells();
      if (used) {
        updateStatus("¡Defensa electrónica activada! 2 celdas protegidas.");
        // Quitar la protección después de 2 turnos
        setTimeout(() => {
          removeProtection();
          updateStatus("La defensa electrónica ha expirado.");
          drawBoards();
        }, 3000 * 2); // 3 turnos (asumiendo 1 turno = ~3 segundos)
      } else {
        updateStatus("No hay suficientes celdas para proteger.");
      }
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

function revealRandomPositions() {
  // Encontrar celdas no reveladas en el tablero enemigo
  const hiddenCells = [];
  
  for (let i = 0; i < gameConfig.boardSize; i++) {
    for (let j = 0; j < gameConfig.boardSize; j++) {
      // Solo considerar celdas que no han sido atacadas/reveladas y no son barcos ya revelados
      if (gameConfig.enemyBoard[i][j] === '-' || gameConfig.enemyBoard[i][j] === 'O') {
        hiddenCells.push({row: i, col: j});
      }
    }
  }
  
  if (hiddenCells.length === 0) {
    updateStatus("No hay posiciones para revelar");
    return false;
  }

  // Revelar 2 celdas (o menos si no hay suficientes)
  const cellsToReveal = Math.min(2, hiddenCells.length);
  let revealedShips = 0;

  for (let i = 0; i < cellsToReveal; i++) {
    // Seleccionar una celda aleatoria y removerla del array para no repetir
    const randomIndex = Math.floor(Math.random() * hiddenCells.length);
    const cell = hiddenCells.splice(randomIndex, 1)[0];
    
    // Revelar la posición
    if (gameConfig.enemyBoard[cell.row][cell.col] === 'O') {
      gameConfig.enemyBoard[cell.row][cell.col] = 'R'; // Barco revelado
      revealedShips++;
      markHit(cell.row, cell.col); // Efecto visual para barcos
    } else {
      gameConfig.enemyBoard[cell.row][cell.col] = 'X'; // Agua revelada
    }
  }

  // Mensaje descriptivo
  if (revealedShips > 0) {
    updateStatus(`¡Revelación muestra ${revealedShips} barco(s) enemigo(s)!`);
  } else {
    updateStatus("Revelación muestra agua - no hay barcos en estas posiciones");
  }

  drawBoards();
  return true;
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

function protectRandomCells() {
  // Limpiar protección anterior
  gameConfig.protectedCells = [];
  
  // Encontrar celdas válidas para proteger (que no hayan sido atacadas y no estén ya protegidas)
  const validCells = [];
  for (let i = 0; i < gameConfig.boardSize; i++) {
    for (let j = 0; j < gameConfig.boardSize; j++) {
      if (gameConfig.playerBoard[i][j] === '-' || gameConfig.playerBoard[i][j] === 'O') {
        validCells.push({row: i, col: j});
      }
    }
  }
  
  // Si no hay suficientes celdas, no hacer nada
  if (validCells.length < 2) {
    return false;
  }
  
  // Seleccionar 2 celdas aleatorias
  for (let i = 0; i < 2; i++) {
    const randomIndex = Math.floor(Math.random() * validCells.length);
    const cell = validCells.splice(randomIndex, 1)[0];
    gameConfig.protectedCells.push(cell);
    
    // Marcar visualmente la celda como protegida (usaremos 'P' temporalmente)
    gameConfig.playerBoard[cell.row][cell.col] = 'P';
  }
  
  return true;
}

function removeProtection() {
  gameConfig.protectedCells.forEach(cell => {
    // Restaurar el valor original de la celda
    if (gameConfig.playerBoard[cell.row][cell.col] === 'P') {
      gameConfig.playerBoard[cell.row][cell.col] = 
        gameConfig.playerBoard[cell.row][cell.col] === 'O' ? 'O' : '-';
    }
  });
  gameConfig.protectedCells = [];
}

function cleanOldBlinks() {
  const currentFrame = frameCount;
  
  // Check if we need to clean up (limit how often we do this for performance)
  if (currentFrame - gameConfig.lastBlinkCleanup < 10) {
    return;
  }
  
  // Track if we removed any blinks
  let removedAny = false;
  
  // Clean up old blink effects
  for (const key in gameConfig.blinkEffect) {
    if (currentFrame - gameConfig.blinkEffect[key] > 10) { // 10 frames = ~0.33 seconds at 30fps
      delete gameConfig.blinkEffect[key];
      removedAny = true;
    }
  }
  
  // Update last cleanup time if we actually did something
  if (removedAny) {
    gameConfig.lastBlinkCleanup = currentFrame;
  }
}

// Called when a cell is hit
function markHit(row, col) {
  gameConfig.blinkEffect[`${row},${col}`] = frameCount;
}


function updateStats() {
  const currentAccuracy = gameStats.currentShots > 0 
    ? Math.round((gameStats.hits / gameStats.currentShots) * 100) 
    : 0;
  
  const totalAccuracy = gameStats.totalShots > 0
    ? Math.round(((gameStats.wins * gameConfig.enemyShipsTotal) / gameStats.totalShots) * 100)
    : 0;

  document.getElementById('stats-shots').textContent = gameStats.currentShots;
  document.getElementById('stats-accuracy').textContent = `${currentAccuracy}%`;
  document.getElementById('stats-sunk').textContent = gameConfig.enemyShipsTotal - gameConfig.enemyShips;
  document.getElementById('stats-wins').textContent = gameStats.wins;
  document.getElementById('stats-total-accuracy').textContent = `${totalAccuracy}%`;
}