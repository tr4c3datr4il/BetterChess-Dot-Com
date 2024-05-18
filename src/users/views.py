from django.shortcuts import render, redirect, reverse
from django.views.decorators.csrf import csrf_exempt
from django.db import connection
from django.contrib import messages
from django.contrib.auth.models import User
from .models import PlayerInfo
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
import hashlib


@login_required
def profile_view(request):
    if request.method == 'GET':
        user = User.objects.get(username=request.user)
        if not PlayerInfo.objects.filter(username=request.user).exists():
            username = user.username
            player = PlayerInfo.objects.create(
                username=username,
                ELO=1000
            )
            player.save()
            
        return render(request, 'profile.html', {'user': user, 'player': PlayerInfo.objects.get(username=request.user)})

@login_required
def edit_profile(request):
    if request.method == 'GET':
        user = User.objects.get(username=request.user)
        return render(request, 'edit_profile.html', {'user': user})
    elif request.method == 'POST':
        username = request.POST.get('username')
        email = request.POST.get('email')
        password = request.POST.get('password')
        password = hashlib.md5(password.encode()).hexdigest()

        user = User.objects.get(username=request.user)
        user.username = username
        user.email = email
        user.set_password(password)
        user.save()

        messages.info(request, 'Edit profile successfully!')
        return redirect('/users/profile')


@csrf_exempt
def login_view(request):
    if request.method == 'GET':
        return render(request, 'login.html')
    elif request.method == 'POST':
        if request.path == '/users/login':
            username = request.POST.get('username')
            password = request.POST.get('password')
            password = hashlib.md5(password.encode()).hexdigest()

            user = authenticate(username=username, password=password)

            if user is not None:
                login(request, user)
                return redirect('/users/profile')
            else:
                messages.info(
                    request, 'Wrong username or password!')
                return render(request, 'login.html')


@csrf_exempt
def register_view(request):
    if request.method == 'GET':
        return render(request, 'register.html')
    elif request.method == 'POST':
        if request.path == '/users/register':
            username = request.POST.get('username')
            email = request.POST.get('email')
            password = request.POST.get('password')

            try:
                user = User.objects.get(username=username)
            except User.DoesNotExist:
                password = hashlib.md5(password.encode()).hexdigest()
                user = User.objects.create_user(username, email, password)
                user.save()

                messages.info(request, 'Register user successfully!')
                return redirect('/users/login')
            else:
                messages.info(request, 'Username is already exist!')
                return render(request, 'register.html')
            
@csrf_exempt
def logout_view(request):
    if request.method == 'GET':
        logout(request)
        return redirect('/users/login')