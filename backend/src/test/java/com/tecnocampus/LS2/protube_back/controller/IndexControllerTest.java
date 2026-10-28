package com.tecnocampus.LS2.protube_back.controller;

import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.forwardedUrl;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(IndexController.class)
class IndexControllerTest {
    IndexController indexController = new IndexController();
    @Autowired
    MockMvc mockMvc;

    @Test
    void homeServesReactApplication() throws Exception {
        mockMvc.perform(get("/"))
                .andExpect(status().isOk())
                .andExpect(forwardedUrl("/index.html"));
    }

    @Test
    void directVideoNavigationServesReactApplication() throws Exception {
        mockMvc.perform(get("/videos/7"))
                .andExpect(status().isOk())
                .andExpect(forwardedUrl("/index.html"));
    }

    @Test
    void unknownApiAndMediaPathsAreNotForwardedToReact() throws Exception {
        mockMvc.perform(get("/api/unknown")).andExpect(status().isNotFound());
        mockMvc.perform(get("/media/missing.mp4")).andExpect(status().isNotFound());
    }

    @Test
    void logout() {
        assertEquals("logout", indexController.logout().getViewName());
    }
}
