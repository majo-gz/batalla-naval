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

// Variables de animación
let animaciones = {};
let efectosAgua = [];
let efectosExplosion = [];
let ondas = [];
let particulas = [];
let colorTablero = {
    jugador: '#E6F7FF',   // Azul claro para el jugador
    enemigo: '#FFF0F0'    // Rojo claro para el enemigo
};

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

// Imágenes para los elementos del juego
let imagenes = {
    agua: null,
    barco: null,
    explosion: null,
    splash: null
};

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
    
    // Intentar precargar imágenes (puedes reemplazar con tus propias imágenes)
    try {
        imagenes.agua = loadImage('assets/agua.png');
        imagenes.barco = loadImage('assets/barco.png');
        imagenes.explosion = loadImage('assets/explosion.png');
        imagenes.splash = loadImage('assets/splash.png');
    } catch (e) {
        console.error("Error al cargar imágenes:", e);
        // Continuar sin imágenes
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
    
    // Gradiente para el fondo del juego (efecto de profundidad del océano)
    setGradient(0, 0, width, height, color(100, 150, 220, 50), color(50, 100, 180, 50));
    
    // Dibujar tablero del jugador
    drawBoard(playerBoard, 0, 0, false);
    
    // Dibujar tablero enemigo
    drawBoard(enemyBoard, width/2, 0, true);
    
    // Dibujar efectos de agua
    dibujarEfectosAgua();
    
    // Dibujar ondas
    dibujarOndas();
    
    // Dibujar efectos de explosión
    dibujarExplosiones();
    
    // Dibujar partículas
    dibujarParticulas();
}

function setGradient(x, y, w, h, c1, c2) {
    noFill();
    for (let i = y; i <= y + h; i++) {
        let inter = map(i, y, y + h, 0, 1);
        let c = lerpColor(c1, c2, inter);
        stroke(c);
        line(x, i, x + w, i);
    }
}

function mostrarPantalla(id) {
    document.querySelectorAll('.pantalla').forEach(div => div.classList.add('oculto'));
    document.getElementById(id).classList.remove('oculto');
}

