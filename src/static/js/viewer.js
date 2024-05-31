$(document).ready(function() {
    var game = new Chess();
    var board = Chessboard('myBoard', {
        draggable: false,
        position: 'start',
        pieceTheme: '/chesspieces/{piece}.png'
    });

    function updateStatus() {
        var status = '';
        var moveColor = 'White';
        if (game.turn() === 'b') {
            moveColor = 'Black';
        }
    
        if (game.in_checkmate()) {
            status = 'Game over, ' + moveColor + ' is in checkmate.';
            setTimeout(() => {
                window.location.href = '/home';
            }, 5000);
        } else if (game.in_draw()) {
            status = 'Game over, drawn position';
            setTimeout(() => {
                window.location.href = '/home';
            }, 5000);
        } else {
            status = moveColor + ' to move';
            if (game.in_check()) {
                status += ', ' + moveColor + ' is in check';
            }
        }
        
        $('#status').html(status);
    }
    
    board.position(board_state);
    updateStatus();

    setInterval(function() {
        $.ajax({
            url: window.location.href,
            type: 'GET',
            success: function(data) {
                var moveResult = data.move_result;
                board.position(moveResult.board_state);
                updateStatus();
            }
        });
    }, 5000);
});
