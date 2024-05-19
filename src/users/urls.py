from django.urls import path
from users import views

urlpatterns = [
    path("login", views.login_view, name='login'),
    path("register", views.register_view, name='register'),
    path("profile", views.profile_view, name='profile'),
    path("edit_profile", views.edit_profile, name='edit_profile'),
    path('logout', views.logout_view, name='logout'),
] 