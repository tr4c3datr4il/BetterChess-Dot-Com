from django.urls import path
from users import views

urlpatterns = [
    path("", views.profile_view, name='profile'),
    path("login", views.login_view, name='login'),
    path("register", views.register_view, name='register'),
    path("profile", views.profile_view, name='profile')
]
