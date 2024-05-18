from django.db import models


class PlayerInfo(models.Model):
    avatar = models.ImageField(upload_to='avatars/', default='avatars/default.png', blank=True, null=True)
    username = models.CharField(max_length=50, unique=True)
    ELO = models.IntegerField(default=1000, unique=False)

    class Meta:
        db_table = 'user_playerinfo'