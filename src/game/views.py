from django.urls import path
from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required, permission_required
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
    scoreboard = Scoreboard.objects.all()
    return render(request, "scoreboard.html", {"scoreboard": scoreboard})

@login_required
def home(request):
    scoreboard = Scoreboard.objects.all()
    rooms = Room.objects.all()
    return render(request, "home.html", {"scoreboard": scoreboard, "rooms": rooms})

@login_required
def available_rooms(request):
    rooms = Room.objects.annotate(player_count=Count('players')).filter(player_count__lt=2)
    return render(request, "available_rooms.html", {"rooms": rooms})

@login_required
def create_room(request):
    if request.method == "POST":
        room_name = request.POST.get("room_name")
        if room_name:
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
    player_info = PlayerInfo.objects.get(username=request.user)

    if is_winner == 'True':
        player_info.ELO = F('ELO') + 30
        Scoreboard.objects.filter(player=player_info).update(wins=F('wins') + 1)
    else:
        player_info.ELO = F('ELO') - 10
        Scoreboard.objects.filter(player=player_info).update(losses=F('losses') + 1)

    player_info.save()

    return redirect('home')