function drawBoard(board, x, y, isEnemy) {
    push();
    translate(x, y);
    
    // Dibujar un borde con temática marina para el tablero
    strokeWeight(3);
    stroke(30, 100, 150);
    fill(isEnemy ? colorTablero.enemigo : colorTablero.jugador);
    rect(-20, -30, boardSize * cellSize + 40, boardSize * cellSize + 50, 10);
    
    // Título del tablero
    textSize(16);
    fill(0);
    textStyle(BOLD);
    text(isEnemy ? "TABLERO ENEMIGO" : "TU FLOTA", boardSize * cellSize / 2, -15);
    textStyle(NORMAL);
    
    // Sombra del tablero para efecto 3D
    noStroke();
    fill(0, 0, 0, 20);
    rect(5, 5, boardSize * cellSize, boardSize * cellSize);
    
    // Marco del tablero
    stroke(30, 60, 90);
    strokeWeight(2);
    fill(200, 220, 255, 50);
    rect(0, 0, boardSize * cellSize, boardSize * cellSize);
    
    // Dibujar celdas
    strokeWeight(1);
    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            // Dibujar contenido
            let content = board[i][j];

            // Ocultar barcos enemigos si es necesario
            if (isEnemy && content === 'O') content = '-';

            // Coordenadas del centro de la celda
            let cx = j * cellSize + cellSize/2;
            let cy = i * cellSize + cellSize/2;
            
            // Dibujar fondo de celda con patrón de agua
            stroke(100, 150, 200);
            
            // Color base de las celdas
            if (content === '-') fill(180, 200, 255, 150);     // Agua
            else if (content === 'O') fill(100, 130, 200);     // Barco
            else if (content === 'X') fill(150, 150, 170);     // Fallo
            else if (content === 'R') fill(255, 255, 100);     // Barco revelado
            else if (content === '!') fill(230, 60, 60);       // Impacto
            
            rect(j * cellSize, i * cellSize, cellSize, cellSize);
            
            // Dibujar iconos o detalles según el contenido
            noStroke();
            
            if (content === 'O') {
                // Barco con detalle
                fill(60, 90, 120);
                ellipse(cx, cy, cellSize * 0.6, cellSize * 0.6);
                fill(80, 120, 150);
                ellipse(cx, cy, cellSize * 0.4, cellSize * 0.4);
            } 
            else if (content === 'X') {
                // Marca de agua (fallo)
                for (let k = 0; k < 3; k++) {
                    stroke(255, 255, 255, 150);
                    noFill();
                    let size = map(k, 0, 2, cellSize * 0.2, cellSize * 0.6);
                    ellipse(cx, cy, size, size);
                }
            }
            else if (content === '!') {
                // Dibujar explosión estilizada
                fill(230, 60, 60);
                ellipse(cx, cy, cellSize * 0.7, cellSize * 0.7);
                fill(250, 180, 60);
                ellipse(cx, cy, cellSize * 0.5, cellSize * 0.5);
                fill(255, 255, 200);
                ellipse(cx, cy, cellSize * 0.25, cellSize * 0.25);
            }
            else if (content === 'R') {
                // Barco revelado
                fill(255, 220, 40);
                ellipse(cx, cy, cellSize * 0.6, cellSize * 0.6);
                fill(255, 180, 0);
                ellipse(cx, cy, cellSize * 0.4, cellSize * 0.4);
            }
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

// Función para crear efecto de ondas de agua
function crearOnda(x, y, lado) {
    ondas.push({
        x: x + (lado === 'enemigo' ? width/2 : 0),
        y: y,
        radio: 5,
        maxRadio: cellSize,
        alpha: 255,
        color: lado === 'enemigo' ? color(100, 100, 255) : color(100, 200, 255)
    });
}

// Función para crear salpicadura de agua
function crearEfectoAgua(x, y, lado) {
    // Agregar múltiples gotas para efecto de salpicadura
    for (let i = 0; i < 8; i++) {
        efectosAgua.push({
            x: x + (lado === 'enemigo' ? width/2 : 0),
            y: y,
            vx: random(-2, 2),
            vy: random(-4, -1),
            radio: random(2, 5),
            vida: random(20, 40),
            color: color(200, 240, 255, 200)
        });
    }
}

// Función para crear explosión
function crearExplosion(x, y, lado) {
    // Agregar varias partículas para simular explosión
    let colores = [
        color(255, 100, 0),   // Naranja
        color(255, 200, 0),   // Amarillo
        color(255, 0, 0),     // Rojo
        color(150, 0, 0)      // Rojo oscuro
    ];
    
    // Centro de la explosión
    efectosExplosion.push({
        x: x + (lado === 'enemigo' ? width/2 : 0),
        y: y,
        radio: 5,
        maxRadio: 30,
        fase: 0,
        duracion: 30
    });
    
    // Partículas de la explosión
    for (let i = 0; i < 15; i++) {
        particulas.push({
            x: x + (lado === 'enemigo' ? width/2 : 0),
            y: y,
            vx: random(-3, 3),
            vy: random(-3, 3),
            radio: random(2, 6),
            vida: random(20, 40),
            color: colores[floor(random(colores.length))]
        });
    }
}

function dibujarEfectosAgua() {
    // Actualizar y dibujar efectos de agua
    for (let i = efectosAgua.length - 1; i >= 0; i--) {
        let gota = efectosAgua[i];
        
        // Actualizar posición
        gota.x += gota.vx;
        gota.y += gota.vy;
        gota.vy += 0.2; // Gravedad
        gota.vida--;
        
        // Dibujar
        fill(gota.color);
        noStroke();
        ellipse(gota.x, gota.y, gota.radio * 2);
        
        // Eliminar si ya no es visible
        if (gota.vida <= 0) {
            efectosAgua.splice(i, 1);
        }
    }
}

function dibujarOndas() {
    // Actualizar y dibujar ondas
    for (let i = ondas.length - 1; i >= 0; i--) {
        let onda = ondas[i];
        
        // Actualizar
        onda.radio += 1;
        onda.alpha = map(onda.radio, 5, onda.maxRadio, 200, 0);
        
        // Dibujar
        noFill();
        stroke(red(onda.color), green(onda.color), blue(onda.color), onda.alpha);
        strokeWeight(2);
        ellipse(onda.x, onda.y, onda.radio * 2);
        
        // Eliminar si ya es invisible
        if (onda.radio >= onda.maxRadio) {
            ondas.splice(i, 1);
        }
    }
}

function dibujarExplosiones() {
    // Actualizar y dibujar explosiones
    for (let i = efectosExplosion.length - 1; i >= 0; i--) {
        let exp = efectosExplosion[i];
        
        // Actualizar
        exp.fase++;
        let radioActual = map(exp.fase, 0, exp.duracion, 0, exp.maxRadio);
        let alpha = map(exp.fase, 0, exp.duracion, 255, 0);
        
        // Dibujar
        noStroke();
        
        // Capa exterior - naranja
        fill(255, 150, 0, alpha * 0.7);
        ellipse(exp.x, exp.y, radioActual * 2);
        
        // Capa media - amarillo
        fill(255, 230, 0, alpha * 0.8);
        ellipse(exp.x, exp.y, radioActual * 1.5);
        
        // Núcleo - blanco
        fill(255, 255, 200, alpha);
        ellipse(exp.x, exp.y, radioActual * 0.8);
        
        // Eliminar si ya terminó
        if (exp.fase >= exp.duracion) {
            efectosExplosion.splice(i, 1);
        }
    }
}

function dibujarParticulas() {
    // Actualizar y dibujar partículas
    for (let i = particulas.length - 1; i >= 0; i--) {
        let p = particulas[i];
        
        // Actualizar
        p.x += p.vx;
        p.y += p.vy;
        p.vida--;
        
        // Aplicar fricción
        p.vx *= 0.96;
        p.vy *= 0.96;
        
        // Dibujar
        noStroke();
        fill(red(p.color), green(p.color), blue(p.color), map(p.vida, 40, 0, 255, 0));
        ellipse(p.x, p.y, p.radio * 2);
        
        // Eliminar si ya no es visible
        if (p.vida <= 0) {
            particulas.splice(i, 1);
        }
    }
}

function startQuickGame() {
    gameMode = 'quick';
    initializeBoards();
    
    // Limpiar efectos visuales
    limpiarEfectos();
    
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
    
    // Efectos visuales para inicio de juego
    crearEfectoInicioJuego();
    
    drawBoards();
    mostrarPantalla('pantalla-juego');
}

function crearEfectoInicioJuego() {
    // Crear ondas en varias celdas aleatorias para un efecto de inicio
    for (let i = 0; i < 10; i++) {
        setTimeout(() => {
            let x = floor(random(boardSize)) * cellSize + cellSize/2;
            let y = floor(random(boardSize)) * cellSize + cellSize/2;
            crearOnda(x, y, random() > 0.5 ? 'jugador' : 'enemigo');
        }, i * 100);
    }
}

function limpiarEfectos() {
    efectosAgua = [];
    efectosExplosion = [];
    ondas = [];
    particulas = [];
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
    
    // Limpiar efectos visuales
    limpiarEfectos();
    
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
    
    // Efecto visual para inicio de colocación
    for (let i = 0; i < 5; i++) {
        setTimeout(() => {
            let x = floor(random(boardSize)) * cellSize + cellSize/2;
            let y = floor(random(boardSize)) * cellSize + cellSize/2;
            crearOnda(x, y, 'jugador');
        }, i * 150);
    }

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
                
                // Efectos visuales para colocación de barco
                let cellX = col * cellSize + cellSize/2;
                let cellY = row * cellSize + cellSize/2;
                crearOnda(cellX, cellY, 'jugador');
                
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
                    enemyShips--;
                    updateStatus("¡Impacto! Has hundido un barco enemigo.");
                    
                    // Efectos visuales de explosión
                    let cellX = col * cellSize + cellSize/2;
                    let cellY = row * cellSize + cellSize/2;
                    crearExplosion(cellX, cellY, 'enemigo');
                    
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
                    
                    // Efectos visuales de agua
                    let cellX = col * cellSize + cellSize/2;
                    let cellY = row * cellSize + cellSize/2;
                    crearEfectoAgua(cellX, cellY, 'enemigo');
                    crearOnda(cellX, cellY, 'enemigo');
                    
                    // Continuación de la función mousePressed()
                    if (sonidoAgua) {
                        try {
                            sonidoAgua.play();
                        } catch (e) {
                            console.error("Error al reproducir sonido:", e);
                        }
                    }
                    
                } else {
                    // Celda ya atacada, no hacer nada
                    return;
                }
                
                // Actualizar conteo de barcos
                updateShipCount();
                
                // Comprobar victoria
                if (enemyShips <= 0) {
                    gameOver(true);
                    return;
                }
                
                // Cambiar turno
                isPlayerTurn = false;
                setTimeout(computerTurn, 1000); // Retraso para el turno del enemigo
                
                // Redibujar tableros
                drawBoards();
            }
        }
    }
}

