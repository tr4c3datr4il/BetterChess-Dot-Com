var $orientation = 'white';

var $playersJoined = 0;
var timerIntervalWhite;
var timerIntervalBlack;
var timeLeftWhite = 60 * 15;
var timeLeftBlack = 60 * 15;
var timeCheck = true;

// Timer
function startTimer(color) {
    if (color === 'w') {
        timerIntervalWhite = setInterval(function () {
            $('#timerWhite').text('White time left: ' + formatTime(timeLeftWhite));
            timeLeftWhite--;
            if (timeLeftWhite < 0) {
                clearInterval(timerIntervalWhite);
                getWinner('Black');
            }
        }, 1000);
    } else {
        timerIntervalBlack = setInterval(function () {
            $('#timerBlack').text(' | Black time left: ' + formatTime(timeLeftBlack));
            timeLeftBlack--;
            if (timeLeftBlack < 0) {
                clearInterval(timerIntervalBlack);
                getWinner('White');
            }
        }, 1000);
    }
}

function stopTimer(color) {
    if (color === 'w') {
        clearInterval(timerIntervalWhite);
    } else {
        clearInterval(timerIntervalBlack);
    }
}
function formatTime(seconds) {
    var minutes = Math.floor(seconds / 60);
    var remainingSeconds = seconds % 60;
    return minutes.toString().padStart(2, '0') + ':' + remainingSeconds.toString().padStart(2, '0');
}

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
                if (data['vaild_turn'] === 'True' && data['color'] === game.turn()) {
                    $can_move = true;
                } else {
                    $can_move = false;
                }
                resolve($can_move);
            });

            socket.on('error', function (error) {
                reject(error);
            });
        });
    }

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
        return 'snapback';
    });
}

socket.on('players_joined_update', function (count) {
    $playersJoined = count;
    console.log('Players joined: ' + $playersJoined);
    if ($playersJoined >= 2) {
        console.log('Both players have joined');
        startTimer('w');
    }
});

socket.on('connect_mul', function () {
    joinGame($roomName, $player_name);
});

socket.on('set_color', function (data) {
    $orientation = data;
    board.orientation(data);
})

var previousState = null;
var moveHistory = [];
socket.on('state', function (data) {
    console.log("HIT state")
    game.load(data.pos);
    board.position(game.fen());

    if (previousState !== null) {
        var previousBoard = parseFEN(previousState.pos);
        var currentBoard = parseFEN(data.pos);
        var move_ = findMove(previousBoard, currentBoard);
        if (move_) {
            moveHistory.push(move_);
        }
    }

    previousState = data;

    if (data.which_turn === WHITE) {
        game.turn(WHITE);
    } else {
        game.turn(BLACK);
    }
    console.log(`Turn: ${game.turn()}`)
    updateStatus();

    // Display the move history
    var moveHistoryElement = document.getElementById('moveHistory');
    var moveHistoryText = moveHistory.join(', ');
    moveHistoryElement.textContent = moveHistoryText;
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
        if ($playersJoined >= 2) {
            var currentTurn = game.turn();
            stopTimer(currentTurn === 'w' ? 'b' : 'w');
            startTimer(currentTurn); // start the timer for the next player
            console.log('Stop timer for: ' + (currentTurn === 'w' ? 'b' : 'w'));
            console.log('Start timer for: ' + currentTurn);
        }
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

function parseFEN(fen) {
    var parts = fen.split(' ');
    var position = parts[0];
    var rows = position.split('/');
    var board = rows.map(row => {
        var rowArray = [];
  
        for (var i = 0; i < row.length; i++) {
            var char = row[i];
  
            if (!isNaN(char)) {
                for (var j = 0; j < parseInt(char); j++) {
                    rowArray.push(null);
                }
            } else {
                rowArray.push(char);
            }
        }
  
        return rowArray;
    });
  
    return board;
  }

function findMove(previousBoard, currentBoard) {
    var move_ = { from: null, to: null };

    for (var i = 0; i < 8; i++) {
        for (var j = 0; j < 8; j++) {
            if (previousBoard[i][j] !== currentBoard[i][j]) {
                if (previousBoard[i][j] !== null) {
                    move_.from = { row: i, col: j };
                }

                if (currentBoard[i][j] !== null) {
                    move_.to = { row: i, col: j };
                }
            }
        }
    }

    var columns = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    if (move_.from) {
        move_.from = columns[move_.from.col] + (8 - move_.from.row);
    }
    if (move_.to) {
        move_.to = columns[move_.to.col] + (8 - move_.to.row);
    }

    if (move_.from && move_.to) {
        return move_.from + '-' + move_.to;
    } else {
        return null;
    }
}