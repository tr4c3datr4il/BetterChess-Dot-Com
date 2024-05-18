from django.db import models
from users.models import PlayerInfo
from django.contrib.auth.models import User

class Scoreboard(models.Model):
    player = models.ForeignKey(PlayerInfo, on_delete=models.CASCADE, related_name='scoreboard_set')
    wins = models.IntegerField(default=0)
    losses = models.IntegerField(default=0)
    draws = models.IntegerField(default=0)

    class Meta:
        db_table = 'game_scoreboard'

class Room(models.Model):
    name = models.CharField(max_length=100, unique=True)
    players = models.ManyToManyField(User, related_name='rooms')

    def __str__(self):
        return self.name

    def player_count(self):
        return self.players.count()