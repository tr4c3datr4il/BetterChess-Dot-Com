from django.urls import path
from users import views

urlpatterns = [
    path("", views.login, name='home'),
]