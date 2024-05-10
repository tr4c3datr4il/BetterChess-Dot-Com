from django.db import models
from users.models import PlayerInfo

class Scoreboard(models.Model):
    player = models.ForeignKey(PlayerInfo, on_delete=models.CASCADE, related_name='scoreboard_set')
    wins = models.IntegerField(default=0)
    losses = models.IntegerField(default=0)
    draws = models.IntegerField(default=0)

    class Meta:
        db_table = 'game_scoreboard'
