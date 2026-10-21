package com.booking.backend;

import org.junit.jupiter.api.Test;

import static org.hamcrest.Matchers.hasKey;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AuthSecurityTest extends ApiTestSupport {

    @Test
    void unknownHotelReturnsJson404() throws Exception {
        get("/api/hotels/999999", null)
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").value("Hotel not found"));
    }

    @Test
    void registerThenDuplicateEmailConflicts() throws Exception {
        String email = uniqueEmail();
        String body = "{\"fullName\":\"A\",\"email\":\"" + email + "\",\"password\":\"password123\"}";
        post("/api/auth/register", null, body).andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.user.role").value("CUSTOMER"));
        post("/api/auth/register", null, body).andExpect(status().isConflict());
    }

    @Test
    void registerAlwaysCreatesCustomerEvenIfRoleIsSent() throws Exception {
        post("/api/auth/register", null, "{\"fullName\":\"A\",\"email\":\"" + uniqueEmail()
                + "\",\"password\":\"password123\",\"role\":\"ADMIN\"}")
                .andExpect(status().isCreated()).andExpect(jsonPath("$.user.role").value("CUSTOMER"));
    }

    @Test
    void invalidRegistrationListsFieldErrors() throws Exception {
        post("/api/auth/register", null, "{\"fullName\":\"\",\"email\":\"nope\",\"password\":\"short\"}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors", hasKey("email")))
                .andExpect(jsonPath("$.fieldErrors", hasKey("password")));
    }

    @Test
    void loginAndMe() throws Exception {
        String email = uniqueEmail();
        post("/api/auth/register", null, "{\"fullName\":\"A\",\"email\":\"" + email + "\",\"password\":\"password123\"}");
        String token = read(post("/api/auth/login", null,
                "{\"email\":\"" + email.toUpperCase() + "\",\"password\":\"password123\"}").andExpect(status().isOk()), "$.token");
        get("/api/auth/me", token).andExpect(status().isOk()).andExpect(jsonPath("$.email").value(email));
    }

    @Test
    void wrongPasswordIs401() throws Exception {
        Account a = newCustomer();
        post("/api/auth/login", null, "{\"email\":\"nobody@test.local\",\"password\":\"password123\"}")
                .andExpect(status().isUnauthorized());
    }

    @Test
    void meWithoutOrWithBadTokenIs401() throws Exception {
        get("/api/auth/me", null).andExpect(status().isUnauthorized());
        get("/api/auth/me", "not-a-token").andExpect(status().isUnauthorized());
    }

    @Test
    void customerCannotReachAdminOrManagerEndpoints() throws Exception {
        Account customer = newCustomer();
        get("/api/admin/users", customer.token()).andExpect(status().isForbidden());
        get("/api/manager/hotels", customer.token()).andExpect(status().isForbidden());
    }

    @Test
    void adminCanListUsers() throws Exception {
        get("/api/admin/users", adminToken()).andExpect(status().isOk());
    }
}
