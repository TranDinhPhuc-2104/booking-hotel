# Backend Plan

Build the booking REST API on top of the existing entities and repositories, one phase at a time. Each phase ends **green**: `./mvnw test` passes and the phase's curl checks return the listed status codes. Start the next phase only once the current one is green.

Tables, columns and business rules live in [`../database/DESIGN.md`](../database/DESIGN.md); that file is the source of truth for the data model. `schema.sql` owns the tables (`ddl-auto=validate`), so any schema change goes into `schema.sql` and `DESIGN.md` first.

## Conventions (every phase)

- **Layers:** controller → service → repository. Controllers stay thin: validate input, call one service method, return a DTO.
- **DTOs:** Java `record`s in `dto/`, one request and one response record per use case. Controllers return DTOs only, so lazy entity links never reach Jackson.
- **Transactions:** `@Transactional` on service methods that write; `@Transactional(readOnly = true)` on those that read and map lazy links.
- **Errors:** services throw `NotFoundException` (404), `BadRequestException` (400), `ConflictException` (409) or Spring's `AccessDeniedException` (403). One `@RestControllerAdvice` turns each into `{ "status", "message", "fieldErrors" }`.
- **Ownership:** a manager reaches a hotel only through `HotelService.requireOwned(hotelId, currentUser)`, which loads the hotel and throws 403 when `hotel.manager.id` differs from the current user. Every manager endpoint for room types, rooms and bookings goes through it. Admins pass it for every hotel.
- **Config from env:** `DB_PASSWORD`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`. Keep secrets out of committed files.
- **Base path:** `/api`.

## Endpoint map

| Who      | Method & path                                              | Purpose |
|----------|------------------------------------------------------------|---------|
| Public   | `POST /api/auth/register`                                  | Sign up; role is always CUSTOMER |
| Public   | `POST /api/auth/login`                                     | Returns `{ token, user }` |
| Any user | `GET  /api/auth/me`                                        | Current user |
| Public   | `GET  /api/hotels?city=`                                   | ACTIVE hotels |
| Public   | `GET  /api/hotels/search?q=&checkIn=&checkOut=&guests=`    | Text search over name/address/city; with dates, only hotels with a free room (+ count, from-price) |
| Public   | `GET  /api/hotels/destinations`                            | Cities with ACTIVE hotels and their counts |
| Public   | `GET  /api/hotels/{id}`                                    | Hotel detail with room types |
| Public   | `GET  /api/hotels/{id}/available-rooms?checkIn=&checkOut=&guests=` | Rooms free for the dates |
| Customer | `POST /api/bookings`                                       | Create booking |
| Customer | `GET  /api/bookings/me`                                    | Own bookings |
| Customer | `PATCH /api/bookings/{id}/cancel`                          | Cancel own booking |
| Manager  | `GET  /api/manager/hotels`, `PUT /api/manager/hotels/{id}` | Own hotels |
| Manager  | `GET/POST/PUT/DELETE /api/manager/hotels/{id}/room-types[/{typeId}]` | Room types |
| Manager  | `GET/POST/PUT/DELETE /api/manager/hotels/{id}/rooms[/{roomId}]`      | Rooms |
| Manager  | `GET  /api/manager/hotels/{id}/bookings`                   | Hotel's bookings |
| Manager  | `PATCH /api/manager/bookings/{id}/status`                  | Confirm / cancel / complete |
| Admin    | `GET  /api/admin/users`, `PATCH /api/admin/users/{id}/role` | Users and roles |
| Admin    | `GET/POST /api/admin/hotels`, `PATCH /api/admin/hotels/{id}/manager` | Create hotels, assign manager |

## Phases

### 1. Foundations
Add the exception classes, the `@RestControllerAdvice`, and a CORS config allowing `http://localhost:4200`. Add a `test` profile (`application-test.properties`) pointing at `booking_db_test` with `ddl-auto=create-drop`, so tests never touch `booking_db`; replace the default `contextLoads` test with one that runs under that profile.

**Green when:** `./mvnw test` passes, and `GET /api/hotels/999` returns 404 with the JSON error body (stub the endpoint if needed).

### 2. Security
Add `spring-boot-starter-security` and `spring-boot-starter-oauth2-resource-server`. Sign tokens with HS256 using `JWT_SECRET` (`NimbusJwtEncoder`/`NimbusJwtDecoder`), put the user id in `sub` and the role in a `role` claim, and map it to `ROLE_<role>`. Stateless sessions, BCrypt passwords. Path rules: `/api/auth/register|login` and `GET /api/hotels/**` public; `/api/manager/**` MANAGER or ADMIN; `/api/admin/**` ADMIN; everything else authenticated. A `CommandLineRunner` creates the first ADMIN from `ADMIN_EMAIL`/`ADMIN_PASSWORD` when no admin exists.

**Green when:** register → 201; duplicate email → 409; login → token; `/api/auth/me` with token → 200, without → 401; a CUSTOMER token on `/api/admin/users` → 403.

### 3. Admin
User list and role change; create hotel with a `managerId`; reassign manager. Reject a `managerId` whose user is not MANAGER (400).

**Green when:** admin creates a hotel for a manager → 201; same call with a CUSTOMER id → 400; a MANAGER token on `/api/admin/hotels` → 403.

### 4. Manager
Own hotels, room types, rooms and bookings, all through `requireOwned`. A room's room type must belong to the same hotel (400). Deleting a room type or room that bookings or rooms still reference → 409.

**Green when:** manager A edits their own hotel → 200; manager A touches manager B's hotel, room type, room or bookings → 403 on every one of those endpoints (one test per endpoint); room with another hotel's room type → 400.

### 5. Public search and availability
Hotel list filtered by city (ACTIVE only), hotel detail, available rooms: rooms in the hotel with status AVAILABLE, a room type with `capacity >= guests`, and no **overlap** (`BookingRepository.existsOverlap`). Validate `checkIn >= today` and `checkOut > checkIn` (400).

**Green when:** a room with a booking overlapping the dates is absent from the result; the same room is present for dates touching but not overlapping (check-out day = next check-in day); INACTIVE hotel → 404.

### 6. Bookings
Create: enforce every rule in DESIGN.md (no overlap, room AVAILABLE, hotel ACTIVE, guests ≤ capacity, `total_price = nights × price_per_night` frozen now). **Concurrency gotcha:** two requests for the same room can both pass `existsOverlap` before either inserts. Lock the room row first (`RoomRepository.findByIdForUpdate` with `@Lock(PESSIMISTIC_WRITE)`), then check overlap, then insert, all in one transaction.

Status transitions, reject the rest with 400:
- Customer, own booking: PENDING or CONFIRMED → CANCELLED, before `check_in`.
- Manager, owned hotel: PENDING → CONFIRMED; PENDING or CONFIRMED → CANCELLED; CONFIRMED → COMPLETED.

**Green when:** overlapping booking → 409; touching dates → 201; guests over capacity → 400; total price correct for a 3-night stay; every allowed transition succeeds and one disallowed transition per role returns 400; a customer cancelling someone else's booking → 403.

### 7. API docs
Add `springdoc-openapi-starter-webmvc-ui` with a Bearer auth scheme so the Angular work can use Swagger UI at `/swagger-ui.html`.

**Green when:** Swagger UI lists every endpoint in the map above, and "Authorize" with a token makes a protected call return 200.
