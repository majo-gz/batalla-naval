var BatallaNaval = BatallaNaval || {};

(function(items) {
    items.tryGetItem = function() {
        console.log("Sorteando ítem...");
        if (Math.random() < 0.3) {
            var itemList = ['radar', 'doble', 'prediccion', 'revelar'];
            var item = itemList[Math.floor(Math.random() * itemList.length)];
            BatallaNaval.game.Config.inventory.push(item);
            console.log("Item obtenido: " + item);
            BatallaNaval.UI.showMessage("¡Has obtenido un ítem: " + BatallaNaval.UI.getItemName(item) + "!");
            BatallaNaval.UI.updateInventoryUI();
        }
    };

    items.useItem = function(item) {
        var used = false;
        
        switch(item) {
            case 'radar':
                used = items.revealRandomShip();
                break;
            case 'doble':
                BatallaNaval.game.Config.doubleShot = true;
                BatallaNaval.UI.updateStatus("¡Activado doble disparo!");
                used = true;
                break;
            case 'prediccion':
                BatallaNaval.game.Config.predictionTurns = 3;
                BatallaNaval.UI.updateStatus("¡Modo predicción activado por 3 turnos!");
                used = true;
                break;
            case 'revelar':
                used = items.revealRandomPosition();
                break;
            default:
                BatallaNaval.UI.updateStatus("Item desconocido.");
        }
        
        if (used) {
            var index = BatallaNaval.game.Config.inventory.indexOf(item);
            if (index > -1) {
                BatallaNaval.game.Config.inventory.splice(index, 1);
            }
            BatallaNaval.UI.updateInventoryUI();
        }
    };

    items.revealRandomShip = function() {
        var hiddenShips = [];
        
        for (var i = 0; i < BatallaNaval.game.Config.boardSize; i++) {
            for (var j = 0; j < BatallaNaval.game.Config.boardSize; j++) {
                if (BatallaNaval.game.Config.enemyBoard[i][j] === 'O') {
                    hiddenShips.push({row: i, col: j});
                }
            }
        }
        
        if (hiddenShips.length > 0) {
            var ship = hiddenShips[floor(random(hiddenShips.length))];
            BatallaNaval.game.Config.enemyBoard[ship.row][ship.col] = 'R';
            
            BatallaNaval.UI.updateStatus("¡Radar activado! Se ha revelado un barco enemigo.");
            BatallaNaval.Board.drawBoards();
            return true;
        }
        
        BatallaNaval.UI.updateStatus("No hay barcos enemigos para revelar.");
        return false;
    };

    items.revealRandomPosition = function() {
        var emptyCells = [];
        
        for (var i = 0; i < BatallaNaval.game.Config.boardSize; i++) {
            for (var j = 0; j < BatallaNaval.game.Config.boardSize; j++) {
                if (BatallaNaval.game.Config.enemyBoard[i][j] === '-') {
                    emptyCells.push({row: i, col: j});
                }
            }
        }
        
        if (emptyCells.length > 0) {
            var cell = emptyCells[floor(random(emptyCells.length))];
            BatallaNaval.game.Config.enemyBoard[cell.row][cell.col] = 'X';
            
            BatallaNaval.UI.updateStatus("¡Posición revelada! Se ha marcado como agua.");
            BatallaNaval.Board.drawBoards();
            return true;
        }
        
        BatallaNaval.UI.updateStatus("No hay celdas para revelar.");
        return false;
    };

    window.BatallaNaval.Items = items;
})(BatallaNaval.Items || {});