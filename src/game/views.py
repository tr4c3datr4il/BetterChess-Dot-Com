from django.urls import path
from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from .models import Scoreboard


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
    return render(request, "home.html", {"scoreboard": scoreboard})


@login_required
def one_vs_one(request):
    return render(request, "one_vs_one.html")


@login_required
def player_vs_machine(request):
    return render(request, "player_vs_machine.html")
