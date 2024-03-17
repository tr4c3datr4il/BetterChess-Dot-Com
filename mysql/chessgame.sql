CREATE DATABASE IF NOT EXISTS chess_game;

USE chess_game;

drop table player_info;

CREATE TABLE IF NOT EXISTS player_info (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    ELO INT DEFAULT 1000
);
