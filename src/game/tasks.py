from celery import shared_task
from django.utils import timezone
from .models import Room

@shared_task
def delete_old_rooms():
    one_hour_ago = timezone.now() - timezone.timedelta(hours=1)
    Room.objects.filter(created_at__lt=one_hour_ago).delete()