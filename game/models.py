from django.db import models
from users.models import PlayerInfo

# Create your models here.
class Scoreboard(models.Model):
    player = models.ForeignKey(PlayerInfo, on_delete=models.CASCADE)
    wins = models.IntegerField(default=0)
    losses = models.IntegerField(default=0)
    draws = models.IntegerField(default=0)