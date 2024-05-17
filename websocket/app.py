from flask import Flask, request
from flask_socketio import SocketIO, emit
from stockfish import Stockfish
import logging

import chesslib
import movegen

logging.basicConfig(level=logging.DEBUG)

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

TURN_LIMIT = 10000
STOCKFISH_DEPTH = 21

games = {}

class GameWrapper:
    def __init__(self, room_name):
        self.room_name = room_name
        self.players = {}  # Track players in the room
        self.game = chesslib.Game(chesslib.STARTING_FEN)
        self.engine = Stockfish("./stockfish/stockfish-ubuntu-x86-64-avx2",
                                parameters={"Threads": 4}, depth=STOCKFISH_DEPTH)

    def add_player(self, player_sid):
        self.players[player_sid] = True 

    def remove_player(self, player_sid):
        if player_sid in self.players:
            del self.players[player_sid]

    def get_player_state(self, player_sid):
        is_your_turn = (self.game.turns % 2 == 0 and player_sid == chesslib.Piece.BLACK) or \
                        (self.game.turns % 2 == 1 and player_sid == chesslib.Piece.WHITE)
        moves = [f"{m}" for m in self.game.get_moves()] if is_your_turn and self.game.turns < TURN_LIMIT else []
        status = self.game.get_winner()

        return {
            "pos": self.game.export_fen(),
            "moves": moves,
            "your_turn": is_your_turn,
            "status": status,
            "turn_counter": f"{self.game.turns} / {TURN_LIMIT} turns"
        }

    def play_move(self, player_sid, move):
        logging.debug(f"Players: {self.players}")

        # handle qua ngu toi da thua
        # if player_sid != self.game.turn:
        #     logging.debug(f"Player {player_sid} tried to play out of turn")
        #     return

        converted_move = move['from'] + move['to']

        move = movegen.Move.from_uci(self.game, converted_move)
        legal_moves = self.game.get_moves()

        if move not in legal_moves:
            logging.debug(f"Player {player_sid} tried to play illegal move {move}")
            return 

        self.game.play_move(move)

        logging.debug(f"Player {player_sid} played move {move}")

        for player in self.players:
            socketio.emit('state', self.get_player_state(player), room=player)
            socketio.emit('move_made', {'move': move.uci()}, room=player)

        if self.game.is_checkmate():
            for player in self.players:
                if self.game.turn == player:
                    socketio.emit('game_over', {'result': 'win'}, room=player)
                else:
                    socketio.emit('game_over', {'result': 'lose'}, room=player)
        elif self.game.is_stalemate() or self.game.turns >= TURN_LIMIT:
            for player in self.players:
                socketio.emit('game_over', {'result': 'draw'}, room=player)

@app.after_request
def add_header(response):
    response.headers['Cache-Control'] = 'max-age=604800'
    return response

@socketio.on('connect')
def on_connect():
    pass

@socketio.on('join')
def on_join(data):
    room_name = data['room_name']
    if room_name not in games:
        games[room_name] = GameWrapper(room_name)
        logging.debug(f"New game created: {room_name}")
        logging.debug(f"Games: {games}")
    logging.debug(f"Player {request.sid} joined room {room_name}")
    games[room_name].add_player(request.sid)
    emit('state', games[room_name].get_player_state(request.sid), room=request.sid)

@socketio.on('disconnect')
def on_disconnect():
    # Remove if there are no more players in the room
    for room_name in games:
        if request.sid in games[room_name].players:
            games[room_name].remove_player(request.sid)
            if len(games[room_name].players) == 0:
                del games[room_name]
                logging.debug(f"Game {room_name} removed")
                logging.debug(f"Games: {games}")
            break

@socketio.on('move')
def onmsg_move(data):
    room_name = data['room_name']
    move = data['move']
    try:
        logging.debug(f"Player {request.sid} played move {move}")
        games[room_name].play_move(request.sid, move)
    except ValueError as e:
        emit('error', str(e), room=request.sid)

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=1337, debug=False)
