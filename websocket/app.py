from flask import Flask, request
from flask_socketio import SocketIO, emit
from stockfish import Stockfish
import random
import os

import chesslib
import movegen

games = {}

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

TURN_LIMIT = 10000
STOCKFISH_DEPTH = 21


class GameWrapper:
    def __init__(self, emit):
        self.emit = emit
        self.game = chesslib.Game(chesslib.STARTING_FEN)
        self.engine = Stockfish("./stockfish/stockfish-ubuntu-x86-64-avx2",
                                parameters={"Threads": 4}, depth=STOCKFISH_DEPTH)

    def get_player_state(self):
        moves = [f"{m}" for m in self.game.get_moves(
        )] if self.game.turn == chesslib.Piece.WHITE and self.game.turns < TURN_LIMIT else []

        status = self.game.get_winner()
        if self.game.turns >= TURN_LIMIT:
            status = "turn limit"

        return {
            "pos": self.game.export_fen(),
            "moves": moves,
            "your_turn": self.game.turn == chesslib.Piece.WHITE,
            "status": status,
            "turn_counter": f"{self.game.turns} / {TURN_LIMIT} turns"
        }

    def play_move(self, move):
        if self.game.turn != chesslib.Piece.WHITE:
            return
        if self.game.turns >= TURN_LIMIT:
            return

        move = movegen.Move.from_uci(self.game, move)
        legal_moves = self.game.get_moves()

        if move not in legal_moves:
            return

        self.game.play_move(move)
        self.emit("state", self.get_player_state())

        # check for winner
        status = self.game.get_winner()
        if status == chesslib.GameStatus.DRAW:
            self.emit(
                "chat", {"name": "🐸", "msg": "Nice try... but not good enough 🐸"})
            return
        elif status == chesslib.GameStatus.WHITE_WIN:
            self.emit("chat", {"name": "🐸", "msg": "how??????"})
            self.emit("chat", {"name": "System", "msg": FLAG})
            return

        # stockfish has a habit of crashing
        # The following section is used to try to resolve this
        opponent_move, attempts = None, 0
        while not opponent_move and attempts <= 10:
            try:
                attempts += 1
                self.engine.set_fen_position(self.game.export_fen())
                opponent_move = self.engine.get_best_move(30000, 30000)
            except:
                self.engine = Stockfish(
                    "./stockfish/stockfish-ubuntu-x86-64-avx2", parameters={"Threads": 4}, depth=STOCKFISH_DEPTH)

        if opponent_move != None:
            opponent_move = movegen.Move.from_uci(self.game, opponent_move)

            self.game.play_move(opponent_move)
            self.emit("state", self.get_player_state())

            # check for winner
            status = self.game.get_winner()
            # if status == chesslib.GameStatus.DRAW:
            #     self.emit(
            #         "chat", {"name": "🐸", "msg": "Nice try... but not good enough 🐸"})
            # elif status == chesslib.GameStatus.BLACK_WIN:
            #     self.emit(
            #         "chat", {"name": "🐸", "msg": random.choice(win_msges)})

            # if self.game.turns >= TURN_LIMIT:
            #     self.emit(
            #         "chat", {"name": "🐸", "msg": random.choice(win_msges)})
        else:
            self.emit("chat", {"name": "System",
                      "msg": "An error occurred, please restart"})


@app.after_request
def add_header(response):
    response.headers['Cache-Control'] = 'max-age=604800'
    return response


@socketio.on('ping')
def handle_my_custom_event(json):
    print('received json: ' + str(json))
    if json["data"] == "ping":
        emit("message", {"data": "pong"})


@socketio.on('echo')
def handle_my_custom_event(json):
    print('received json: ' + str(json))
    if json["data"]:
        emit("message", json)


@socketio.on('connect')
def on_connect(_):
    print("Connect ...")
    games[request.sid] = GameWrapper(emit)
    emit('state', games[request.sid].get_player_state())


@socketio.on('disconnect')
def on_disconnect():
    print("Disonnect ...")
    if request.sid in games:
        del games[request.sid]


@socketio.on('move')
def onmsg_move(move):
    print("Move ...")
    games[request.sid].play_move(move)


if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=1337,
                 debug=False)
