# FROM python:3.11-bookworm

# RUN mkdir /app

# EXPOSE 1337
# RUN pip install flask flask_socketio gevent gevent-websocket

# COPY app.py /app

# ENTRYPOINT [ "python", "/app/app.py" ]

FROM python:3.9.17-bookworm

RUN apt-get update && apt-get install curl unzip wget -y && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /app

EXPOSE 1337

WORKDIR /app

COPY requirements.txt .

RUN pip install -r requirements.txt

COPY . .

RUN wget https://github.com/official-stockfish/Stockfish/releases/download/sf_16.1/stockfish-ubuntu-x86-64-avx2.tar -O stockfish-ubuntu-x86-64-avx2.tar

RUN tar xvf stockfish-ubuntu-x86-64-avx2.tar

RUN chmod +x ./run.sh

CMD ["python", "/app/app.py"]