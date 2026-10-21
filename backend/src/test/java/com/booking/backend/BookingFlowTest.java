package com.booking.backend;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class BookingFlowTest extends ApiTestSupport {

    private final LocalDate today = LocalDate.now();

    /** One hotel with one room (capacity 2, 100.00/night). */
    private record Setup(Account manager, long hotel, long room) {
    }

    private Setup setup() throws Exception {
        Account manager = newManager();
        long hotel = newHotel(manager.id());
        long type = newRoomType(manager.token(), hotel, "100.00", 2);
        return new Setup(manager, hotel, newRoom(manager.token(), hotel, type));
    }

    private String availableUrl(long hotel, LocalDate in, LocalDate out, int guests) {
        return "/api/hotels/" + hotel + "/available-rooms?checkIn=" + in + "&checkOut=" + out + "&guests=" + guests;
    }

    @Test
    void publicSearchByCityOnlyShowsActiveHotels() throws Exception {
        Account m = newManager();
        long hotel = newHotel(m.id());
        get("/api/hotels?city=hanoi", null).andExpect(status().isOk())
                .andExpect(jsonPath("$[*].id", hasItem((int) hotel)));
        put("/api/manager/hotels/" + hotel, m.token(),
                "{\"name\":\"H\",\"address\":\"a\",\"city\":\"Hanoi\",\"status\":\"INACTIVE\"}").andExpect(status().isOk());
        get("/api/hotels?city=hanoi", null).andExpect(jsonPath("$[*].id", not(hasItem((int) hotel))));
        get("/api/hotels/" + hotel, null).andExpect(status().isNotFound());
        get(availableUrl(hotel, today.plusDays(1), today.plusDays(2), 1), null).andExpect(status().isNotFound());
    }

    @Test
    void availabilityExcludesOverlappingButKeepsTouchingDates() throws Exception {
        Setup s = setup();
        post("/api/bookings", newCustomer().token(), bookingJson(s.room(), today.plusDays(10), today.plusDays(13), 1))
                .andExpect(status().isCreated());

        get(availableUrl(s.hotel(), today.plusDays(12), today.plusDays(15), 1), null)
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(0));
        get(availableUrl(s.hotel(), today.plusDays(13), today.plusDays(15), 1), null)
                .andExpect(jsonPath("$.length()").value(1));
        get(availableUrl(s.hotel(), today.plusDays(8), today.plusDays(10), 1), null)
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void availabilityFiltersByCapacityAndMaintenanceAndValidatesDates() throws Exception {
        Setup s = setup();
        get(availableUrl(s.hotel(), today.plusDays(1), today.plusDays(2), 3), null).andExpect(jsonPath("$.length()").value(0));
        put("/api/manager/hotels/" + s.hotel() + "/rooms/" + s.room(), s.manager().token(),
                "{\"roomNumber\":\"X1\",\"roomTypeId\":" + readTypeId(s) + ",\"status\":\"MAINTENANCE\"}").andExpect(status().isOk());
        get(availableUrl(s.hotel(), today.plusDays(1), today.plusDays(2), 1), null).andExpect(jsonPath("$.length()").value(0));

        get(availableUrl(s.hotel(), today.plusDays(3), today.plusDays(3), 1), null).andExpect(status().isBadRequest());
        get(availableUrl(s.hotel(), today.minusDays(1), today.plusDays(1), 1), null).andExpect(status().isBadRequest());
    }

    private long readTypeId(Setup s) throws Exception {
        return ((Number) read(get("/api/manager/hotels/" + s.hotel() + "/rooms", s.manager().token()), "$[0].roomTypeId")).longValue();
    }

    @Test
    void bookingComputesTotalAndRejectsOverlapGuestsAndPast() throws Exception {
        Setup s = setup();
        Account guest = newCustomer();
        post("/api/bookings", guest.token(), bookingJson(s.room(), today.plusDays(20), today.plusDays(23), 2))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.totalPrice").value(300.0))
                .andExpect(jsonPath("$.status").value("PENDING"));

        post("/api/bookings", newCustomer().token(), bookingJson(s.room(), today.plusDays(22), today.plusDays(24), 1))
                .andExpect(status().isConflict());
        post("/api/bookings", newCustomer().token(), bookingJson(s.room(), today.plusDays(23), today.plusDays(24), 1))
                .andExpect(status().isCreated());
        post("/api/bookings", guest.token(), bookingJson(s.room(), today.plusDays(40), today.plusDays(41), 3))
                .andExpect(status().isBadRequest());
        post("/api/bookings", guest.token(), bookingJson(s.room(), today.minusDays(1), today.plusDays(1), 1))
                .andExpect(status().isBadRequest());
        post("/api/bookings", null, bookingJson(s.room(), today.plusDays(40), today.plusDays(41), 1))
                .andExpect(status().isUnauthorized());
        get("/api/bookings/me", guest.token()).andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void cancelledBookingFreesTheRoom() throws Exception {
        Setup s = setup();
        Account guest = newCustomer();
        long id = readId(post("/api/bookings", guest.token(), bookingJson(s.room(), today.plusDays(30), today.plusDays(32), 1))
                .andExpect(status().isCreated()));
        patch("/api/bookings/" + id + "/cancel", guest.token(), null)
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("CANCELLED"));
        patch("/api/bookings/" + id + "/cancel", guest.token(), null).andExpect(status().isBadRequest());
        post("/api/bookings", newCustomer().token(), bookingJson(s.room(), today.plusDays(30), today.plusDays(32), 1))
                .andExpect(status().isCreated());
    }

    @Test
    void customerCannotCancelSomeoneElsesBooking() throws Exception {
        Setup s = setup();
        long id = readId(post("/api/bookings", newCustomer().token(),
                bookingJson(s.room(), today.plusDays(30), today.plusDays(32), 1)).andExpect(status().isCreated()));
        patch("/api/bookings/" + id + "/cancel", newCustomer().token(), null).andExpect(status().isForbidden());
    }

    @Test
    void managerStatusTransitions() throws Exception {
        Setup s = setup();
        String m = s.manager().token();
        long id = readId(post("/api/bookings", newCustomer().token(),
                bookingJson(s.room(), today.plusDays(50), today.plusDays(52), 1)).andExpect(status().isCreated()));
        String url = "/api/manager/bookings/" + id + "/status";

        patch(url, m, "{\"status\":\"COMPLETED\"}").andExpect(status().isBadRequest());   // PENDING -> COMPLETED
        patch(url, m, "{\"status\":\"CONFIRMED\"}").andExpect(status().isOk());
        patch(url, m, "{\"status\":\"PENDING\"}").andExpect(status().isBadRequest());     // no way back
        patch(url, m, "{\"status\":\"COMPLETED\"}").andExpect(status().isOk());
        patch(url, m, "{\"status\":\"CANCELLED\"}").andExpect(status().isBadRequest());   // terminal

        get("/api/manager/hotels/" + s.hotel() + "/bookings", m).andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status").value("COMPLETED"));
    }

    @Test
    void concurrentBookingsOfOneRoomLetExactlyOneWin() throws Exception {
        Setup s = setup();
        int threads = 6;
        List<String> tokens = new java.util.ArrayList<>();
        for (int i = 0; i < threads; i++) {
            tokens.add(newCustomer().token());
        }
        String body = bookingJson(s.room(), today.plusDays(60), today.plusDays(62), 1);

        ExecutorService pool = Executors.newFixedThreadPool(threads);
        try {
            List<Future<Integer>> results = new java.util.ArrayList<>();
            for (String token : tokens) {
                Callable<Integer> task = () -> post("/api/bookings", token, body).andReturn().getResponse().getStatus();
                results.add(pool.submit(task));
            }
            int created = 0;
            int conflicts = 0;
            for (Future<Integer> f : results) {
                int code = f.get();
                if (code == 201) created++;
                if (code == 409) conflicts++;
            }
            assertThat(created).isEqualTo(1);
            assertThat(conflicts).isEqualTo(threads - 1);
        } finally {
            pool.shutdown();
        }
    }
}
