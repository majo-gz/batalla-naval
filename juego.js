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
  enemyShipsTotal: 0,
  turnTimer: null,      // Referencia al temporizador
  timeLeft: 10,         // Segundos restantes
  maxTurnTime: 30    // Límite de tiempo por turno (segundos)
};

// Modificar el objeto gameStats
const gameStats = {
  gamesPlayed: 0,           // Contador global
  wins: 0,                  // Contador global
  currentGame: {            // Objeto para esta partida
    shots: 0,
    hits: 0,
    itemsUsed: {}
  }
};

// Efectos de sonido
const sounds = {
  background: null,
  victory: null, defeat: null, playerHit: null, enemyHit: null, water: null, placeShip: null,
  item: null, shield: null, radar: null, reveal: null, click: null, dobledisparo: null,
  isMusicPlaying: false
};
let imagebg;
let lastAttackPositions = [];

function preload() {
  sounds.background = loadSound('assets/sounds/musicaFondo.mp3');
  sounds.victory = loadSound('assets/sounds/victoria.mp3');
  sounds.defeat = loadSound('assets/sounds/derrota.mp3');
  sounds.playerHit = loadSound('assets/sounds/impactoJugador.mp3');
  sounds.enemyHit = loadSound('assets/sounds/impactoIA.mp3');
  sounds.water = loadSound('assets/sounds/agua.mp3');
  sounds.placeShip = loadSound('assets/sounds/colocarBarco.mp3');
  sounds.item = loadSound('assets/sounds/obteneritem.mp3');//desde acá empiezan los cambios
  sounds.shield = loadSound('assets/sounds/shield.mp3');
  sounds.radar = loadSound('assets/sounds/radar.mp3');
  sounds.reveal = loadSound('assets/sounds/revelar.mp3');
  sounds.click = loadSound('assets/sounds/click.mp3');
  sounds.dobledisparo = loadSound('assets/sounds/dobledisparo.mp3');
  bgImage = loadImage('assets/images/fondo.jpg');

}

function setupButtonSounds() {
  document.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => playSound(sounds.click));
  });
}

function setup() {
  createCanvas(830, 370).parent('game-container');

  textAlign(CENTER, CENTER);

  setupEventListeners();
  initializeBoards();
  drawBoards();

  setupButtonSounds();//añadí aquí
  userStartAudio();//creo que esto no hace nada
  frameRate(30);
}

