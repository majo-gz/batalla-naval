//Variables
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
let barcosRestantes = [];

//Efectos de sonido
let musicaFondo;
let sonidoImpactoJugador;
let sonidoImpactoIA;
let sonidoAgua;
let sonidoColocarBarco;
let sonidoVictoria;
let sonidoDerrota;
let musicaIniciada = false; // Para evitar que se reinicie cada vez

//ITEMS
let inventarioJugador = [];
let modoDobleDisparo = false;
let modoPrediccionTurnos = 0;

let parpadeo = {}; // Objeto para guardar qué celdas están parpadeando
let ultimoTiempoLimpieza = 0; // Para limpiar el objeto parpadeo periódicamente

function preload() {
    // Cargar sonidos con manejo de errores
    try {
        musicaFondo = loadSound('sonidos/musicaFondo.mp3');
        sonidoVictoria = loadSound('sonidos/victoria.mp3');
        sonidoDerrota = loadSound('sonidos/derrota.mp3');
        sonidoImpactoJugador = loadSound('sonidos/impactoJugador.mp3');
        sonidoImpactoIA = loadSound('sonidos/impactoIA.mp3');
        sonidoAgua = loadSound('sonidos/agua.mp3');
        sonidoColocarBarco = loadSound('sonidos/colocarBarco.mp3');
    } catch (e) {
        console.error("Error al cargar sonidos:", e);
    }
}

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

    //Sonido
    userStartAudio(); // Habilita el sistema de audio tras interacción
    
    // Establecer framerate para optimizar rendimiento
    frameRate(30);
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

function mostrarPantalla(id) {
    document.querySelectorAll('.pantalla').forEach(div => div.classList.add('oculto'));
    document.getElementById(id).classList.remove('oculto');
}

function drawBoard(board, x, y, isEnemy) {
    push();
    translate(x, y);
    
    // Dibujar celdas
    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            // Dibujar contenido
            let content = board[i][j];

            // Ocultar barcos enemigos si es necesario
            if (isEnemy && content === 'O') content = '-';

            // Determinar color según contenido
            if (content === '-') fill('#F4F4F4');     // Agua
            else if (content === 'O') fill('#87CEFA'); // Barco
            else if (content === 'X') fill('#A9A9A9'); // Fallo
            else if (content === 'R') fill('#FFFF66'); // Barco revelado (amarillo)
            else if (content === '!') {
                // Si está en parpadeo
                const key = `${i},${j}`;
                if (parpadeo[key] && (frameCount - parpadeo[key]) % 30 < 15) {
                    fill('#FF0000'); // Rojo fuerte
                } else {
                    fill('#E64832'); // Color normal
                }
            }

            // Dibujar celda con color
            stroke(0);
            rect(j * cellSize, i * cellSize, cellSize, cellSize);
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

    // Inicializar barcosRestantes con objetos independientes
    crearBarcosRestantes(enemyShips);

    updateStatus(`Modo Rápido - ${playerShips} barcos cada uno. Tu turno!`);
    updateShipCount();
    isPlayerTurn = true;
    placingShips = false;
    
    //Sonido
    iniciarMusicaFondo();
    
    drawBoards();
    mostrarPantalla('pantalla-juego');
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

    // Inicializar barcosRestantes con objetos independientes
    crearBarcosRestantes(enemyShips);
    
    document.getElementById('manual-placement').style.display = 'none';
    updateStatus(`Coloca tus ${shipsToPlace} barcos. Haz clic en tu tablero.`);
    updateShipCount();
    drawBoards();

    //Sonido
    iniciarMusicaFondo();

    mostrarPantalla('pantalla-juego');
}

// Función auxiliar para iniciar música de fondo
function iniciarMusicaFondo() {
    if (!musicaIniciada && musicaFondo) {
        try {
            musicaFondo.setVolume(0.3);
            musicaFondo.loop();
            musicaIniciada = true;
        } catch (e) {
            console.error("Error al iniciar música:", e);
        }
    }
}

