var BatallaNaval = BatallaNaval || {};

(function(board) {
    board.initializeBoards = function() {
        BatallaNaval.game.Config.playerBoard = board.createEmptyBoard();
        BatallaNaval.game.Config.enemyBoard = board.createEmptyBoard();
    };

    board.createEmptyBoard = function() {
        return Array(BatallaNaval.game.Config.boardSize).fill().map(function() {
            return Array(BatallaNaval.game.Config.boardSize).fill('-');
        });
    };

    board.drawBoards = function() {
        clear();
        background(240);
        
        board.drawBoard(BatallaNaval.game.Config.playerBoard, 0, 0, false);
        board.drawBoard(BatallaNaval.game.Config.enemyBoard, width/2, 0, true);
    };

    board.drawBoard = function(board, x, y, isEnemy) {
        push();
        translate(x, y);
        
        for (var i = 0; i < BatallaNaval.game.Config.boardSize; i++) {
            for (var j = 0; j < BatallaNaval.game.Config.boardSize; j++) {
                var content = isEnemy && board[i][j] === 'O' ? '-' : board[i][j];
                board.setCellColor(content, i, j);
                
                stroke(0);
                rect(j * BatallaNaval.game.Config.cellSize, i * BatallaNaval.game.Config.cellSize, 
                     BatallaNaval.game.Config.cellSize, BatallaNaval.game.Config.cellSize);
            }
        }
        
        board.drawCoordinates();
        pop();
    };

    board.setCellColor = function(content, row, col) {
        var colors = {
            '-': '#F4F4F4',
            'O': '#87CEFA',
            'X': '#A9A9A9',
            'R': '#FFFF66',
            '!': board.isBlinking(row, col) ? '#FF0000' : '#E64832'
        };
        
        fill(colors[content] || '#F4F4F4');
    };

    board.isBlinking = function(row, col) {
        var key = row + ',' + col;
        return BatallaNaval.game.Config.blinkEffect[key] && 
               (frameCount - BatallaNaval.game.Config.blinkEffect[key]) % 30 < 15;
    };

    board.drawCoordinates = function() {
        fill(0);
        textSize(12);
        for (var i = 0; i < BatallaNaval.game.Config.boardSize; i++) {
            text(i, i * BatallaNaval.game.Config.cellSize + BatallaNaval.game.Config.cellSize/2, -10);
            text(i, -15, i * BatallaNaval.game.Config.cellSize + BatallaNaval.game.Config.cellSize/2);
        }
    };

    board.placeRandomShips = function(board, count) {
        var placed = 0;
        while (placed < count) {
            var x = floor(random(BatallaNaval.game.Config.boardSize));
            var y = floor(random(BatallaNaval.game.Config.boardSize));
            
            if (board[y][x] === '-') {
                board[y][x] = 'O';
                placed++;
            }
        }
    };

    board.markHit = function(row, col) {
        BatallaNaval.game.Config.blinkEffect[row + ',' + col] = frameCount;
    };

    board.cleanOldBlinks = function() {
        var now = frameCount;
        if (now - BatallaNaval.game.Config.lastBlinkCleanup > 300) {
            BatallaNaval.game.Config.lastBlinkCleanup = now;
            for (var key in BatallaNaval.game.Config.blinkEffect) {
                if (now - BatallaNaval.game.Config.blinkEffect[key] > 120) {
                    delete BatallaNaval.game.Config.blinkEffect[key];
                }
            }
        }
    };

    board.isValidCell = function(row, col) {
        return row >= 0 && row < BatallaNaval.game.Config.boardSize && 
               col >= 0 && col < BatallaNaval.game.Config.boardSize;
    };

    window.BatallaNaval.Board = board;
})(BatallaNaval.Board || {});