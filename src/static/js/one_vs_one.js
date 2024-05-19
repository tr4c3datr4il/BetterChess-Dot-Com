// function getRoomNameFromUrl() {
//     var path = window.location.pathname;
//     var parts = path.split('/');
//     if (parts.length >= 2) {
//         return parts[2];
//     }
//     return null;
// }

// var $roomName = getRoomNameFromUrl();

var $orientation = 'white';

console.log($roomName);
console.log($player_name);

var socket = io('/', { transports: ['websocket'] });
var game = new Chess();
var $status = $('#status')
var $fen = $('#fen')
var $pgn = $('#pgn')

const BLACK = 'b';
const WHITE = 'w';

function onDragStart(source, piece, position, orientation) {

    if (game.game_over()) return false;

    if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
        (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
        return false;
    }
}

var $can_move = false;

function onDrop(source, target) {

    function checkTurn() {
        return new Promise((resolve, reject) => {

            socket.emit('check_turn', { room_name: $roomName });

            socket.on('can_move', function (data) {
                //console.log('Get: ' + data);
                if (data['vaild_turn'] === 'True' && data['color'] === game.turn()) {
                    //console.log("OKE");
                    $can_move = true;
                } else {
                    $can_move = false;
                }
                resolve($can_move);
            });

            // Handle error if needed (optional)
            socket.on('error', function (error) {
                reject(error);
            });
        });
    }
    // Handle the turn check and subsequent logic
    return checkTurn().then((canMove) => {
        if (!canMove) {
            var move = game.move({
                from: source,
                to: source,
                promotion: 'q'
            });

            return 'snapback';
        } else {

            var move = game.move({
                from: source,
                to: target,
                promotion: 'q'
            });

            if (move === null) return 'snapback';

            var moveData = {
                room_name: $roomName,
                move
            };
            sendMove(moveData, source, target);
            return;
        }
    }).catch((error) => {
        console.error('Error:', error);
        // Handle the error appropriately
        return 'snapback';
    });
}

socket.on('connect_mul', function () {
    joinGame($roomName, $player_name);
});

socket.on('set_color', function (data) {
    $orientation = data;
    board.orientation(data);
})

socket.on('state', function (data) {
    console.log("HIT state")
    game.load(data.pos);
    board.position(game.fen());
    if (data.which_turn === WHITE) {
        game.turn(WHITE);
    } else {
        game.turn(BLACK);
    }
    console.log(`Turn: ${game.turn()}`)
    updateStatus();
});

socket.on('disconnect_mul', function () {
    console.log('Disconnected');
});

function joinGame(roomName) {
    socket.emit('join_mul', { room_name: roomName, player_name: $player_name });
}

function sendMove(moveData, source, target) {
    socket.emit('move_mul', moveData);
}

function onSnapEnd() {
    board.position(game.fen())
}

var board = Chessboard('myBoard', {
    draggable: true,
    orientation: $orientation,
    position: "start",
    onDrop: onDrop,
    onSnapEnd: onSnapEnd,
    pieceTheme: '/chesspieces/{piece}.png'
});

function updateStatus() {
    var status = ''

    var moveColor = 'White'
    if (game.turn() === 'b') {
        moveColor = 'Black'
    }

    if (game.in_checkmate()) {
        status = 'Game over, ' + moveColor + ' is in checkmate.'

        getWinner(moveColor);
    }

    else if (game.in_draw()) {
        status = 'Game over, drawn position'
    }

    else {
        status = moveColor + ' to move'

        if (game.in_check()) {
            status += ', ' + moveColor + ' is in check'
        }
    }

    $status.html(status)
}

socket.on('winner', function (data) {
    var check = data === 'WINNER' ? 'False' : 'True';

    window.location.href = `/handle_winner/${$roomName}/${check}`;
});

var counter = 0;
function getWinner(color) {
    if (counter <= 3) {
        socket.emit('get_winner', { room_name: $roomName, color: color });
        return;
    }
    counter++;
    socket.emit('get_winner', { room_name: $roomName, color: color });
}

function initGame() {
    joinGame($roomName);
}

$(document).ready(function () {
    initGame();
});