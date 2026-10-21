package com.booking.backend;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AdminManagerTest extends ApiTestSupport {

    @Test
    void adminCreatesHotelForManagerButNotForCustomer() throws Exception {
        Account manager = newManager();
        post("/api/admin/hotels", adminToken(), "{\"managerId\":" + manager.id()
                + ",\"name\":\"H\",\"address\":\"a\",\"city\":\"Hue\"}")
                .andExpect(status().isCreated()).andExpect(jsonPath("$.managerId").value(manager.id()));

        Account customer = newCustomer();
        post("/api/admin/hotels", adminToken(), "{\"managerId\":" + customer.id()
                + ",\"name\":\"H\",\"address\":\"a\",\"city\":\"Hue\"}").andExpect(status().isBadRequest());
    }

    @Test
    void managerTokenCannotCreateHotels() throws Exception {
        Account manager = newManager();
        post("/api/admin/hotels", manager.token(), "{\"managerId\":" + manager.id()
                + ",\"name\":\"H\",\"address\":\"a\",\"city\":\"Hue\"}").andExpect(status().isForbidden());
    }

    @Test
    void adminCannotDemoteManagerWhoStillHasHotels() throws Exception {
        Account manager = newManager();
        newHotel(manager.id());
        patch("/api/admin/users/" + manager.id() + "/role", adminToken(), "{\"role\":\"CUSTOMER\"}")
                .andExpect(status().isConflict());
    }

    @Test
    void adminReassignsHotelToAnotherManager() throws Exception {
        Account a = newManager();
        Account b = newManager();
        long hotel = newHotel(a.id());
        patch("/api/admin/hotels/" + hotel + "/manager", adminToken(), "{\"managerId\":" + b.id() + "}")
                .andExpect(status().isOk()).andExpect(jsonPath("$.managerId").value(b.id()));
        put("/api/manager/hotels/" + hotel, a.token(), "{\"name\":\"X\",\"address\":\"a\",\"city\":\"c\"}")
                .andExpect(status().isForbidden());
    }

    @Test
    void managerEditsOwnHotelAndSeesOnlyOwnHotels() throws Exception {
        Account a = newManager();
        long hotel = newHotel(a.id());
        newHotel(newManager().id());
        put("/api/manager/hotels/" + hotel, a.token(),
                "{\"name\":\"Renamed\",\"address\":\"a\",\"city\":\"Da Nang\"}")
                .andExpect(status().isOk()).andExpect(jsonPath("$.name").value("Renamed"));
        get("/api/manager/hotels", a.token()).andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void managerGets403OnEveryEndpointOfAnotherManagersHotel() throws Exception {
        Account a = newManager();
        Account b = newManager();
        long hotelB = newHotel(b.id());
        long typeB = newRoomType(b.token(), hotelB, "100.00", 2);
        long roomB = newRoom(b.token(), hotelB, typeB);
        Account guest = newCustomer();
        long bookingB = readId(post("/api/bookings", guest.token(),
                bookingJson(roomB, LocalDate.now().plusDays(5), LocalDate.now().plusDays(7), 1)).andExpect(status().isCreated()));

        String base = "/api/manager/hotels/" + hotelB;
        String t = a.token();
        String typeBody = "{\"name\":\"Hack\",\"pricePerNight\":1,\"capacity\":1}";
        String roomBody = "{\"roomNumber\":\"999\",\"roomTypeId\":" + typeB + "}";

        put(base, t, "{\"name\":\"X\",\"address\":\"a\",\"city\":\"c\"}").andExpect(status().isForbidden());
        get(base + "/bookings", t).andExpect(status().isForbidden());
        patch("/api/manager/bookings/" + bookingB + "/status", t, "{\"status\":\"CONFIRMED\"}").andExpect(status().isForbidden());
        get(base + "/room-types", t).andExpect(status().isForbidden());
        post(base + "/room-types", t, typeBody).andExpect(status().isForbidden());
        put(base + "/room-types/" + typeB, t, typeBody).andExpect(status().isForbidden());
        delete(base + "/room-types/" + typeB, t).andExpect(status().isForbidden());
        get(base + "/rooms", t).andExpect(status().isForbidden());
        post(base + "/rooms", t, roomBody).andExpect(status().isForbidden());
        put(base + "/rooms/" + roomB, t, roomBody).andExpect(status().isForbidden());
        delete(base + "/rooms/" + roomB, t).andExpect(status().isForbidden());

        // the real owner is unaffected
        get(base + "/rooms", b.token()).andExpect(status().isOk());
    }

    @Test
    void roomMustUseRoomTypeOfSameHotel() throws Exception {
        Account a = newManager();
        long hotel1 = newHotel(a.id());
        long hotel2 = newHotel(a.id());
        long typeOfHotel2 = newRoomType(a.token(), hotel2, "50.00", 2);
        post("/api/manager/hotels/" + hotel1 + "/rooms", a.token(),
                "{\"roomNumber\":\"101\",\"roomTypeId\":" + typeOfHotel2 + "}").andExpect(status().isBadRequest());
    }

    @Test
    void duplicateRoomNumberInHotelConflictsButSameNumberInOtherHotelIsFine() throws Exception {
        Account a = newManager();
        long hotel1 = newHotel(a.id());
        long hotel2 = newHotel(a.id());
        long type1 = newRoomType(a.token(), hotel1, "50.00", 2);
        long type2 = newRoomType(a.token(), hotel2, "50.00", 2);
        post("/api/manager/hotels/" + hotel1 + "/rooms", a.token(), "{\"roomNumber\":\"101\",\"roomTypeId\":" + type1 + "}")
                .andExpect(status().isCreated());
        post("/api/manager/hotels/" + hotel1 + "/rooms", a.token(), "{\"roomNumber\":\"101\",\"roomTypeId\":" + type1 + "}")
                .andExpect(status().isConflict());
        post("/api/manager/hotels/" + hotel2 + "/rooms", a.token(), "{\"roomNumber\":\"101\",\"roomTypeId\":" + type2 + "}")
                .andExpect(status().isCreated());
    }

    @Test
    void cannotDeleteRoomTypeInUseOrRoomWithBookings() throws Exception {
        Account a = newManager();
        long hotel = newHotel(a.id());
        long type = newRoomType(a.token(), hotel, "50.00", 2);
        long room = newRoom(a.token(), hotel, type);
        delete("/api/manager/hotels/" + hotel + "/room-types/" + type, a.token()).andExpect(status().isConflict());

        post("/api/bookings", newCustomer().token(),
                bookingJson(room, LocalDate.now().plusDays(3), LocalDate.now().plusDays(4), 1)).andExpect(status().isCreated());
        delete("/api/manager/hotels/" + hotel + "/rooms/" + room, a.token()).andExpect(status().isConflict());

        long emptyType = newRoomType(a.token(), hotel, "60.00", 2);
        long emptyRoom = newRoom(a.token(), hotel, emptyType);
        delete("/api/manager/hotels/" + hotel + "/rooms/" + emptyRoom, a.token()).andExpect(status().isNoContent());
        delete("/api/manager/hotels/" + hotel + "/room-types/" + emptyType, a.token()).andExpect(status().isNoContent());
    }
}
