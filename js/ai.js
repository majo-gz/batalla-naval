var BatallaNaval = BatallaNaval || {};

(function(ai) {
    ai.turn = function() {
        var x, y;
        do {
            x = floor(random(BatallaNaval.game.Config.boardSize));
            y = floor(random(BatallaNaval.game.Config.boardSize));
        } while (['X', '!'].includes(BatallaNaval.game.Config.playerBoard[y][x]));
        
        if (BatallaNaval.game.Config.playerBoard[y][x] === 'O') {
            BatallaNaval.game.Config.playerBoard[y][x] = '!';
            BatallaNaval.Board.markHit(y, x);
            BatallaNaval.game.Config.playerShips--;
            BatallaNaval.UI.updateStatus("La IA ha impactado uno de tus barcos!");
            BatallaNaval.Sounds.playSound(BatallaNaval.Sounds.enemyHit);
        } else {
            BatallaNaval.game.Config.playerBoard[y][x] = 'X';
            BatallaNaval.UI.updateStatus("La IA ha atacado y falló. Tu turno!");
            BatallaNaval.Sounds.playSound(BatallaNaval.Sounds.water);
        }
        
        BatallaNaval.UI.updateShipCount();
        BatallaNaval.Board.drawBoards();
        
        BatallaNaval.game.checkGameEnd('player');
        BatallaNaval.game.startPlayerTurn();
    };

    window.BatallaNaval.AI = ai;
})(BatallaNaval.AI || {});