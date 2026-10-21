package com.tecnocampus.LS2.protube_back;

import com.tecnocampus.LS2.protube_back.services.VideoService;
import com.tecnocampus.LS2.protube_back.support.PostgreSqlIntegrationTest;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
class ProtubeBackApplicationTests extends PostgreSqlIntegrationTest {

    @Autowired
    VideoService videoService;

    @Test
    void shouldStartApp() {
        Assertions.assertNotNull(videoService);
    }

}
