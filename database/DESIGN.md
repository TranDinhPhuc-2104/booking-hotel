# Database Design — `booking_db` (MySQL 8)

Assumption: hotel-style room booking across many hotels (guests book a room for a date range).

## Roles

| Role       | Can do                                                                 |
|------------|------------------------------------------------------------------------|
| `CUSTOMER` | Browse hotels/rooms, create and cancel their own bookings              |
| `MANAGER`  | Manage **their own** hotels: hotel info, room types, rooms, and the bookings for those hotels (confirm / cancel / complete) |
| `ADMIN`    | Everything: create hotels, assign a manager to a hotel, manage users   |

## Relationships

```
users (MANAGER) 1 ──< hotels 1 ──< room_types 1 ──< rooms 1 ──< bookings >── 1 users (CUSTOMER)
                          1 ──< rooms
```

- A manager can manage many hotels; each hotel has one manager.
- A hotel has many room types and many rooms.
- Each room belongs to one room type of the **same** hotel (checked in the service layer).
- A user can have many bookings; a room can have many bookings (never overlapping, unless cancelled).

## Tables

### `users`
| Column        | Type                        | Notes                    |
|---------------|-----------------------------|--------------------------|
| id            | BIGINT PK AUTO_INCREMENT    |                          |
| full_name     | VARCHAR(100) NOT NULL       |                          |
| email         | VARCHAR(150) NOT NULL       | UNIQUE, used for login   |
| password_hash | VARCHAR(255) NOT NULL       | BCrypt hash, never plain |
| phone         | VARCHAR(20)                 |                          |
| role          | ENUM('CUSTOMER','MANAGER','ADMIN') | default CUSTOMER  |
| created_at    | DATETIME                    | default now              |
| updated_at    | DATETIME                    | auto-updated             |

### `hotels`
| Column      | Type                         | Notes                                |
|-------------|------------------------------|--------------------------------------|
| id          | BIGINT PK AUTO_INCREMENT     |                                      |
| manager_id  | BIGINT NOT NULL              | FK → users.id (user must be MANAGER, checked in service) |
| name        | VARCHAR(150) NOT NULL        |                                      |
| address     | VARCHAR(255) NOT NULL        |                                      |
| city        | VARCHAR(100) NOT NULL        | indexed, for search                  |
| phone       | VARCHAR(20)                  |                                      |
| description | TEXT                         |                                      |
| image_url   | VARCHAR(255)                 |                                      |
| status      | ENUM('ACTIVE','INACTIVE')    | default ACTIVE; inactive hotels are hidden from customers |
| created_at  | DATETIME                     | default now                          |

### `room_types`
| Column          | Type                     | Notes                   |
|-----------------|--------------------------|-------------------------|
| id              | BIGINT PK AUTO_INCREMENT |                         |
| hotel_id        | BIGINT NOT NULL          | FK → hotels.id          |
| name            | VARCHAR(50) NOT NULL     | e.g. Single, Double, Suite; UNIQUE per hotel `(hotel_id, name)` |
| description     | TEXT                     |                         |
| price_per_night | DECIMAL(10,2) NOT NULL   | > 0                     |
| capacity        | INT NOT NULL             | max guests, > 0         |

### `rooms`
| Column       | Type                                  | Notes                 |
|--------------|---------------------------------------|-----------------------|
| id           | BIGINT PK AUTO_INCREMENT              |                       |
| hotel_id     | BIGINT NOT NULL                       | FK → hotels.id        |
| room_number  | VARCHAR(10) NOT NULL                  | e.g. "101"; UNIQUE per hotel `(hotel_id, room_number)` |
| room_type_id | BIGINT NOT NULL                       | FK → room_types.id (same hotel) |
| floor        | INT                                   |                       |
| status       | ENUM('AVAILABLE','MAINTENANCE')       | default AVAILABLE     |
| image_url    | VARCHAR(255)                          |                       |

"Booked" is not a room status: whether a room is free is computed from `bookings` for the requested dates.

### `bookings`
| Column      | Type                                                     | Notes                          |
|-------------|----------------------------------------------------------|--------------------------------|
| id          | BIGINT PK AUTO_INCREMENT                                 |                                |
| user_id     | BIGINT NOT NULL                                          | FK → users.id                  |
| room_id     | BIGINT NOT NULL                                          | FK → rooms.id                  |
| check_in    | DATE NOT NULL                                            |                                |
| check_out   | DATE NOT NULL                                            | must be > check_in             |
| guests      | INT NOT NULL                                             | > 0, ≤ room type capacity (checked in service) |
| total_price | DECIMAL(10,2) NOT NULL                                   | nights × price, frozen at booking time |
| status      | ENUM('PENDING','CONFIRMED','CANCELLED','COMPLETED')      | default PENDING                |
| note        | VARCHAR(500)                                             |                                |
| created_at  | DATETIME                                                 | default now                    |

Index on `(room_id, check_in, check_out)` for the availability check.

## Business rules (enforced in the Spring service layer)

- **No double booking:** a new booking for room R is rejected if a non-cancelled booking exists where
  `existing.check_in < new.check_out AND existing.check_out > new.check_in`.
- A room in `MAINTENANCE`, or in an `INACTIVE` hotel, cannot be booked.
- A manager can only read/change hotels where `hotels.manager_id` = their user id (and the room types, rooms and bookings under them).
- Only an admin can create a hotel or change its `manager_id`.
- `total_price` is copied at booking time so later price changes don't alter old bookings.

## Left out for now (can add later)
- `payments` (amount, method, status, paid_at)
- `reviews` (user, room, rating, comment)
- `amenities` + `room_type_amenities` (WiFi, TV, …)
