from django.urls import include, path
from django.conf.urls.static import static
from game import views

from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve()

print(BASE_DIR)

urlpatterns = [
    path("", view=views.index, name="index"),
    path("home", view=views.home, name="home"),
    path("scoreboard", view=views.scoreboard, name="scoreboard"),
    # path("one_vs_one", view=views.one_vs_one, name="one_vs_one"),
    path("available_rooms", view=views.available_rooms, name="available_rooms"),
    path('create_room/', view=views.create_room, name='create_room'),
    path("one_vs_one/<str:room_name>/", views.one_vs_one, name="one_vs_one"),
    path("player_vs_machine", view=views.player_vs_machine, name="player_vs_machine")
]
