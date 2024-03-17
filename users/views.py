from django.shortcuts import render, redirect
from django.views.decorators.csrf import csrf_exempt
from django.db import connection
from django.contrib import messages


def login(request):
    return render(request, 'login.html')


@csrf_exempt
def register(request):
    if request.method == 'GET':
        return render(request, 'register.html')
    elif request.method == 'POST':
        if request.path == '/users/register':
            username = request.POST.get('username')
            email = request.POST.get('email')
            password = request.POST.get('password')
            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT * FROM player WHERE username = '{}';".format(username))
                rows = cursor.fetchall()
                if len(rows) == 0:
                    cursor.execute(
                        "INSERT INTO player (username, hash_password, email) VALUES ('{}','{}','{}');".format(
                            username, password, email
                        )
                    )
                    messages.info(request, 'Register user successfully!')
                    return render(request, 'login.html')
                else:
                    messages.info(
                        request, 'Username is already exsit!')
                    return render(request, 'register.html')
