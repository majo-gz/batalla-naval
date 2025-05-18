var BatallaNaval = BatallaNaval || {};

(function() {
    function preload() {
        BatallaNaval.Sounds.preload();
    }

    function setup() {
        var canvas = createCanvas(820, 420);
        canvas.parent('game-container');
        textAlign(CENTER, CENTER);
        
        BatallaNaval.UI.setupEventListeners();
        BatallaNaval.Board.initializeBoards();
        BatallaNaval.Board.drawBoards();
        
        userStartAudio();
        frameRate(30);
    }

    window.preload = preload;
    window.setup = setup;
})();