# Booking Room Project

- `backend/`  – Spring Boot REST API (Java 21, Maven)
- `frontend/` – Angular app
- `database/` – MySQL schema & seed scripts

## Run the backend

```
cd backend
export DB_PASSWORD=<mysql root password>
export JWT_SECRET=<at least 32 random characters>
export ADMIN_EMAIL=you@example.com      # optional: creates the first admin at startup
export ADMIN_PASSWORD=<admin password>  # (only if no admin exists yet)
./mvnw spring-boot:run
```

- API: http://localhost:8080/api — Swagger UI: http://localhost:8080/swagger-ui.html
- Tables come from `database/schema.sql` (Hibernate only validates them).
- Tests: `DB_PASSWORD=<pw> ./mvnw test` (uses a separate `booking_db_test` database).

## Run the frontend

Needs Node.js (LTS). Without root, the official tarball unpacked to `~/.local/node` works:
`export PATH=$HOME/.local/node/bin:$PATH`

```
cd frontend
npm install
npx ng serve     # http://localhost:4200
```

## Demo data

`database/seed.sql` adds 8 hotels across Vietnam, 3 managers, 10 customers and ~60 bookings
(past, in-house, upcoming, pending, cancelled). It only adds: existing rows are kept, and a booking
that would overlap an existing one is skipped, so it is safe to run again. Dates are relative to the day you run it.

```
mysql -u root -p booking_db < database/seed.sql
```

Demo logins (password `password123`): managers `anh.pham@demo.vn`, `ha.le@demo.vn`, `quang.vo@demo.vn`;
customers `an.do@demo.vn`, `bao.ngo@demo.vn`, … `nam.ly@demo.vn`.
