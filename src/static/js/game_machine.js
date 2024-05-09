// sorry for the spaghetti

// const moveSnd = new Audio("/mp3/move.mp3");
var socket = io('/', { transports: ['websocket'] });

let state = {}, hovering = [], chat = [];

const getSquare = (sq) => $('#chessboard .square-' + sq);
const isDark = (sq) => sq.hasClass('black-3c85d');
const restart = () => location.reload();
const htmlEscape = (d) => d.replace(/</g, "&lt;").replace(/>/g, "&gt;");

var $status = $('#status')
var $fen = $('#fen')
var $pgn = $('#pgn')
var $status_msg = '';
var $turn = 0;
var $pgn_str = '';

function read_pgn(options) {
    /* using the specification from http://www.chessclub.com/help/PGN-spec
     * example for html usage: .pgn({ max_width: 72, newline_char: "<br />" })
     */
    var newline = (typeof options === 'object' &&
                   typeof options.newline_char === 'string') ?
                   options.newline_char : '\n';
    var max_width = (typeof options === 'object' &&
                     typeof options.max_width === 'number') ?
                     options.max_width : 0;
    var result = [];
    var header_exists = false;

    /* add the PGN header headerrmation */
    for (var i in header) {
      /* TODO: order of enumerated properties in header object is not
       * guaranteed, see ECMA-262 spec (section 12.6.4)
       */
      result.push('[' + i + ' \"' + header[i] + '\"]' + newline);
      header_exists = true;
    }

    if (header_exists && history.length) {
      result.push(newline);
    }

    /* pop all of history onto reversed_history */
    var reversed_history = [];
    while (history.length > 0) {
      reversed_history.push(undo_move());
    }

    var moves = [];
    var move_string = '';

    /* build the list of moves.  a move_string looks like: "3. e3 e6" */
    while (reversed_history.length > 0) {
      var move = reversed_history.pop();

      /* if the position started with black to move, start PGN with 1. ... */
      if (!history.length && move.color === 'b') {
        move_string = move_number + '. ...';
      } else if (move.color === 'w') {
        /* store the previous generated move_string if we have one */
        if (move_string.length) {
          moves.push(move_string);
        }
        move_string = move_number + '.';
      }

      move_string = move_string + ' ' + move_to_san(move, false);
      make_move(move);
    }

    /* are there any other leftover moves? */
    if (move_string.length) {
      moves.push(move_string);
    }

    /* is there a result? */
    if (typeof header.Result !== 'undefined') {
      moves.push(header.Result);
    }

    /* history should be back to what is was before we started generating PGN,
     * so join together moves
     */
    if (max_width === 0) {
      return result.join('') + moves.join(' ');
    }

    /* wrap the PGN output at max_width */
    var current_width = 0;
    for (var i = 0; i < moves.length; i++) {
      /* if the current move will push past max_width */
      if (current_width + moves[i].length > max_width && i !== 0) {

        /* don't end the line with whitespace */
        if (result[result.length - 1] === ' ') {
          result.pop();
        }

        result.push(newline);
        current_width = 0;
      } else if (i !== 0) {
        result.push(' ');
        current_width++;
      }
      result.push(moves[i]);
      current_width += moves[i].length;
    }

    return result.join('');
  }

socket.on('connect', () => {
    console.log("connected");
});

socket.on('disconnect', () => {
    chat.push({ name: "System", msg: "Lost connection to the game server, please restart" })
});

socket.on('state', (data) => {
    state = data;
    board.position(state.pos, true);
    // moveSnd.play();
    $(".navbar").attr("class", "navbar navbar-expand-md " + (state.your_turn ? "bg-primary" : "bg-danger"));
    $("#turn").text(`${state.your_turn ? "Your" : "Computer"} Turn (${state.turn_counter})`);
    $(".row-5277c > div").css("background", "");
    
    if (data.status !== "running") {
        setTimeout(() => {
            $(".navbar").attr("class", "navbar navbar-expand-md bg-info");
            if (data.status === "draw") {
                status_msg = 'Game over, drawn position';
            }
            else if (data.status === "turn limit") {
                status_msg = 'Out of turns!';
            }
            else {
                // Swal.fire({
                //     title: 'Checkmate!',
                //     iconColor: state.your_turn ? 'red' : 'green',
                //     icon: 'info'
                // });
                // $("#turn").text(
                    status_msg = `Checkmate - ${state.your_turn ? 'Black' : 'White'} Win!`;
            }
            $status.html(status_msg);
            console.log(status_msg);
        }, 500);
    }
});

const PIECE_SYMBOLS = {
    "r": "♖", "R": "♜",
    "n": "♘", "N": "♞",
    "b": "♗", "B": "♝",
    "q": "♕", "Q": "♛",
    "k": "♔", "K": "♚",
    "p": "♙", "P": "♟",
};

$castLing_prev = false;

const board = Chessboard('myBoard', {
    draggable: true,
    position: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    onDragStart: (source) => state.moves.some(s => s.startsWith(source)),
    onDrop: (source, target, piece) => {
        let action = `${source}${target}`;
        // check if move exists, or move exists with promotion to queen
        if (!state.moves.includes(action) && !state.moves.includes(action + "q"))
            return "snapback";
        // if move is a promotion move, ask what piece to promote to
        (async () => {
            if (!state.moves.includes(action)) { // promotion
                const { value: promotion } = await Swal.fire({
                    title: 'What do you want to promote to?',
                    input: 'select',
                    inputOptions: {
                        'q': 'Queen',
                        'n': 'Knight',
                        'b': 'Bishop',
                        'r': 'Rook'
                    },
                    icon: 'question',
                });
                action += promotion;
            }
            // moveSnd.play();
            state.moves = [];

            // if ($turn % 2 == 0) {
            //     $pgn_str += `${$turn/2+1}. ${piece}${target}`;
            // }
            // else {
            //     $pgn_str += ` ${piece}${target}<br />`;
            // }
        
            // $turn += 1;
            // $pgn.html($pgn_str);

            socket.emit("move", action);
        })();
    },
    onMouseoutSquare: () => {
        $(".row-5277c > div").css("background", "");
        hovering = [];
    },
    onMouseoverSquare: (pos) => {
        if (!state.moves || state.status !== "running") return;
        hovering = hovering.concat(state.moves.filter(s => s.startsWith(pos)).map(m => m.slice(2)));
        if (!hovering.length) return;
        hovering.push(pos);
        hovering.map(h => getSquare(h.slice(0, 2))).forEach(h => h.css("background", isDark(h) ? '#696969' : '#a9a9a9'));
    }
});