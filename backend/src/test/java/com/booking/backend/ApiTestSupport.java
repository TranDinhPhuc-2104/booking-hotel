package com.booking.backend;

import com.jayway.jsonpath.JsonPath;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import java.util.UUID;

import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Runs against booking_db_test (create-drop). Every test makes its own users/hotels, so no cleanup is needed. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
abstract class ApiTestSupport {

    record Account(long id, String token) {
    }

    @Autowired
    protected MockMvc mvc;

    protected ResultActions call(MockHttpServletRequestBuilder request, String token, String body) throws Exception {
        if (token != null) {
            request.header("Authorization", "Bearer " + token);
        }
        if (body != null) {
            request.contentType(MediaType.APPLICATION_JSON).content(body);
        }
        return mvc.perform(request);
    }

    protected ResultActions get(String path, String token) throws Exception {
        return call(MockMvcRequestBuilders.get(path), token, null);
    }

    protected ResultActions post(String path, String token, String body) throws Exception {
        return call(MockMvcRequestBuilders.post(path), token, body);
    }

    protected ResultActions put(String path, String token, String body) throws Exception {
        return call(MockMvcRequestBuilders.put(path), token, body);
    }

    protected ResultActions patch(String path, String token, String body) throws Exception {
        return call(MockMvcRequestBuilders.patch(path), token, body);
    }

    protected ResultActions delete(String path, String token) throws Exception {
        return call(MockMvcRequestBuilders.delete(path), token, null);
    }

    protected <T> T read(ResultActions result, String jsonPath) throws Exception {
        return JsonPath.read(result.andReturn().getResponse().getContentAsString(), jsonPath);
    }

    protected long readId(ResultActions result) throws Exception {
        return ((Number) read(result, "$.id")).longValue();
    }

    protected String adminToken() throws Exception {
        return read(post("/api/auth/login", null,
                "{\"email\":\"admin@test.local\",\"password\":\"admin-pass-123\"}").andExpect(status().isOk()), "$.token");
    }

    protected String uniqueEmail() {
        return UUID.randomUUID().toString().substring(0, 8) + "@test.local";
    }

    protected Account newCustomer() throws Exception {
        ResultActions r = post("/api/auth/register", null, "{\"fullName\":\"Test User\",\"email\":\""
                + uniqueEmail() + "\",\"password\":\"password123\"}").andExpect(status().isCreated());
        return new Account(((Number) read(r, "$.user.id")).longValue(), read(r, "$.token"));
    }

    /** Registers a customer, promotes it through the admin API, and logs in again to get a MANAGER token. */
    protected Account newManager() throws Exception {
        String email = uniqueEmail();
        ResultActions reg = post("/api/auth/register", null, "{\"fullName\":\"Manager\",\"email\":\""
                + email + "\",\"password\":\"password123\"}").andExpect(status().isCreated());
        long id = ((Number) read(reg, "$.user.id")).longValue();
        patch("/api/admin/users/" + id + "/role", adminToken(), "{\"role\":\"MANAGER\"}").andExpect(status().isOk());
        String token = read(post("/api/auth/login", null,
                "{\"email\":\"" + email + "\",\"password\":\"password123\"}").andExpect(status().isOk()), "$.token");
        return new Account(id, token);
    }

    protected long newHotel(long managerId) throws Exception {
        return readId(post("/api/admin/hotels", adminToken(), "{\"managerId\":" + managerId
                + ",\"name\":\"Hotel\",\"address\":\"1 Main St\",\"city\":\"Hanoi\"}").andExpect(status().isCreated()));
    }

    protected long newRoomType(String managerToken, long hotelId, String price, int capacity) throws Exception {
        return readId(post("/api/manager/hotels/" + hotelId + "/room-types", managerToken,
                "{\"name\":\"Type-" + UUID.randomUUID().toString().substring(0, 6) + "\",\"pricePerNight\":" + price
                        + ",\"capacity\":" + capacity + "}").andExpect(status().isCreated()));
    }

    protected long newRoom(String managerToken, long hotelId, long typeId) throws Exception {
        return readId(post("/api/manager/hotels/" + hotelId + "/rooms", managerToken,
                "{\"roomNumber\":\"" + UUID.randomUUID().toString().substring(0, 6) + "\",\"roomTypeId\":" + typeId
                        + "}").andExpect(status().isCreated()));
    }

    protected String bookingJson(long roomId, java.time.LocalDate in, java.time.LocalDate out, int guests) {
        return "{\"roomId\":" + roomId + ",\"checkIn\":\"" + in + "\",\"checkOut\":\"" + out + "\",\"guests\":" + guests + "}";
    }
}
