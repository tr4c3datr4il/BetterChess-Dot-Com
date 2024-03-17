DROP DATABASE IF EXISTS chess_game;

CREATE DATABASE IF NOT EXISTS chess_game;

USE chess_game;

DROP TABLE IF EXISTS users_playerinfo;
CREATE TABLE IF NOT EXISTS users_playerinfo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    ELO INT DEFAULT 1000
);

DROP TABLE IF EXISTS game_scoreboard;
CREATE TABLE IF NOT EXISTS game_scoreboard (
    id INT AUTO_INCREMENT PRIMARY KEY,
    player_id INT,
    FOREIGN KEY (player_id) REFERENCES users_playerinfo(id),
    wins INT DEFAULT 0,
    losses INT DEFAULT 0,
    draws INT DEFAULT 0
);