function computerTurn() {
    if (isPlayerTurn) return; // No es el turno de la computadora
    
    // La IA elige una celda aleatoria que no ha sido atacada
    let row, col;
    let validMove = false;
    
    // Si está activado el modo de predicción, tiene mayor probabilidad de acertar
    if (modoPrediccionTurnos > 0) {
        // Buscar barcos del jugador
        let barcos = [];
        for (let i = 0; i < boardSize; i++) {
            for (let j = 0; j < boardSize; j++) {
                if (playerBoard[i][j] === 'O') {
                    barcos.push({row: i, col: j});
                }
            }
        }
        
        // 75% de probabilidad de acertar con la predicción
        if (barcos.length > 0 && random() < 0.75) {
            let objetivo = barcos[floor(random(barcos.length))];
            row = objetivo.row;
            col = objetivo.col;
            validMove = true;
            modoPrediccionTurnos--;
        }
    }
    
    // Si no se encontró un movimiento válido con predicción o no está activado el modo
    if (!validMove) {
        let intentos = 0;
        // Máximo 100 intentos para evitar bucles infinitos
        while (!validMove && intentos < 100) {
            row = floor(random(boardSize));
            col = floor(random(boardSize));
            
            // Verificar que la celda no ha sido atacada antes
            if (playerBoard[row][col] === 'O' || playerBoard[row][col] === '-') {
                validMove = true;
            }
            intentos++;
        }
    }
    
    // Si se ha encontrado un movimiento válido
    if (validMove) {
        if (playerBoard[row][col] === 'O') {
            playerBoard[row][col] = '!';
            playerShips--;
            updateStatus("¡La IA ha impactado uno de tus barcos!");
            
            // Efectos visuales
            let cellX = col * cellSize + cellSize/2;
            let cellY = row * cellSize + cellSize/2;
            crearExplosion(cellX, cellY, 'jugador');
            
            if (sonidoImpactoIA) {
                try {
                    sonidoImpactoIA.play();
                } catch (e) {
                    console.error("Error al reproducir sonido:", e);
                }
            }
        } else {
            playerBoard[row][col] = 'X';
            updateStatus("La IA ha fallado su disparo.");
            
            // Efectos visuales
            let cellX = col * cellSize + cellSize/2;
            let cellY = row * cellSize + cellSize/2;
            crearEfectoAgua(cellX, cellY, 'jugador');
            crearOnda(cellX, cellY, 'jugador');
            
            if (sonidoAgua) {
                try {
                    sonidoAgua.play();
                } catch (e) {
                    console.error("Error al reproducir sonido:", e);
                }
            }
        }
        
        // Actualizar conteo de barcos
        updateShipCount();
        
        // Comprobar derrota
        if (playerShips <= 0) {
            gameOver(false);
            return;
        }
        
        // Cambiar turno
        isPlayerTurn = true;
    }
    
    // Actualizar doble disparo si está activo
    if (modoDobleDisparo) {
        modoDobleDisparo = false;
        // Hacer un segundo disparo si está activado
        setTimeout(computerTurn, 1000);
        return;
    }
    
    // Redibujar tableros
    drawBoards();
}

