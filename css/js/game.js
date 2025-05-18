var BatallaNaval = BatallaNaval || {};

(function(game) {
    game.Config = {
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
        inventory: [],
        playerBoard: [],
        enemyBoard: []
    };

    game.initGame = function(mode, shipCount) {
        game.Config.gameMode = mode;
        BatallaNaval.Board.initializeBoards();
        
        game.Config.playerShips = shipCount;
        game.Config.enemyShips = shipCount;
        
        BatallaNaval.Board.placeRandomShips(game.Config.playerBoard, game.Config.playerShips);
        BatallaNaval.Board.placeRandomShips(game.Config.enemyBoard, game.Config.enemyShips);
        
        initRemainingShips(game.Config.enemyShips);
        BatallaNaval.UI.updateShipCount();
        game.Config.isPlayerTurn = true;
        
        BatallaNaval.Sounds.startBackgroundMusic();
        BatallaNaval.Board.drawBoards();
        BatallaNaval.UI.showScreen('pantalla-juego');
    };

    function initRemainingShips(count) {
        game.Config.remainingShips = Array(count).fill().map(function() { return { size: 1 }; });
    }

    game.startQuickGame = function() {
        game.initGame('quick', Math.floor(random(3, 6)));
    };

    game.startManualPlacement = function() {
        var ships = parseInt(document.getElementById('ship-amount').value);
        if (ships < 3 || ships > 10) {
            alert("Por favor elige entre 3 y 10 barcos");
            return;
        }
        
        game.initGame('manual', ships);
        game.Config.placingShips = true;
        game.Config.shipsPlaced = 0;
        document.getElementById('manual-placement').style.display = 'none';
        BatallaNaval.UI.updateStatus("Coloca tus " + ships + " barcos. Haz clic en tu tablero.");
    };

    game.resetGame = function() {
        BatallaNaval.Sounds.stopBackgroundMusic();
        BatallaNaval.UI.showScreen('pantalla-inicio');
        BatallaNaval.Board.initializeBoards();
        BatallaNaval.UI.updateStatus("Preparando nuevo juego...");
        BatallaNaval.UI.updateShipCount();

        game.Config.inventory = [];
        game.Config.doubleShot = false;
        game.Config.predictionTurns = 0;
        BatallaNaval.UI.updateInventoryUI();
    };

    window.BatallaNaval = game;
})(BatallaNaval || {});