function setupEventListeners() {
  // Botones existentes (los tuyos)
  document.getElementById('btn-rapido').addEventListener('click', startQuickGame);
  document.getElementById('btn-manual').addEventListener('click', showManualConfig);
  document.getElementById('btn-start-manual').addEventListener('click', startManualPlacement);
  document.getElementById('btn-new-game').addEventListener('click', resetGame);

  document.querySelectorAll('[id^="btn-stats"]').forEach(btn => {
    btn.addEventListener('click', toggleStats);
  });

  // Cerrar al hacer clic fuera del panel
  document.addEventListener('click', (e) => {
    const statsPanel = document.getElementById('stats-panel');
    const isStatsBtn = e.target.closest('[id^="btn-stats"]');

    if (!statsPanel.classList.contains('oculto') &&
      !statsPanel.contains(e.target) &&
      !isStatsBtn) {
      toggleStats();
    }
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

  // 1. Ajustar posición para dejar espacio a los bordes
  const margin = 25; // Margen general del canvas
  const boardSpacing = 40; // Espacio entre tableros

  // 2. Dibujar tableros con posición ajustada
  drawBoard(gameConfig.playerBoard, margin, margin, false);
  drawBoard(gameConfig.enemyBoard, margin * 2 + 400 + boardSpacing, margin, true);

  // 3. Mostrar borde neón ANTES de los ataques
   // Solo dibujar tablero enemigo si no estamos colocando barcos
  if (!gameConfig.placingShips) {
    drawBoard(gameConfig.enemyBoard, margin * 2 + 400 + boardSpacing, margin, true);
  }

  // Lógica de bordes neón
  if (gameConfig.placingShips) {
    drawPlacementNeonBorder(margin, margin, gameConfig.playerBoard);
  } else if (gameConfig.isPlayerTurn) {
    drawNeonBorder(margin * 2 + 400 + boardSpacing, margin, gameConfig.enemyBoard);
  } else {
    drawNeonBorder(margin, margin, gameConfig.playerBoard);
  }
}
function drawPlacementNeonBorder(x, y, board) {
  // Copia exacta de tu drawNeonBorder original pero con colores amarillos
  push();
  translate(x, y);
  
  const padding = 4;
  const cellSize = gameConfig.cellSize;
  const boardSize = board.length;
  const boardWidth = boardSize * cellSize;
  
  // Efecto amarillo
  drawingContext.shadowBlur = 20;
  drawingContext.shadowColor = 'rgba(255, 255, 0, 0.7)';

  // Borde principal
  noFill();
  strokeWeight(5);
  stroke(255, 255, 0); // Amarillo

  rect(-padding, -padding, 
       boardWidth + padding * 2, 
       boardWidth + padding * 2,
       8);

  // Borde intermedio
  strokeWeight(3);
  stroke(255, 255, 150); // Amarillo claro

  rect(-padding + 1, -padding + 1, 
       boardWidth + padding * 2 - 2, 
       boardWidth + padding * 2 - 2,
       7);

  drawingContext.shadowBlur = 0;
  pop();
}

function drawNeonBorder(x, y, board) {
  push();
  translate(x, y);

  const padding = 4; // Reducido para que quede pegado
  const cellSize = gameConfig.cellSize;
  const boardSize = board.length;
  const boardWidth = boardSize * cellSize;

  // Efecto idéntico al de notificaciones
  drawingContext.shadowBlur = 20;
  drawingContext.shadowColor = gameConfig.isPlayerTurn
    ? 'rgba(0, 200, 255, 0.7)'
    : 'rgba(230, 72, 50, 0.7)';

  // Borde principal (exterior)
  noFill();
  strokeWeight(5);
  stroke(gameConfig.isPlayerTurn
    ? 'rgba(0, 180, 240, 0.9)'  // Azul ligeramente más intenso para el trazo
    : 'rgba(220, 70, 50, 0.9)'); // Rojo ligeramente más intenso para el trazo

  rect(-padding, -padding,
    boardWidth + padding * 2,
    boardWidth + padding * 2,
    8);

  // Borde intermedio (efecto neon)
  strokeWeight(3);
  stroke(gameConfig.isPlayerTurn
    ? 'rgba(0, 220, 255, 0.6)'  // Azul más brillante
    : 'rgba(240, 80, 60, 0.6)'); // Rojo más brillante

  rect(-padding + 1, -padding + 1,
    boardWidth + padding * 2 - 2,
    boardWidth + padding * 2 - 2,
    7);

  // Borde interno (brillo suave)
  strokeWeight(1.5);
  stroke(gameConfig.isPlayerTurn
    ? 'rgba(150, 240, 255, 0.4)'  // Azul muy claro
    : 'rgba(255, 180, 150, 0.4)'); // Rojo muy claro

  rect(-padding + 3, -padding + 3,
    boardWidth + padding * 2 - 6,
    boardWidth + padding * 2 - 6,
    5);

  drawingContext.shadowBlur = 0;
  pop();

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
    text(i, i * gameConfig.cellSize + gameConfig.cellSize / 2, -10);
    text(i, -15, i * gameConfig.cellSize + gameConfig.cellSize / 2);
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
  drawBoards();
}

function initGame(mode, shipCount) {
  gameConfig.gameMode = mode;
  initializeBoards();

  // Configuración de barcos
  gameConfig.playerShips = shipCount;
  gameConfig.enemyShips = shipCount;
  gameConfig.enemyShipsTotal = shipCount; // Guarda el total inicial de barcos

  // Inicializar estadísticas de la partida actual
  gameStats.currentGame = {
    shots: 0,
    hits: 0,
    turns: 0,
    itemsUsed: {}
  };

  // Colocación de barcos
  if (gameConfig.gameMode !== 'manual') { 
    placeRandomShips(gameConfig.playerBoard, gameConfig.playerShips); 
  }
  placeRandomShips(gameConfig.enemyBoard, gameConfig.enemyShips);

  initRemainingShips(gameConfig.enemyShips);
  updateShipCount();
  gameConfig.isPlayerTurn = true;

  // Iniciar juego
  startBackgroundMusic();
  drawBoards();
  showScreen('pantalla-juego');
  startPlayerTurn(); // Eliminado 'this.' ya que no es necesario en este contexto
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

function mostrarNotificacion(texto, duracion = 2000) {
  const pantalla = document.getElementById('notificacion-pantalla');
  const contenido = pantalla.querySelector('.contenido-notificacion');

  // Configura el contenido
  contenido.textContent = texto;

  // Muestra la pantalla
  pantalla.style.display = 'flex'; // Aseguramos que sea visible
  setTimeout(() => {
    pantalla.classList.add('mostrar');
  }, 10);

  // Oculta después de la duración
  setTimeout(() => {
    pantalla.classList.remove('mostrar');
    setTimeout(() => {
      pantalla.style.display = 'none';
    }, 500); // Espera a que termine la transición
  }, duracion);
}

function markHit(row, col) {
  gameConfig.blinkEffect[`${row},${col}`] = frameCount;
}


function startPlayerTurn() {
  gameConfig.isPlayerTurn = true;
  
    if (gameStats.currentGame.turns !== undefined) {
      gameStats.currentGame.turns++;
    } else {
      gameStats.currentGame.turns = 1;
    }

  resetTurnTimer(); // Iniciar el contador
  updateTurnTimerDisplay(); // Mostrar visualmente
  drawBoards();
  updateStatus(`¡Tu turno! Tienes ${gameConfig.maxTurnTime} segundos`);
  tryGetItem();
}

function endPlayerTurn() {
  clearTurnTimer();
  gameConfig.isPlayerTurn = false;
  updateStatus("Turno terminado. Es el turno de la IA.");
  drawBoards();
  //gameStats.currentGame.shots++;
  setTimeout(aiTurn, 1000);
}

function resetTurnTimer() {
  // Limpiar temporizador anterior si existe
  if (gameConfig.turnTimer) {
    clearInterval(gameConfig.turnTimer);
  }
  
  gameConfig.timeLeft = gameConfig.maxTurnTime;
  
  // Iniciar nuevo temporizador
  gameConfig.turnTimer = setInterval(() => {
    gameConfig.timeLeft--;
    updateTurnTimerDisplay();
    
    if (gameConfig.timeLeft <= 0) {
      endPlayerTurnDueToTimeout();
    }
  }, 1000);
}

function updateTurnTimerDisplay() {
const timerElement = document.getElementById('turn-timer');
  const statusElement = document.getElementById('status');
  
  // Actualizar el elemento del temporizador
  if (timerElement) {
    timerElement.textContent = `Tiempo: ${gameConfig.timeLeft}s`;
    timerElement.style.color = gameConfig.timeLeft <= 3 ? 'red' : 'white';
  }
  
  // Actualizar el mensaje de estado
  if (statusElement) {
    if (gameConfig.timeLeft <= 3) {
      statusElement.textContent = `¡Date prisa! Te quedan ${gameConfig.timeLeft} segundos`;
      statusElement.style.color = 'red';
    } else {
      statusElement.textContent = `Tu turno - Tiempo restante: ${gameConfig.timeLeft} segundos`;
      statusElement.style.color = ''; // Color por defecto
    }
  }
}

function endPlayerTurnDueToTimeout() {
  clearTurnTimer();
  gameConfig.isPlayerTurn = false;
  updateStatus("Turno terminado. Es el turno de la IA.");
  drawBoards();
  //gameStats.currentGame.shots++;
  setTimeout(aiTurn, 1000);
}

function clearTurnTimer() {
  if (gameConfig.turnTimer) {
    clearInterval(gameConfig.turnTimer);
    gameConfig.turnTimer = null;
  }
  gameConfig.timeLeft = gameConfig.maxTurnTime;
  updateTurnTimerDisplay();
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
  // 1. Definir márgenes del tablero del jugador (deben coincidir con drawBoards)
  const PLAYER_BOARD_MARGIN_X = 25; // Mismo que en drawBoards()
  const PLAYER_BOARD_MARGIN_Y = 25;

  // 2. Ajustar coordenadas restando los márgenes
  const relativeX = canvasX - PLAYER_BOARD_MARGIN_X;
  const relativeY = canvasY - PLAYER_BOARD_MARGIN_Y;

  // 3. Calcular fila/columna (como antes, pero con coordenadas ajustadas)
  const col = floor(relativeX / gameConfig.cellSize);
  const row = floor(relativeY / gameConfig.cellSize);

  // 4. Validar (usamos tu función existente isValidCell)
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

function handlePlayerAttack(canvasX, canvasY) {
  // 1. Calcular posición del tablero enemigo
  const margin = 25;
  const boardSpacing = 40;
  const enemyBoardX = margin * 2 + 400 + boardSpacing;
  const enemyBoardY = margin;

  // 2. Verificar si el clic está dentro del tablero enemigo
  if (canvasX < enemyBoardX || 
      canvasX > enemyBoardX + gameConfig.boardSize * gameConfig.cellSize ||
      canvasY < enemyBoardY || 
      canvasY > enemyBoardY + gameConfig.boardSize * gameConfig.cellSize) {
    return; // Clic fuera del tablero - no hacer nada
  }

  // 3. Calcular fila y columna relativas al tablero enemigo
  const col = floor((canvasX - enemyBoardX) / gameConfig.cellSize);
  const row = floor((canvasY - enemyBoardY) / gameConfig.cellSize);

  if (!isValidCell(row, col)) {
    console.log("Clic inválido en:", {row, col, canvasX, canvasY});
    return;
  }

  const cellValue = gameConfig.enemyBoard[row][col];

  gameStats.currentGame.shots++;

  // Procesar resultado del ataque
  if (cellValue === 'O' || cellValue === 'R') {
    gameConfig.enemyBoard[row][col] = '!';
    markHit(row, col);
    gameConfig.enemyShips--;
    gameStats.currentGame.hits++; // Registrar impacto
    
    updateStatus("¡Impacto! Has hundido un barco enemigo.");
    playSound(sounds.playerHit);
  } else if (cellValue === '-') {
    gameConfig.enemyBoard[row][col] = 'X';
    updateStatus("Agua... no hay barco en esa posición.");
    playSound(sounds.water);
  } else {
    // gameStats.currentGame.shots--; // Descontar si el ataque no fue válido
    return;
  }

  // Verificar fin del juego y manejar turno
  checkGameEnd('enemy');
  updateShipCount();
  drawBoards();

  if (gameConfig.doubleShot) {
    gameConfig.doubleShot = false;
    updateStatus("¡Disparo doble activado! Puedes disparar una vez más.");
  } else {
    endPlayerTurn();
  }
}

function isValidCell(row, col) {
  return row >= 0 && row < gameConfig.boardSize &&
    col >= 0 && col < gameConfig.boardSize;
}

function aiTurn() {
  const attackCount = Math.random() < 0.35 ? 2 : 1;

  // Primer ataque
  performAIAttack();
  
  // Verificar si el juego terminó después del primer ataque
  if (gameConfig.playerShips <= 0) {
    checkGameEnd('player');
    return;
  }

  // Segundo ataque con retraso (si aplica)
  if (attackCount === 2) {
    updateStatus("¡La IA está preparando un ataque doble!");
    setTimeout(() => {
      performAIAttack();
      drawBoards();
      checkGameEnd('player');
      if (gameConfig.playerShips > 0) {
        startPlayerTurn();
      }
    }, 800);
  } else {
    if (gameConfig.playerShips > 0) {
      startPlayerTurn();
    }
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

  lastAttackPositions.push({ x, y });
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
    updateStatus("¡Defensa ha bloqueado un ataque enemigo!");
    playSound(sounds.water);
    
    // Estadísticas (aunque sea bloqueado, cuenta como disparo recibido)
    // gameStats.currentGame.shots++;
  }
  else if (gameConfig.playerBoard[row][col] === 'O') {
    gameConfig.playerBoard[row][col] = '!';
    markHit(row, col);
    gameConfig.playerShips--;
    
    // Actualizar estadísticas
    // gameStats.currentGame.hits++;
    // gameStats.currentGame.shots++;
    
    updateStatus("La IA ha impactado uno de tus barcos!");
    playSound(sounds.enemyHit);
  } else {
    gameConfig.playerBoard[row][col] = 'X';
    
    // Solo contar como disparo recibido
    // gameStats.currentGame.shots++;
    
    updateStatus("La IA ha atacado y falló");
    playSound(sounds.water);
  }
}

function checkGameEnd(loser) {
  const shipsLeft = loser === 'player' ? gameConfig.playerShips : gameConfig.enemyShips;

  if (shipsLeft <= 0) {
    const isVictory = loser === 'enemy';
    
    // Actualizar estadísticas globales
    gameStats.gamesPlayed++;
    if (isVictory) {
      gameStats.wins++;
    }

    // Configurar mensaje y sonido
    updateStatus(isVictory ? "¡Felicidades! Has ganado el juego." : "¡La IA ha ganado! Mejor suerte la próxima vez.");
    playSound(isVictory ? sounds.victory : sounds.defeat);

    stopBackgroundMusic();
    
    // Mostrar pantalla final correspondiente
    mostrarFinDelJuego(isVictory ? 'victoria' : 'derrota');
  }
}

function tryGetItem() {
  // Probabilidad base de obtener ítem (30%)
  let baseProbability = 0.3;

  // Penalización del 5% por cada ítem en el inventario
  const penaltyPerItem = 0.05;
  const currentPenalty = gameConfig.inventory.length * penaltyPerItem;

  // Probabilidad final (base - penalización) con mínimo del 5%
  const finalProbability = Math.max(baseProbability - currentPenalty, 0.05);

  console.log(`Probabilidad de ítem: ${(finalProbability * 100).toFixed(1)}% (Base: 30% - Penalización: ${(currentPenalty * 100).toFixed(1)}%)`);

  if (Math.random() < finalProbability) {
    // Definir probabilidades de tipos de ítem
    const itemRarities = {
      'doble': 30,
      'radar': 10,
      'revelar': 35,
      'defensa': 25
    };

    // Calcular total para normalización
    const total = Object.values(itemRarities).reduce((sum, val) => sum + val, 0);
    let random = Math.random() * total;

    document.getElementById('item-prob-display').textContent =  `Prob. ítem: ${(finalProbability * 100).toFixed(1)}%`;

    // Seleccionar ítem basado en peso
    let selectedItem;
    for (const [item, weight] of Object.entries(itemRarities)) {
      if (random < weight) {
        selectedItem = item;
        break;
      }
      random -= weight;
    }

    // Lógica de inventario limitado (máximo 5 ítems)
    if (gameConfig.inventory.length >= 5) {
      const removedItem = gameConfig.inventory.shift(); // Elimina el más antiguo
      mostrarNotificacion(`Inventario lleno! Se descartó: ${getItemName(removedItem)}`, 2000);
    }

    // Añadir el nuevo ítem
    gameConfig.inventory.push(selectedItem);
    mostrarNotificacion(`✨¡Has obtenido: ${getItemName(selectedItem)}! (${gameConfig.inventory.length}/5)✨`, 2000);
    playSound(sounds.item);
    updateInventoryUI();

    
    // Actualizar visualización de probabilidad
    updateProbabilityDisplay();
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

  // Actualizar probabilidad
  const probability = calculateHitProbability();
  document.getElementById('probability-display').textContent =
    `Probabilidad de impacto: ${probability}%`;
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

    // Mantener estadísticas globales
  const globalStats = {
    gamesPlayed: gameStats.gamesPlayed,
    wins: gameStats.wins
  };
  
  // Restaurar estadísticas globales
  Object.assign(gameStats, globalStats, {
    currentGame: {
      shots: 0,
      hits: 0,
      itemsUsed: {}
    }
  });;


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
    'defensa': 'Defensa' // Nuevo nombre
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

  if (!gameStats.currentGame.itemsUsed[item]) {
    gameStats.currentGame.itemsUsed[item] = 0;
  }
  gameStats.currentGame.itemsUsed[item]++;

  switch (item) {
    case 'radar':
      used = revealRandomShip();
      playSound(sounds.radar);//cambio aquí
      break;
    case 'doble':
      gameConfig.doubleShot = true;
      updateStatus("¡Activado doble disparo!");
      playSound(sounds.dobledisparo);//cambio aquí
      used = true;
      break;
    case 'revelar':
      used = revealRandomPositions();
      playSound(sounds.reveal);//cambio aquí
      break;
    case 'defensa':
      used = protectRandomCells();
      playSound(sounds.shield);//cambio aquí
      if (used) {
        updateStatus("¡Defensa activada! 2 celdas protegidas.");
        // Quitar la protección después de 2 turnos
        setTimeout(() => {
          removeProtection();
          updateStatus("La defensa ha expirado.");
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
 // Solo terminar turno si no es disparo doble
    if (item !== 'doble') {
      endPlayerTurn();
    }

}

function revealRandomShip() {
  const hiddenShips = [];

  for (let i = 0; i < gameConfig.boardSize; i++) {
    for (let j = 0; j < gameConfig.boardSize; j++) {
      if (gameConfig.enemyBoard[i][j] === 'O') {
        hiddenShips.push({ row: i, col: j });
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
        hiddenCells.push({ row: i, col: j });
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
        validCells.push({ row: i, col: j });
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


// Función para mostrar/ocultar el panel de estadísticas
function toggleStats() {
  const statsPanel = document.getElementById('stats-panel');
  const isHidden = statsPanel.classList.contains('oculto');

  // Actualizar texto de todos los botones de estadísticas
  document.querySelectorAll('[id^="btn-stats"]').forEach(btn => {
    btn.textContent = isHidden ? 'Ocultar estadísticas' : 'Ver estadísticas';
  });

  // Alternar visibilidad del panel
  statsPanel.classList.toggle('oculto');

  // Generar el informe solo cuando se muestra el panel
  if (isHidden) {
    generarInformeFinal();
  }
}

function generarInformeFinal() {
  const { currentGame } = gameStats;
  
  document.getElementById('stats-shots').textContent = currentGame.shots;
  
  const accuracy = currentGame.shots > 0 ? 
    Math.round((currentGame.hits / currentGame.shots) * 100) : 0;
  document.getElementById('stats-accuracy').textContent = `${accuracy}%`;
  
  document.getElementById('stats-sunk').textContent = currentGame.hits;

  document.getElementById('stats-turns').textContent = currentGame.turns;
  
  // Crear sección de resumen
  const usados = Object.keys(currentGame.itemsUsed).map(item => 
    `${currentGame.itemsUsed[item]}× ${getItemName(item)}`
  ).join(', ') || "Ninguno";
  
  const resumen = `
    <div class="stats-summary">
      <p><strong>Ítems usados:</strong> ${usados}</p>
    </div>
  `;
  
  // Insertar resumen en el panel
  const panel = document.getElementById('stats-panel');
  const prevSummary = panel.querySelector('.stats-summary');
  if (prevSummary) prevSummary.remove();
  panel.insertAdjacentHTML('beforeend', resumen);
}


function mostrarFinDelJuego(resultado) {
  // Ocultar todas las pantallas primero
  document.querySelectorAll('.pantalla').forEach(div => {
    div.classList.add('oculto');
  });

  // Mostrar pantalla final
  document.getElementById('pantalla-final').classList.remove('oculto');

  // Mostrar mensaje correspondiente
  if (resultado === 'victoria') {
    document.getElementById('mensaje-victoria').classList.remove('oculto');
  } else {
    document.getElementById('mensaje-derrota').classList.remove('oculto');
  }

  // Actualizar estadísticas
  generarInformeFinal();

  // Detener música de fondo
  stopBackgroundMusic();
}

function calculateHitProbability() {
  // Contar celdas no reveladas y barcos restantes
  let hiddenCells = 0;
  let revealedShips = 0;

  for (let i = 0; i < gameConfig.boardSize; i++) {
    for (let j = 0; j < gameConfig.boardSize; j++) {
      const cellValue = gameConfig.enemyBoard[i][j];

      if (cellValue === '-' || cellValue === 'O') {
        hiddenCells++;
      }
      if (cellValue === 'R' || cellValue === '!') {
        revealedShips++;
      }
    }
  }

  const remainingShips = gameConfig.enemyShipsTotal - revealedShips;

  // Evitar división por cero
  if (hiddenCells === 0 || remainingShips === 0) return 0.0;

  // Calcular probabilidad exacta
  const probability = (remainingShips / hiddenCells) * 100;
  
  // Limitar a 100% pero mantener decimales
  return parseFloat(Math.min(probability, 100.0).toFixed(2))
}
