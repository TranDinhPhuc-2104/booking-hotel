package com.booking.backend;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.ResultActions;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class HotelImageTest extends ApiTestSupport {

    private ResultActions upload(long hotelId, String token, String contentType) throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "photo", contentType, new byte[]{1, 2, 3});
        return mvc.perform(multipart("/api/manager/hotels/" + hotelId + "/image").file(file)
                .header("Authorization", "Bearer " + token));
    }

    @Test
    void managerUploadsPhotoAndAnyoneCanFetchIt() throws Exception {
        Account manager = newManager();
        long hotel = newHotel(manager.id());
        String url = read(upload(hotel, manager.token(), "image/png").andExpect(status().isOk()), "$.imageUrl");

        String path = url.substring(url.indexOf("/uploads/hotels/"));
        get(path, null).andExpect(status().isOk()).andExpect(content().bytes(new byte[]{1, 2, 3}));
    }

    @Test
    void rejectsNonImagesAndOtherManagersHotels() throws Exception {
        Account manager = newManager();
        long hotel = newHotel(manager.id());
        upload(hotel, manager.token(), "text/html").andExpect(status().isBadRequest());
        upload(hotel, newManager().token(), "image/png").andExpect(status().isForbidden());
    }
}
