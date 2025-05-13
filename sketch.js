// Variables del juego
let tamañoTablero = 8; // Tamaño fijo o podrías mantener los prompts
let miTablero;
let tableroEnemigo;
let misBarcos = 3;
let barcosEnemigos = 3;
let turnoJugador = true;
let juegoConfigurado = false;
let juegoTerminado = false;
let anchoCelda = 40;
let margen = 50;

function setup() {
  createCanvas(800, 500);
  textAlign(CENTER, CENTER);
  
  // Inicializar tableros
  miTablero = crearTablero(tamañoTablero);
  tableroEnemigo = crearTablero(tamañoTablero);
  
  // Colocar barcos aleatoriamente (o podrías hacer que el jugador los coloque)
  colocarBarcosAleatorios(miTablero, misBarcos);
  colocarBarcosAleatorios(tableroEnemigo, barcosEnemigos);
  
  juegoConfigurado = true;
}

function draw() {
  background(240);
  
  // Dibujar título
  fill(0);
  textSize(24);
  text("Batalla Naval", width/2, 30);
  
  // Dibujar tableros
  dibujarTablero(miTablero, margen, 80, false, "Tu Tablero");
  dibujarTablero(tableroEnemigo, width/2 + margen, 80, true, "Tablero Enemigo");
  
  // Mostrar estado del juego
  textSize(16);
  text(`Tus barcos: ${misBarcos} | Barcos enemigos: ${barcosEnemigos}`, width/2, 60);
  
  if (juegoTerminado) {
    fill(0);
    textSize(32);
    let mensaje = misBarcos > barcosEnemigos ? "¡VICTORIA!" : "¡DERROTA!";
    text(mensaje, width/2, height - 50);
  }
}

function mousePressed() {
  if (!turnoJugador || juegoTerminado || !juegoConfigurado) return;
  
  // Verificar clic en tablero enemigo
  let tableroX = width/2 + margen;
  let tableroY = 80;
  let tableroAncho = tamañoTablero * anchoCelda;
  
  if (mouseX > tableroX && mouseX < tableroX + tableroAncho &&
      mouseY > tableroY && mouseY < tableroY + tableroAncho) {
    
    let col = floor((mouseX - tableroX) / anchoCelda);
    let fila = floor((mouseY - tableroY) / anchoCelda);
    
    // Realizar ataque
    if (tableroEnemigo[fila][col] === '-' || tableroEnemigo[fila][col] === 'O') {
      if (atacar(col, fila, tableroEnemigo)) {
        barcosEnemigos--;
      }
      
      turnoJugador = false;
      
      // Turno de la IA después de un breve retraso
      setTimeout(turnoIA, 1000);
    }
  }
}

function turnoIA() {
  if (juegoTerminado) return;
  
  // Ataque aleatorio de la IA
  let x, y;
  do {
    x = floor(random(tamañoTablero));
    y = floor(random(tamañoTablero));
  } while (miTablero[y][x] === 'x' || miTablero[y][x] === '!');
  
  if (atacar(x, y, miTablero)) {
    misBarcos--;
  }
  
  // Verificar fin del juego
  if (misBarcos === 0 || barcosEnemigos === 0) {
    juegoTerminado = true;
  }
  
  turnoJugador = true;
}

// Funciones del juego (adaptadas para p5.js)
function crearTablero(tamaño) {
  let tablero = [];
  for (let i = 0; i < tamaño; i++) {
    tablero[i] = [];
    for (let j = 0; j < tamaño; j++) {
      tablero[i][j] = '-';
    }
  }
  return tablero;
}

function colocarBarcosAleatorios(tablero, cantidad) {
  for (let i = 0; i < cantidad; i++) {
    let x, y;
    do {
      x = floor(random(tablero.length));
      y = floor(random(tablero.length));
    } while (tablero[y][x] === 'O');
    
    tablero[y][x] = 'O';
  }
}

function atacar(x, y, tablero) {
  if (tablero[y][x] == 'O') {
    tablero[y][x] = '!';
    return true;
  } else if (tablero[y][x] == '-') {
    tablero[y][x] = 'x';
    return false;
  }
  return false;
}

function dibujarTablero(tablero, x, y, esEnemigo, titulo) {
  push();
  translate(x, y);
  
  // Dibujar título
  fill(0);
  textSize(16);
  text(titulo, (tablero.length * anchoCelda)/2, -20);
  
  // Dibujar celdas
  for (let fila = 0; fila < tablero.length; fila++) {
    for (let col = 0; col < tablero.length; col++) {
      // Dibujar celda
      stroke(0);
      fill(255);
      rect(col * anchoCelda, fila * anchoCelda, anchoCelda, anchoCelda);
      
      // Dibujar contenido
      let mostrar = tablero[fila][col];
      if (esEnemigo && mostrar === 'O') mostrar = '-';
      
      fill(0);
      textSize(20);
      
      if (mostrar === 'O') fill(0, 0, 255); // Barco (azul)
      else if (mostrar === '!') fill(255, 0, 0); // Impacto (rojo)
      else if (mostrar === 'x') fill(200); // Fallo (gris)
      
      text(mostrar, col * anchoCelda + anchoCelda/2, fila * anchoCelda + anchoCelda/2);
    }
  }
  
  // Dibujar coordenadas
  fill(0);
  textSize(12);
  for (let i = 0; i < tablero.length; i++) {
    // Columnas (arriba)
    text(i, i * anchoCelda + anchoCelda/2, -10);
    // Filas (izquierda)
    text(i, -15, i * anchoCelda + anchoCelda/2);
  }
  
  pop();
}
