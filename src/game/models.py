from django.db import models
from users.models import PlayerInfo


class Scoreboard(models.Model):
    player = models.ForeignKey(PlayerInfo, on_delete=models.CASCADE)
    wins = models.IntegerField(default=0)
    losses = models.IntegerField(default=0)
    draws = models.IntegerField(default=0)
    ELO = models.ForeignObject(PlayerInfo, from_fields=['ELO'], to_fields=['ELO'], on_delete=models.CASCADE)

    class Meta:
        db_table = 'game_scoreboard'