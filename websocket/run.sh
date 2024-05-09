#!/bin/sh

gunicorn --worker-class eventlet -w 1 --bind 0.0.0.0:1337 app:app