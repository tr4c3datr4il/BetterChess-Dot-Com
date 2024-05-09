FROM python:3.10.12-slim

RUN apt-get update
RUN apt-get install -y pkg-config python3-dev default-libmysqlclient-dev build-essential

WORKDIR /usr/src/app
COPY requirements.txt ./
RUN pip install -r requirements.txt
COPY . .
RUN chmod +x entry_point.sh

CMD [ "./entry_point.sh" ]