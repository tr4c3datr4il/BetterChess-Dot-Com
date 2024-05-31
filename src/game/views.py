import json
from django.http import JsonResponse
from django.urls import path
from django.shortcuts import get_object_or_404, redirect, render
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from .models import Scoreboard, Room
from users.models import PlayerInfo
from django.db.models import Count, F
from game import models

def index(request):
    if request.user.is_authenticated:
        return render(request, "home.html")
    return render(request, "index.html")

@login_required
def scoreboard(request):
    scoreboard = Scoreboard.objects.all().order_by('-player__ELO')
    return render(request, "scoreboard.html", {"scoreboard": scoreboard})

@login_required
def home(request):
    scoreboard = Scoreboard.objects.all().order_by('-player__ELO')[:10]
    return render(request, "home.html", {"scoreboard": scoreboard})

@login_required
def available_rooms(request):
    rooms = Room.objects.annotate(player_count=Count('players'))
    return render(request, "available_rooms.html", {"rooms": rooms})

@login_required
def create_room(request):
    if request.method == "POST":
        room_name = request.POST.get("room_name")
        if room_name:
            if Room.objects.filter(name=room_name).exists():
                messages.error(request, "Room name already exists!")
                return redirect('create_room')
            Room.objects.create(name=room_name)
            return redirect('available_rooms')
    return render(request, "create_room.html")

@login_required
def one_vs_one(request, room_name):
    room, created = Room.objects.get_or_create(name=room_name)
    if request.user not in room.players.all():
        room.players.add(request.user)
    return render(request, "one_vs_one.html", 
                {
                    "room_name": room_name, 
                    "player_count": room.player_count(),
                    "player_name": request.user.username
                })

@login_required
def player_vs_machine(request):
    return render(request, "player_vs_machine.html")

@login_required
def handle_winner(request, room_name, is_winner):
    player_info = get_object_or_404(PlayerInfo, username=request.user)
    scoreboard_entry, created = Scoreboard.objects.get_or_create(player=player_info)

    if is_winner == 'True':
        player_info.ELO += 30
        player_info.save()
        scoreboard_entry.wins = F('wins') + 1
    else:
        player_info.ELO -= 10
        player_info.save()
        scoreboard_entry.losses = F('losses') + 1

    scoreboard_entry.save()

    # Delete the room
    try:
        room = Room.objects.get(name=room_name)
        room.delete()
    except:
        pass

    return redirect('home')

@login_required
def view_room(request, room_name):
    import logging
    room = get_object_or_404(Room, name=room_name)
    logging.basicConfig(level=logging.DEBUG)
    if request.method == "POST":
        move = request.POST.get('move')
        board_state = request.POST.get('board_state')
        logging.debug(f"Move: {move}, Board State: {board_state}")
        if move:
            source, target = move.split('-')
            move_result = make_move(room_name, source, target, board_state)

            return render(request, "view_room.html", {"room": room, "move_history": move_result['move_history'], "board_state": move_result['board_state']})

    players = room.players.all()
    move_result = get_move(room_name)
    return render(request, "view_room.html", {"room": room, "players": players, "move_history": move_result['move_history'], "board_state": move_result['board_state']})


def make_move(room_name, source, target, board_state):
    # Update room history
    room = Room.objects.get(name=room_name)
    room.board_state = board_state
    room.move_history += f"{source}-{target},"
    room.save()

    return {
        'source': source,
        'target': target,
        'board_state': room.board_state,
        'move_history': room.move_history.split(',')
    }

def get_move(room_name):
    room = Room.objects.get(name=room_name)
    move_history = room.move_history.split(',')
    board_state = room.board_state

    return {
        'move_history': move_history,
        'board_state': board_state
    }