-- Booking room database schema (MySQL 8). See DESIGN.md.
CREATE DATABASE IF NOT EXISTS booking_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE booking_db;

CREATE TABLE users (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    full_name     VARCHAR(100) NOT NULL,
    email         VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone         VARCHAR(20),
    role          ENUM('CUSTOMER', 'MANAGER', 'ADMIN') NOT NULL DEFAULT 'CUSTOMER',
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE hotels (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    manager_id  BIGINT NOT NULL,
    name        VARCHAR(150) NOT NULL,
    address     VARCHAR(255) NOT NULL,
    city        VARCHAR(100) NOT NULL,
    phone       VARCHAR(20),
    description TEXT,
    image_url   VARCHAR(255),
    status      ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (manager_id) REFERENCES users (id),
    INDEX idx_city (city)
);

CREATE TABLE room_types (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    hotel_id        BIGINT NOT NULL,
    name            VARCHAR(50) NOT NULL,
    description     TEXT,
    price_per_night DECIMAL(10, 2) NOT NULL CHECK (price_per_night > 0),
    capacity        INT NOT NULL CHECK (capacity > 0),
    FOREIGN KEY (hotel_id) REFERENCES hotels (id),
    UNIQUE (hotel_id, name)
);

CREATE TABLE rooms (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    hotel_id     BIGINT NOT NULL,
    room_number  VARCHAR(10) NOT NULL,
    room_type_id BIGINT NOT NULL,
    floor        INT,
    status       ENUM('AVAILABLE', 'MAINTENANCE') NOT NULL DEFAULT 'AVAILABLE',
    image_url    VARCHAR(255),
    FOREIGN KEY (hotel_id) REFERENCES hotels (id),
    FOREIGN KEY (room_type_id) REFERENCES room_types (id),
    UNIQUE (hotel_id, room_number)
);

CREATE TABLE bookings (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT NOT NULL,
    room_id     BIGINT NOT NULL,
    check_in    DATE NOT NULL,
    check_out   DATE NOT NULL,
    guests      INT NOT NULL CHECK (guests > 0),
    total_price DECIMAL(10, 2) NOT NULL,
    status      ENUM('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED') NOT NULL DEFAULT 'PENDING',
    note        VARCHAR(500),
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (room_id) REFERENCES rooms (id),
    CHECK (check_out > check_in),
    INDEX idx_room_dates (room_id, check_in, check_out)
);
