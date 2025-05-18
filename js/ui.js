var BatallaNaval = BatallaNaval || {};

(function(ui) {
    ui.setupEventListeners = function() {
        document.getElementById('btn-rapido').addEventListener('click', BatallaNaval.startQuickGame);
        document.getElementById('btn-manual').addEventListener('click', ui.showManualConfig);
        document.getElementById('btn-start-manual').addEventListener('click', BatallaNaval.startManualPlacement);
    };

    ui.showScreen = function(id) {
        document.querySelectorAll('.pantalla').forEach(function(div) {
            div.classList.add('oculto');
        });
        document.getElementById(id).classList.remove('oculto');
    };

    ui.updateStatus = function(message) {
        document.getElementById('status').textContent = message;
    };

    ui.updateShipCount = function() {
        document.getElementById('ship-count').textContent = 
            'Tus barcos: ' + BatallaNaval.game.Config.playerShips + ' | Barcos enemigos: ' + BatallaNaval.game.Config.enemyShips;
    };

    ui.showMessage = function(text) {
        var status = document.getElementById('status');
        if (!status) return;
        
        status.textContent = text;

        setTimeout(function() {
            ui.updateStatus(BatallaNaval.game.Config.isPlayerTurn ? "Tu turno" : "Turno de la IA");
        }, 3000);
    };

    ui.updateInventoryUI = function() {
        var container = document.getElementById('inventario-items');
        if (!container) return;
        
        container.innerHTML = '';
        
        BatallaNaval.game.Config.inventory.forEach(function(item) {
            var itemEl = document.createElement('div');
            itemEl.className = 'item-inventario';
            itemEl.innerHTML = '<div class="item-icono">' + ui.getItemIcon(item) + '</div>' +
                               '<div class="item-info"><div class="item-nombre">' + ui.getItemName(item) + '</div></div>';
            itemEl.title = ui.getItemDescription(item);
            
            itemEl.addEventListener('click', function() {
                if (BatallaNaval.game.Config.isPlayerTurn && BatallaNaval.game.Config.gameMode) {
                    BatallaNaval.Items.useItem(item);
                }
            });
            
            container.appendChild(itemEl);
        });
    };

    ui.showManualConfig = function() {
        BatallaNaval.game.Config.gameMode = 'manual';
        BatallaNaval.Board.initializeBoards();
        document.getElementById('manual-placement').style.display = 'block';
        ui.updateStatus("Configura tu flota - Elige cuántos barcos deseas");
        BatallaNaval.Board.drawBoards();
    };

    ui.getItemName = function(code) {
        var names = {
            'radar': 'Radar',
            'doble': 'Disparo Doble',
            'prediccion': 'Modo de Predicción',
            'revelar': 'Revelar Posición'
        };
        return names[code] || 'Ítem';
    };

    ui.getItemIcon = function(code) {
        var icons = {
            'radar': '🔍',
            'doble': '💥',
            'prediccion': '🔮',
            'revelar': '👁️'
        };
        return icons[code] || '❓';
    };

    ui.getItemDescription = function(code) {
        var descs = {
            'radar': 'Revela un barco enemigo',
            'doble': 'Permite disparar dos veces',
            'prediccion': 'Muestra zonas probables de barcos',
            'revelar': 'Muestra una posición enemiga'
        };
        return descs[code] || 'Ítem misterioso';
    };

    window.BatallaNaval.UI = ui;
})(BatallaNaval.UI || {});