from django.urls import include, path
from game import views

urlpatterns = [
    path("", view=views.index, name="index"),
    path("home", view=views.home, name="home"),
    path("scoreboard", view=views.scoreboard, name="scoreboard"),
]
