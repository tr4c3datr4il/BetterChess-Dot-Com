// var board = null
// var game = new Chess()
// var $status = $('#status')
// var $fen = $('#fen')
// var $pgn = $('#pgn')

// function onDragStart(source, piece, position, orientation) {

//     if (game.game_over()) return false

//     // only pick up pieces for the side to move
//     if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
//         (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
//         return false
//     }
// }

// function onDrop(source, target) {

//     var move = game.move({
//         from: source,
//         to: target,
//         promotion: 'q'
//     })

//     if (move === null) return 'snapback'

//     updateStatus()
// }

// function onSnapEnd() {
//     board.position(game.fen())
// }

// function updateStatus() {
//     var status = ''

//     var moveColor = 'White'
//     if (game.turn() === 'b') {
//         moveColor = 'Black'
//     }


//     if (game.in_checkmate()) {
//         status = 'Game over, ' + moveColor + ' is in checkmate.'
//     }


//     else if (game.in_draw()) {
//         status = 'Game over, drawn position'
//     }

//     else {
//         status = moveColor + ' to move'


//         if (game.in_check()) {
//             status += ', ' + moveColor + ' is in check'
//         }
//     }

//     $status.html(status)
//     $fen.html(game.fen())
//     $pgn.html(game.pgn())
//     console.log(game.pgn())
// }

// var config = {
//     draggable: true,
//     position: 'start',
//     onDragStart: onDragStart,
//     onDrop: onDrop,
//     onSnapEnd: onSnapEnd,
//     pieceTheme: '/chesspieces/{piece}.png'
// }
// board = Chessboard('myBoard', config)

// updateStatus()


var roomName = 'hehe';
var socket = io('https://hen-immune-safely.ngrok-free.app/');

function onDragStart(source, piece, position, orientation) {
    if (game.game_over()) return false;

    if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
        (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
        return false;
    }
}

function onDrop(source, target) {
    var roomName = "hehe";
    var move = game.move({
        from: source,
        to: target,
        promotion: 'q'
    });
    if (move === null) return 'snapback';

    var moveData = {
        room_name: roomName,
        move
    };

    sendMove(moveData, source, target);
}

function onSnapEnd() {
    board.position(game.fen());
}

socket.on('state', function(data) {
    updateStatus(data.status);
    board.position(data.pos);
});

// socket.on('move_made', function(data) {
//     var move = game.move(data.move);
//     if (move === null) {
//         console.error('Invalid move received from server');
//         return;
//     }
//     console.log(data.move);
//     board.position(game.fen());
//     updateStatus();
// });

socket.on('connect_mul', function() {
    console.log(roomName);
    joinGame(roomName);
});

socket.on('disconnect_mul', function() {
    console.log('Disconnected');
});

function joinGame(roomName) {
    socket.emit('join_mul', { room_name: roomName });
}

function sendMove(moveData, source, target) {
    socket.emit('move_mul', moveData);
}

function updateStatus(status) {
    var statusText = '';
    if (status === 'Game over, drawn position' || status === 'Game over, turn limit') {
        statusText = 'Game over: ' + status;
    } else {
        statusText = status;
    }
    $('#status').html(statusText);
}

var board = Chessboard('myBoard', {
    draggable: true,
    position: 'start',
    onDragStart: onDragStart,
    onDrop: onDrop,
    onSnapEnd: onSnapEnd,
    pieceTheme: '/chesspieces/{piece}.png'
});

var game = new Chess();

function updateStatus(status) {
    var statusText = '';
    if (status === 'Game over, drawn position' || status === 'Game over, turn limit') {
        statusText = 'Game over: ' + status;
    } else {
        statusText = status;
    }
    $('#status').html(statusText);
}

function initGame() {
    joinGame(roomName);
}

$(document).ready(function() {
    initGame();
});
