# Frontend Plan

Build the Angular app on top of the finished backend API, one phase at a time. Each phase ends **green**: `ng build` succeeds, `ng test` passes, and the phase's manual checks work against the running backend. Start the next phase only once the current one is green.

The backend is the source of truth for every rule (ownership, overlap, allowed status changes, validation). The UI mirrors those rules to guide the user, then shows the backend's answer when it disagrees. Endpoints and payloads: [`../backend/PLAN.md`](../backend/PLAN.md) endpoint map, and live at `http://localhost:8080/swagger-ui.html`.

## Conventions (every phase)

- **Angular:** current CLI, standalone components, signals for state, Angular Router, `HttpClient`. Reactive forms for every form.
- **UI kit:** Angular Material (tables, forms, dialogs, snackbar, date picker).
- **API base URL:** `environment.apiUrl = 'http://localhost:8080/api'`. The backend already allows CORS from `http://localhost:4200`.
- **Models:** TypeScript interfaces in `core/models/` that copy the backend DTOs field for field (`HotelResponse`, `BookingResponse`, …). Update them whenever a backend DTO changes.
- **API services:** one service per backend area in `core/api/` (`AuthApi`, `HotelApi`, `BookingApi`, `ManagerApi`, `AdminApi`). Components call services, never `HttpClient` directly.
- **Auth state:** `AuthService` holds the token and current user in signals and in `localStorage`, so a page reload keeps the session. It decodes `role` and `exp` from the JWT.
- **Interceptor:** adds `Authorization: Bearer <token>` to API calls. On 401 it logs out and redirects to `/login?returnUrl=…`.
- **Errors:** the backend returns `{ status, message, fieldErrors }`. Forms show `fieldErrors` under the matching inputs; everything else shows `message` in a snackbar.
- **Dates:** send `checkIn`/`checkOut` as local `yyyy-MM-dd` strings built from the date's year/month/day. **Gotcha:** `date.toISOString()` converts to UTC first, which in Vietnam (UTC+7) shifts a date picked before 07:00 to the previous day.
- **Money:** `pricePerNight` and `totalPrice` arrive as numbers; display them with one shared currency pipe setting (see open questions).

## Folder layout

```
src/app/
├── core/        models/, api/, auth/ (AuthService, interceptor, guards), error handling
├── shared/      reusable components and pipes (status badge, confirm dialog, money)
├── layout/      toolbar with role-based menu
└── features/
    ├── public/    hotel search, hotel detail + availability
    ├── auth/      login, register
    ├── customer/  booking form, my bookings
    ├── manager/   my hotels, hotel edit, room types, rooms, hotel bookings
    └── admin/     users, hotels
```

## Routes

| Path                                  | Who               | Page |
|---------------------------------------|-------------------|------|
| `/`                                   | Everyone          | Hotel search (city filter) |
| `/hotels/:id`                         | Everyone          | Hotel detail, room types, availability search |
| `/login`, `/register`                 | Logged-out users  | Auth forms |
| `/bookings`                           | Logged in         | My bookings, cancel |
| `/manager`                            | MANAGER, ADMIN    | My hotels |
| `/manager/hotels/:id`                 | MANAGER, ADMIN    | Tabs: details, room types, rooms, bookings |
| `/admin/users`                        | ADMIN             | Users and roles |
| `/admin/hotels`                       | ADMIN             | All hotels, create, assign manager |

Guards: `authGuard` (logged in) and `roleGuard(['MANAGER','ADMIN'])` / `roleGuard(['ADMIN'])`. A guard failure redirects to `/login` when logged out and to `/` when the role is wrong. Guards only hide pages; the backend still enforces every permission.

## Phases

### 0. Setup
Install Node LTS and the Angular CLI (`sudo apt install nodejs npm`, `npm i -g @angular/cli`). Create the app inside `frontend/` (routing on, SCSS), add Angular Material, create `environment.ts` with `apiUrl`, and the folder layout above with an empty toolbar.

**Green when:** `ng serve` shows the toolbar at `http://localhost:4200`; `ng build` and `ng test` pass.

### 1. Core
Models, API services, `AuthService`, interceptor, guards, error handling (snackbar + form field errors helper).

**Green when:** unit tests prove: the interceptor adds the header when logged in and none when logged out; a 401 response clears the session and navigates to `/login`; `roleGuard(['ADMIN'])` allows ADMIN and redirects CUSTOMER to `/`; an expired token counts as logged out.

### 2. Auth pages and toolbar
Login and register forms; toolbar shows Login/Register when logged out, and the user's name, Logout, and role-based links (My bookings; Manager; Admin) when logged in. After login, return to `returnUrl`.

**Green when:** register → logged in as CUSTOMER and sees only "My bookings"; reload keeps the session; logout clears it; duplicate email shows the backend message; a weak password shows the field error under the password input.

### 3. Public search and availability
Hotel list with city search; hotel detail with room types; availability form (check-in, check-out, guests) listing free rooms with price per night and the total for the stay. Date picker blocks past days and check-out ≤ check-in.

**Green when:** an INACTIVE or unknown hotel shows a "Hotel not found" page; a room booked for the chosen dates is absent; a stay starting on another booking's check-out day still lists the room.

### 4. Customer bookings
"Book" on an available room: logged-out users go to login and come back; logged-in users confirm in a dialog (dates, guests, total, note). My bookings lists status and total; Cancel appears only for PENDING/CONFIRMED bookings before check-in.

**Green when:** a successful booking appears in My bookings as PENDING with the same total shown before booking; a 409 (someone booked it first) shows "Room is already booked for these dates" and refreshes availability; cancel turns the row CANCELLED.

### 5. Manager
My hotels list; hotel page with tabs: edit details (incl. ACTIVE/INACTIVE), room types CRUD, rooms CRUD (room type dropdown limited to this hotel, status AVAILABLE/MAINTENANCE), and bookings with action buttons for allowed transitions only: PENDING → Confirm / Cancel; CONFIRMED → Complete / Cancel. Delete asks for confirmation; a 409 (still in use) shows the backend message.

**Green when:** a CUSTOMER opening `/manager` lands on `/`; a manager sees only their own hotels; each CRUD action updates the table without reload; deleting a room type still used by rooms shows the 409 message; status buttons match the transitions above.

### 6. Admin
Users table with a role dropdown (own row disabled); hotels table with "Create hotel" dialog and "Change manager", both choosing from users whose role is MANAGER. After a role change, show a note that the user must log in again for it to apply (the role lives in their token).

**Green when:** promoting a customer to MANAGER and logging in as them shows the Manager menu; creating a hotel for that manager makes it appear on their `/manager` page; demoting a manager who still has hotels shows the 409 message.

### 7. Polish
Loading spinners on every request, empty states ("No rooms free for these dates"), layout that works at phone width, page titles.

**Green when:** every page shows a spinner while loading and a message when empty; at 375px wide no page scrolls sideways.

## Decisions

1. **UI kit:** Angular Material.
2. **Currency:** VND, no decimals.
3. **Who can book:** any logged-in user, matching the backend. A logged-out visitor who clicks Book goes to login and returns to the same search.
