#!/usr/bin/env bash

python manage.py migrate --run-syncdb
python manage.py makemigrations
python manage.py migrate
python manage.py shell < init_admin.py
python manage.py makemigrations better_chess
python manage.py migrate better_chess
echo "Server started"
python manage.py runserver 0.0.0.0:8000