package com.booking.backend;

import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import java.time.LocalDate;
import java.util.UUID;

import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class HotelSearchTest extends ApiTestSupport {

    private final LocalDate today = LocalDate.now();

    /** A hotel with a unique name/address/city tag, one room type (price, capacity) and one room. */
    private record Setup(String tag, Account manager, long hotel, long room) {
    }

    private Setup hotel(String price, int capacity) throws Exception {
        String tag = "zq" + UUID.randomUUID().toString().substring(0, 8);
        Account m = newManager();
        long hotel = readId(post("/api/admin/hotels", adminToken(), "{\"managerId\":" + m.id()
                + ",\"name\":\"Hotel " + tag + "\",\"address\":\"1 " + tag + " street\",\"city\":\"City " + tag + "\"}")
                .andExpect(status().isCreated()));
        long type = newRoomType(m.token(), hotel, price, capacity);
        return new Setup(tag, m, hotel, newRoom(m.token(), hotel, type));
    }

    @Test
    void matchesNameAddressOrCityCaseInsensitive() throws Exception {
        Setup s = hotel("700000.00", 2);
        for (String q : new String[]{"hotel " + s.tag(), s.tag() + " street", "CITY " + s.tag().toUpperCase()}) {
            call(MockMvcRequestBuilders.get("/api/hotels/search").param("q", q), null, null).andExpect(status().isOk())
                    .andExpect(jsonPath("$[*].hotel.id", hasItem((int) s.hotel())));
        }
        get("/api/hotels/search?q=nothing-" + s.tag(), null).andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void likeWildcardsInTheQueryAreLiteral() throws Exception {
        hotel("700000.00", 2);
        for (String q : new String[]{"%", "_", "!"}) {
            call(MockMvcRequestBuilders.get("/api/hotels/search").param("q", q), null, null)
                    .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(0));
        }
    }

    @Test
    void withoutDatesReturnsFromPriceAndNoRoomCount() throws Exception {
        Setup s = hotel("700000.00", 2);
        get("/api/hotels/search?q=" + s.tag(), null)
                .andExpect(jsonPath("$[0].fromPrice").value(700000.0))
                .andExpect(jsonPath("$[0].availableRooms").doesNotExist());
    }

    @Test
    void travelersAboveEveryCapacityExcludeTheHotel() throws Exception {
        Setup s = hotel("700000.00", 2);
        get("/api/hotels/search?q=" + s.tag() + "&guests=2", null).andExpect(jsonPath("$.length()").value(1));
        get("/api/hotels/search?q=" + s.tag() + "&guests=3", null).andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void withDatesOnlyHotelsWithAFreeRoomAndCountsThem() throws Exception {
        Setup s = hotel("700000.00", 2);
        LocalDate in = today.plusDays(10), out = today.plusDays(12);
        String url = "/api/hotels/search?q=" + s.tag() + "&checkIn=" + in + "&checkOut=" + out + "&guests=1";
        get(url, null).andExpect(jsonPath("$[0].availableRooms").value(1));

        post("/api/bookings", newCustomer().token(), bookingJson(s.room(), in, out, 1)).andExpect(status().isCreated());
        get(url, null).andExpect(jsonPath("$.length()").value(0));
        // touching dates still find it
        get("/api/hotels/search?q=" + s.tag() + "&checkIn=" + out + "&checkOut=" + out.plusDays(1), null)
                .andExpect(jsonPath("$[0].availableRooms").value(1));
    }

    @Test
    void inactiveHotelsAreNotFoundAndNotListedAsDestinations() throws Exception {
        Setup s = hotel("700000.00", 2);
        get("/api/hotels/destinations", null).andExpect(jsonPath("$[*].city", hasItem("City " + s.tag())));
        put("/api/manager/hotels/" + s.hotel(), s.manager().token(),
                "{\"name\":\"Hotel " + s.tag() + "\",\"address\":\"a\",\"city\":\"City " + s.tag() + "\",\"status\":\"INACTIVE\"}")
                .andExpect(status().isOk());
        get("/api/hotels/search?q=" + s.tag(), null).andExpect(jsonPath("$.length()").value(0));
        get("/api/hotels/destinations", null).andExpect(jsonPath("$[*].city", not(hasItem("City " + s.tag()))));
    }

    @Test
    void halfADateRangeOrPastDatesAreRejected() throws Exception {
        get("/api/hotels/search?checkIn=" + today.plusDays(1), null).andExpect(status().isBadRequest());
        get("/api/hotels/search?checkIn=" + today.minusDays(1) + "&checkOut=" + today.plusDays(1), null)
                .andExpect(status().isBadRequest());
        get("/api/hotels/search?guests=0", null).andExpect(status().isBadRequest());
    }
}
