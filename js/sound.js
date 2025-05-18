var BatallaNaval = BatallaNaval || {};

(function(sounds) {
    sounds.sounds = {
        background: null,
        victory: null,
        defeat: null,
        playerHit: null,
        enemyHit: null,
        water: null,
        placeShip: null,
        isMusicPlaying: false
    };

    sounds.preload = function() {
        sounds.sounds.background = loadSound('assets/sounds/musicaFondo.mp3');
        sounds.sounds.victory = loadSound('assets/sounds/victoria.mp3');
        sounds.sounds.defeat = loadSound('assets/sounds/derrota.mp3');
        sounds.sounds.playerHit = loadSound('assets/sounds/impactoJugador.mp3');
        sounds.sounds.enemyHit = loadSound('assets/sounds/impactoIA.mp3');
        sounds.sounds.water = loadSound('assets/sounds/agua.mp3');
        sounds.sounds.placeShip = loadSound('assets/sounds/colocarBarco.mp3');
    };

    sounds.playSound = function(sound) {
        if (sound) {
            try {
                sound.play();
            } catch (e) {
                console.error("Error al reproducir sonido:", e);
            }
        }
    };

    sounds.startBackgroundMusic = function() {
        if (!sounds.sounds.isMusicPlaying && sounds.sounds.background) {
            try {
                sounds.sounds.background.setVolume(0.3);
                sounds.sounds.background.loop();
                sounds.sounds.isMusicPlaying = true;
            } catch (e) {
                console.error("Error al iniciar música:", e);
            }
        }
    };

    sounds.stopBackgroundMusic = function() {
        if (sounds.sounds.background && sounds.sounds.background.isPlaying()) {
            sounds.sounds.background.stop();
            sounds.sounds.isMusicPlaying = false;
        }
    };

    window.BatallaNaval.Sounds = sounds;
})(BatallaNaval.Sounds || {});