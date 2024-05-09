from django.db import models

# Create your models here.


class PlayerInfo(models.Model):
    username = models.CharField(max_length=50, unique=True)
    ELO = models.IntegerField(default=1000)

    class Meta:
        db_table = 'users_playerinfo'