function gameOver(playerWon) {
    isPlayerTurn = false; // Finalizar el juego
    
    // Detener música de fondo
    if (musicaFondo && musicaFondo.isPlaying()) {
        musicaFondo.stop();
        musicaIniciada = false;
    }
    
    // Reproducir sonido de victoria o derrota
    try {
        if (playerWon && sonidoVictoria) {
            sonidoVictoria.play();
        } else if (!playerWon && sonidoDerrota) {
            sonidoDerrota.play();
        }
    } catch (e) {
        console.error("Error al reproducir sonido:", e);
    }
    
    // Efectos visuales para fin de juego
    for (let i = 0; i < 10; i++) {
        setTimeout(() => {
            if (playerWon) {
                // Efectos para victoria - explosiones en el tablero enemigo
                let x = floor(random(boardSize)) * cellSize + cellSize/2;
                let y = floor(random(boardSize)) * cellSize + cellSize/2;
                crearExplosion(x, y, 'enemigo');
            } else {
                // Efectos para derrota - explosiones en el tablero del jugador
                let x = floor(random(boardSize)) * cellSize + cellSize/2;
                let y = floor(random(boardSize)) * cellSize + cellSize/2;
                crearExplosion(x, y, 'jugador');
            }
        }, i * 300);
    }
    
    // Mostrar mensaje de fin de juego
    if (playerWon) {
        updateStatus("¡VICTORIA! Has destruido toda la flota enemiga.");
        mostrarPantallaFinal(true);
    } else {
        updateStatus("¡DERROTA! Tu flota ha sido destruida.");
        mostrarPantallaFinal(false);
    }
    
    // Revelar barcos enemigos restantes
    if (playerWon) {
        revealRemainingShips();
    }
}

