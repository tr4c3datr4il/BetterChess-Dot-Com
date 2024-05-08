#!/usr/bin/env bash

python manage.py makemigrations
python manage.py migrate
python manage.py makemigrations app
python manage.py migrate app
echo "Server started"
python manage.py runserver 0.0.0.0:8000