// Función para crear barcos restantes con objetos independientes
function crearBarcosRestantes(cantidad) {
    barcosRestantes = [];
    for (let i = 0; i < cantidad; i++) {
        barcosRestantes.push({ tamaño: 1 });
    }
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

function marcarImpacto(row, col) {
    parpadeo[`${row},${col}`] = frameCount;
}

// Limpiar parpadeos antiguos para evitar fugas de memoria
function limpiarParpadeos() {
    const ahora = frameCount;
    if (ahora - ultimoTiempoLimpieza > 300) { // Cada ~10 segundos a 30 FPS
        ultimoTiempoLimpieza = ahora;
        for (const key in parpadeo) {
            if (ahora - parpadeo[key] > 120) { // 4 segundos a 30 FPS
                delete parpadeo[key];
            }
        }
    }
}

function mousePressed() {
    // Verificar si el juego está activo
    if (!gameMode) return;
    
    // Obtener coordenadas de clic relativas al canvas
    const canvasRect = document.querySelector('canvas').getBoundingClientRect();
    const canvasX = mouseX;
    const canvasY = mouseY;
    
    // Comprobar si el clic está dentro del canvas
    if (canvasX < 0 || canvasY < 0 || canvasX > width || canvasY > height) {
        return; // Clic fuera del canvas
    }
    
    // Modo manual: colocación de barcos
    if (placingShips) {
        // Verificar clic en tablero del jugador (mitad izquierda)
        if (canvasX < width/2) {
            let col = floor(canvasX / cellSize);
            let row = floor(canvasY / cellSize);
            
            if (row >= 0 && row < boardSize && col >= 0 && col < boardSize && 
                playerBoard[row][col] === '-') {
                playerBoard[row][col] = 'O';
                shipsPlaced++;
                
                if (sonidoColocarBarco) {
                    try {
                        sonidoColocarBarco.play();
                    } catch (e) {
                        console.error("Error al reproducir sonido:", e);
                    }
                }
                
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
    if (isPlayerTurn) {
        // Verificar clic en tablero enemigo (mitad derecha)
        if (canvasX > width/2) {
            let col = floor((canvasX - width/2) / cellSize);
            let row = floor(canvasY / cellSize);
            
            // Verificar que las coordenadas son válidas
            if (row >= 0 && row < boardSize && col >= 0 && col < boardSize) {
                // Verificar que la celda no ha sido atacada previamente
                if (enemyBoard[row][col] === 'O' || enemyBoard[row][col] === 'R') {
                    enemyBoard[row][col] = '!';
                    marcarImpacto(row, col);
                    enemyShips--;
                    updateStatus("¡Impacto! Has hundido un barco enemigo.");
                    
                    if (sonidoImpactoJugador) {
                        try {
                            sonidoImpactoJugador.play();
                        } catch (e) {
                            console.error("Error al reproducir sonido:", e);
                        }
                    }
                } else if (enemyBoard[row][col] === '-') {
                    enemyBoard[row][col] = 'X';
                    updateStatus("Agua... no hay barco en esa posición.");
                    
                    if (sonidoAgua) {
                        try {
                            sonidoAgua.play();
                        } catch (e) {
                            console.error("Error al reproducir sonido:", e);
                        }
                    }
                } else {
                    // Ya se ha atacado esta celda
                    return;
                }
                
                // Verificar si el jugador ganó
                if (enemyShips <= 0) {
                    updateStatus("¡Felicidades! Has ganado el juego.");
                    if (musicaFondo && musicaFondo.isPlaying()) {
                        musicaFondo.stop();
                    }
                    
                    if (sonidoVictoria) {
                        try {
                            sonidoVictoria.play();
                        } catch (e) {
                            console.error("Error al reproducir sonido:", e);
                        }
                    }
                    
                    mostrarPantalla('pantalla-victoria');
                    return;
                }
                
                // Si está en modo doble disparo, mantener el turno del jugador
                if (modoDobleDisparo) {
                    modoDobleDisparo = false;
                    updateStatus("¡Disparo doble activado! Puedes disparar una vez más.");
                } else {
                    isPlayerTurn = false;
                    drawBoards();
                    
                    // Turno de la IA después de un breve retraso
                    setTimeout(aiTurn, 1000);
                }
                
                updateShipCount();
                drawBoards();
            }
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
        marcarImpacto(y, x);
        playerShips--;
        updateStatus("La IA ha impactado uno de tus barcos!");
        
        if (sonidoImpactoIA) {
            try {
                sonidoImpactoIA.play();
            } catch (e) {
                console.error("Error al reproducir sonido:", e);
            }
        }
    } else {
        playerBoard[y][x] = 'X';
        updateStatus("La IA ha atacado y falló. Tu turno!");
        
        if (sonidoAgua) {
            try {
                sonidoAgua.play();
            } catch (e) {
                console.error("Error al reproducir sonido:", e);
            }
        }
    }
    
    updateShipCount();
    drawBoards();
    
    // Verificar si la IA ganó
    if (playerShips <= 0) {
        updateStatus("¡La IA ha ganado! Mejor suerte la próxima vez.");
        
        if (musicaFondo && musicaFondo.isPlaying()) {
            musicaFondo.stop();
        }
        
        if (sonidoDerrota) {
            try {
                sonidoDerrota.play();
            } catch (e) {
                console.error("Error al reproducir sonido:", e);
            }
        }
        
        mostrarPantalla('pantalla-derrota');
        return;
    }
    
    // Inicio del turno del jugador
    empezarTurnoJugador();
}

function updateStatus(message) {
    document.getElementById('status').textContent = message;
}

function updateShipCount() {
    document.getElementById('ship-count').textContent = 
        `Tus barcos: ${playerShips} | Barcos enemigos: ${enemyShips}`;
}

//
//Items

function empezarTurnoJugador() {
    isPlayerTurn = true;
    sortearItem(); // Ya tiene su propia lógica interna de probabilidad
    
    updateStatus("¡Tu turno!");
}

function sortearItem() {
    console.log("Sorteando ítem...");
    const chance = 0.3; // 30% de probabilidad
    if (Math.random() < chance) {
        const opciones = ['radar', 'doble', 'prediccion', 'revelar'];
        const item = opciones[Math.floor(Math.random() * opciones.length)];
        inventarioJugador.push(item);
        console.log(`Item obtenido: ${item}`);
        mostrarMensaje(`¡Has obtenido un ítem: ${nombreBonito(item)}!`);
        actualizarInventarioUI();
    }
}

function usarItem(codigo, index) {
    switch (codigo) {
        case 'radar':
            activarRadar();
            break;
        case 'doble':
            modoDobleDisparo = true;
            mostrarMensaje("¡Disparo doble activado! Tu próximo disparo no gastará turno.");
            break;
        case 'prediccion':
            modoPrediccionTurnos = 3; // 3 turnos como indica el comentario
            mostrarMensaje("¡Modo de predicción activado por 3 turnos!");
            break;
        case 'revelar':
            revelarBarco();
            break;
    }
    // Eliminar el ítem usado
    inventarioJugador.splice(index, 1);
    actualizarInventarioUI();
}

function nombreBonito(codigo) {
    switch (codigo) {
        case 'radar': return 'Radar';
        case 'doble': return 'Disparo Doble';
        case 'prediccion': return 'Modo de Predicción';
        case 'revelar': return 'Revelar Posición';
        default: return 'Ítem';
    }
}

function actualizarInventarioUI() {
    console.log("Actualizando UI del inventario", inventarioJugador);

    const contenedor = document.getElementById('items-disponibles');
    if (!contenedor) return;
    
    contenedor.innerHTML = '';
    inventarioJugador.forEach((item, index) => {
        const btn = document.createElement('button');
        btn.textContent = nombreBonito(item);
        btn.onclick = () => usarItem(item, index);
        contenedor.appendChild(btn);
    });
}

function activarRadar() {
    let i = Math.floor(Math.random() * boardSize);
    let j = Math.floor(Math.random() * boardSize);
    let hayBarco = false;

    for (let x = i - 1; x <= i + 1; x++) {
        for (let y = j - 1; y <= j + 1; y++) {
            if (x >= 0 && y >= 0 && x < boardSize && y < boardSize) {
                if (enemyBoard[x][y] === 'O') {
                    hayBarco = true;
                }
            }
        }
    }

    mostrarMensaje(`Radar escaneó una zona: ${hayBarco ? '¡Posible barco en la zona!' : 'Zona limpia.'}`);
}

function hayBarcoEn(x, y) {
    if (x < 0 || y < 0 || x >= boardSize || y >= boardSize) return false;
    return enemyBoard[x][y] === 'O' || enemyBoard[x][y] === 'R';
}

function draw() {
    // Limpiar parpadeos antiguos periódicamente
    limpiarParpadeos();
    
    // Dibujar tableros solo si hay cambios
    drawBoards();

    // Mostrar mapa de calor si está en modo predicción
    if (modoPrediccionTurnos > 0) {
        // Solo mostrar en el tablero enemigo
        push();
        translate(width/2, 0);
        
        const mapaCalor = normalizarMapa(calcularMapaCalor(enemyBoard, barcosRestantes));
        for (let i = 0; i < boardSize; i++) {
            for (let j = 0; j < boardSize; j++) {
                const prob = mapaCalor[i][j];
                if (prob > 0) {
                    fill(255, 0, 0, prob * 150); // Rojo transparente
                    noStroke();
                    rect(j * cellSize, i * cellSize, cellSize, cellSize);
                }
            }
        }
        
        pop();
    }
}

function revelarBarco() {
    let posibles = [];
    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            if (enemyBoard[i][j] === 'O') {
                posibles.push({ x: j, y: i });
            }
        }
    }

    if (posibles.length === 0) {
        mostrarMensaje("No hay más barcos por revelar.");
        return;
    }

    let celda = posibles[Math.floor(Math.random() * posibles.length)];
    enemyBoard[celda.y][celda.x] = 'R';
    mostrarMensaje("¡Un barco enemigo ha sido revelado!");
}

function calcularMapaCalor(enemyBoard, barcosRestantes) {
    const boardSize = enemyBoard.length;
    const mapa = Array.from({ length: boardSize }, () =>
        Array(boardSize).fill(0)
    );

    // Verificamos que barcosRestantes sea un array válido
    if (!Array.isArray(barcosRestantes)) return mapa;

    barcosRestantes.forEach(barco => {
        if (!barco || typeof barco.tamaño !== 'number') return;
        
        const tam = barco.tamaño;
        for (let i = 0; i < boardSize; i++) {
            for (let j = 0; j < boardSize; j++) {

                // Horizontal
                if (j + tam <= boardSize) {
                    let posible = true;
                    for (let k = 0; k < tam; k++) {
                        if (enemyBoard[i][j + k] !== '-') {
                            posible = false;
                            break;
                        }
                    }
                    if (posible) {
                        for (let k = 0; k < tam; k++) {
                            mapa[i][j + k]++;
                        }
                    }
                }

                // Vertical
                if (i + tam <= boardSize) {
                    let posible = true;
                    for (let k = 0; k < tam; k++) {
                        if (enemyBoard[i + k][j] !== '-') {
                            posible = false;
                            break;
                        }
                    }
                    if (posible) {
                        for (let k = 0; k < tam; k++) {
                            mapa[i + k][j]++;
                        }
                    }
                }
            }
        }
    });

    return mapa;
}

function normalizarMapa(mapa) {
    const valores = mapa.flat();
    const max = valores.length > 0 ? Math.max(...valores) : 1;
    
    // Evitar división por cero
    return mapa.map(fila =>
        fila.map(valor => max > 0 ? valor / max : 0)
    );
}

function mostrarMensaje(texto) {
    const status = document.getElementById('status');
    if (!status) return;
    
    status.textContent = texto;

    // Mostrar por unos segundos y luego restaurar
    setTimeout(() => {
        if (isPlayerTurn) {
            updateStatus("Tu turno");
        } else {
            updateStatus("Turno de la IA");
        }
    }, 3000);
}

function reiniciarJuego() {
    if (musicaFondo && musicaFondo.isPlaying()) {
        musicaFondo.stop();
    }
    musicaIniciada = false;
    mostrarPantalla('pantalla-inicio');
    initializeBoards();
    updateStatus("Esperando...");
    updateShipCount();

    inventarioJugador = [];
    modoDobleDisparo = false;
    modoPrediccionTurnos = 0;
    actualizarInventarioUI();
}