function revealRemainingShips() {
    // Mostrar los barcos restantes del enemigo (para verificación)
    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            if (enemyBoard[i][j] === 'O') {
                enemyBoard[i][j] = 'R'; // Marcar como revelado
            }
        }
    }
    drawBoards();
}

function updateStatus(message) {
    document.getElementById('game-status').innerText = message;
}

function updateShipCount() {
    document.getElementById('player-ships').innerText = playerShips;
    document.getElementById('enemy-ships').innerText = enemyShips;
}

function mostrarPantallaFinal(victoria) {
    let pantallaFinal = document.getElementById('pantalla-final');
    let mensajeFinal = document.getElementById('mensaje-final');
    
    if (victoria) {
        mensajeFinal.innerText = "¡VICTORIA!";
        mensajeFinal.className = "victoria";
    } else {
        mensajeFinal.innerText = "¡DERROTA!";
        mensajeFinal.className = "derrota";
    }
    
    pantallaFinal.classList.remove('oculto');
    
    // Botón para volver al menú
    document.getElementById('btn-volver').addEventListener('click', () => {
        pantallaFinal.classList.add('oculto');
        mostrarPantalla('pantalla-inicio');
        gameMode = '';
    });
}

// Nuevas funciones para manejar elementos del juego

// Usar items especiales
function usarItem(tipoItem) {
    if (!isPlayerTurn || !gameMode) return;
    
    switch(tipoItem) {
        case 'radar':
            // Revelar un barco enemigo aleatorio
            revelarBarcoAleatorio();
            break;
        case 'dobleDisparo':
            // Activar modo de doble disparo para la IA
            modoDobleDisparo = true;
            updateStatus("¡Activado doble disparo para el enemigo!");
            break;
        case 'prediccion':
            // Activar modo de predicción por 3 turnos
            modoPrediccionTurnos = 3;
            updateStatus("¡Modo predicción activado por 3 turnos!");
            break;
    }
}

function revelarBarcoAleatorio() {
    // Buscar barcos enemigos no descubiertos
    let barcosOcultos = [];
    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            if (enemyBoard[i][j] === 'O') {
                barcosOcultos.push({row: i, col: j});
            }
        }
    }
    
    // Revelar un barco aleatorio si hay disponibles
    if (barcosOcultos.length > 0) {
        let barcoElegido = barcosOcultos[floor(random(barcosOcultos.length))];
        enemyBoard[barcoElegido.row][barcoElegido.col] = 'R'; // Marcar como revelado
        
        // Efecto visual
        let cellX = barcoElegido.col * cellSize + cellSize/2;
        let cellY = barcoElegido.row * cellSize + cellSize/2;
        
        // Crear efecto especial de revelación
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                crearOnda(cellX, cellY, 'enemigo');
            }, i * 200);
        }
        
        updateStatus("¡Radar activado! Se ha revelado un barco enemigo.");
        drawBoards();
    } else {
        updateStatus("No hay barcos enemigos para revelar.");
    }
}

function draw() {
    // Actualizar y redibujar el juego en cada frame
    drawBoards();
}

// Función auxiliar para botones
function configurarBotones() {
    // Añadir listeners para botones de items
    document.getElementById('btn-radar').addEventListener('click', () => usarItem('radar'));
    document.getElementById('btn-doble-disparo').addEventListener('click', () => usarItem('dobleDisparo'));
    document.getElementById('btn-prediccion').addEventListener('click', () => usarItem('prediccion'));
    
    // Botón para volver al menú principal desde el juego
    document.getElementById('btn-menu').addEventListener('click', () => {
        if (confirm('¿Seguro que deseas volver al menú principal? Se perderá la partida actual.')) {
            if (musicaFondo && musicaFondo.isPlaying()) {
                musicaFondo.stop();
                musicaIniciada = false;
            }
            mostrarPantalla('pantalla-inicio');
            gameMode = '';
        }
    });
}

// Llamar a configurar botones cuando la página cargue
window.addEventListener('load', configurarBotones);