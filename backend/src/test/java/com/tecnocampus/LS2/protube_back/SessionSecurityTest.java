package com.tecnocampus.LS2.protube_back;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tecnocampus.LS2.protube_back.model.CreateVideoRequest;
import com.tecnocampus.LS2.protube_back.model.RegisterRequest;
import com.tecnocampus.LS2.protube_back.model.UserResponse;
import com.tecnocampus.LS2.protube_back.services.UserService;
import com.tecnocampus.LS2.protube_back.services.VideoService;
import com.tecnocampus.LS2.protube_back.support.PostgreSqlIntegrationTest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@AutoConfigureMockMvc
@Transactional
class SessionSecurityTest extends PostgreSqlIntegrationTest {
    private final MockMvc mvc;
    private final ObjectMapper mapper;
    private final UserService users;
    private final VideoService videos;

    @Autowired
    SessionSecurityTest(MockMvc mvc, ObjectMapper mapper, UserService users, VideoService videos) {
        this.mvc = mvc;
        this.mapper = mapper;
        this.users = users;
        this.videos = videos;
    }

    record Token(MockHttpSession session, String header, String value) {}

    private Token csrf(MockHttpSession session) throws Exception {
        var request = get("/api/auth/csrf");
        if (session != null) request.session(session);
        MvcResult result = mvc.perform(request).andExpect(status().isOk()).andReturn();
        JsonNode json = mapper.readTree(result.getResponse().getContentAsString());
        return new Token((MockHttpSession) result.getRequest().getSession(false),
                json.get("headerName").asText(), json.get("token").asText());
    }

    private UserResponse account() {
        String name = "user-" + UUID.randomUUID();
        return users.register(new RegisterRequest(name + "@example.test", name, "First", "Last", "password123"));
    }

    private MockHttpSession login(UserResponse user) throws Exception {
        Token token = csrf(null);
        mvc.perform(post("/api/auth/login").session(token.session()).header(token.header(), token.value())
                        .contentType("application/json").content(mapper.writeValueAsString(Map.of(
                                "email", user.email(), "password", "password123"))))
                .andExpect(status().isOk());
        return token.session();
    }

    private Long video(UserResponse owner) {
        return videos.createVideo(new CreateVideoRequest("Title", "Description", UUID.randomUUID() + ".mp4",
                null, 1, owner.id(), List.of())).id();
    }

    @Test
    void registrationAuthenticatesChangesSessionIdAndRotatesCsrf() throws Exception {
        Token before = csrf(null);
        String oldId = before.session().getId();
        mvc.perform(post("/api/auth/register").session(before.session()).header(before.header(), before.value())
                        .contentType("application/json").content(mapper.writeValueAsString(Map.of(
                                "email", "  New@Example.test  ", "accountName", " NewAccount ",
                                "firstName", "New", "lastName", "User", "password", "password123"))))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.accountName").value("newaccount"))
                .andExpect(jsonPath("$.password").doesNotExist()).andExpect(jsonPath("$.passwordHash").doesNotExist());
        assertNotEquals(oldId, before.session().getId());
        mvc.perform(get("/api/users/me").session(before.session()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.email").value("new@example.test"))
                .andExpect(header().string("Cache-Control", org.hamcrest.Matchers.containsString("no-store")));
        mvc.perform(post("/api/auth/logout").session(before.session()).header(before.header(), before.value()))
                .andExpect(status().isForbidden()).andExpect(jsonPath("$.code").value("CSRF_INVALID"));
        Token after = csrf(before.session());
        mvc.perform(post("/api/auth/logout").session(after.session()).header(after.header(), after.value()))
                .andExpect(status().isNoContent()).andExpect(cookie().maxAge("JSESSIONID", 0));
        assertTrue(after.session().isInvalid());
        mvc.perform(get("/api/users/me")).andExpect(status().isUnauthorized());
    }

    @Test
    void loginRestoresIdentityAndProfileCannotSelectAnotherUser() throws Exception {
        UserResponse first = account();
        UserResponse other = account();
        MockHttpSession session = login(first);
        mvc.perform(get("/api/users/me").session(session).param("userId", other.id().toString()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.id").value(first.id()))
                .andExpect(jsonPath("$.passwordHash").doesNotExist());
        mvc.perform(get("/api/users/me").session(session)).andExpect(status().isOk());
        session.invalidate();
        mvc.perform(get("/api/users/me")).andExpect(status().isUnauthorized());
    }

    @Test
    void invalidCredentialsDoNotAuthenticate() throws Exception {
        UserResponse user = account();
        Token token = csrf(null);
        mvc.perform(post("/api/auth/login").session(token.session()).header(token.header(), token.value())
                        .contentType("application/json").content(mapper.writeValueAsString(Map.of(
                                "email", user.email(), "password", "wrong-password"))))
                .andExpect(status().isUnauthorized()).andExpect(jsonPath("$.error").value("Invalid email or password"));
        mvc.perform(get("/api/users/me").session(token.session())).andExpect(status().isUnauthorized());
    }

    @ParameterizedTest
    @ValueSource(strings = {"short", "ééééééééééééééééééééééééééééééééééééé", ""})
    void rejectsInvalidPasswordsWithoutCreatingAccount(String password) throws Exception {
        Token token = csrf(null);
        mvc.perform(post("/api/auth/register").session(token.session()).header(token.header(), token.value())
                        .contentType("application/json").content(mapper.writeValueAsString(Map.of(
                                "email", "invalid@example.test", "accountName", "invalid", "firstName", "First",
                                "lastName", "Last", "password", password))))
                .andExpect(status().isBadRequest());
        mvc.perform(get("/api/users/me").session(token.session())).andExpect(status().isUnauthorized());
    }

    @Test
    void rejectsDuplicateEmailAndAccountNameIgnoringCase() throws Exception {
        UserResponse user = account();
        for (Map<String, String> payload : List.of(
                Map.of("email", " " + user.email().toUpperCase() + " ", "accountName", "different"),
                Map.of("email", "different@example.test", "accountName", user.accountName().toUpperCase()))) {
            Token token = csrf(null);
            var request = new java.util.HashMap<>(payload);
            request.putAll(Map.of("firstName", "First", "lastName", "Last", "password", "password123"));
            mvc.perform(post("/api/auth/register").session(token.session()).header(token.header(), token.value())
                            .contentType("application/json").content(mapper.writeValueAsString(request)))
                    .andExpect(status().isConflict());
        }
    }

    @Test
    void csrfAndAuthenticationFailuresAreDistinctAndCorsIsRestricted() throws Exception {
        mvc.perform(post("/api/auth/login").contentType("application/json").content("{}"))
                .andExpect(status().isForbidden()).andExpect(jsonPath("$.code").value("CSRF_INVALID"));
        Token guest = csrf(null);
        mvc.perform(post("/api/videos/1/likes").session(guest.session()).header(guest.header(), guest.value()))
                .andExpect(status().isUnauthorized()).andExpect(jsonPath("$.code").value("UNAUTHENTICATED"));
        mvc.perform(get("/api/users/me")).andExpect(status().isUnauthorized());
        mvc.perform(options("/api/users/me").header("Origin", "https://untrusted.example")
                        .header("Access-Control-Request-Method", "GET"))
                .andExpect(status().isForbidden());
        mvc.perform(options("/api/users/me").header("Origin", "http://localhost:5174")
                        .header("Access-Control-Request-Method", "GET"))
                .andExpect(status().isOk()).andExpect(header().string("Access-Control-Allow-Credentials", "true"));
    }

    @Test
    void keepsCatalogDetailAndCommentsPublic() throws Exception {
        Long id = video(account());
        mvc.perform(get("/api/videos")).andExpect(status().isOk());
        mvc.perform(get("/api/videos/" + id)).andExpect(status().isOk());
        mvc.perform(get("/api/videos/" + id + "/comments")).andExpect(status().isOk());
        mvc.perform(get("/media/missing.mp4")).andExpect(status().isNotFound());
    }

    @Test
    void onlyOwnerCanUpdateVideosAndReadPrivateUserData() throws Exception {
        UserResponse owner = account();
        UserResponse other = account();
        Long id = video(owner);
        Token stranger = csrf(login(other));
        mvc.perform(patch("/api/videos/" + id).session(stranger.session()).header(stranger.header(), stranger.value())
                        .contentType("application/json").content("{\"title\":\"Changed\"}"))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/users/" + owner.id() + "/watch-history").session(stranger.session()))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/users/" + owner.id() + "/analytics").session(stranger.session()))
                .andExpect(status().isForbidden());
        Token allowed = csrf(login(owner));
        mvc.perform(patch("/api/videos/" + id).session(allowed.session()).header(allowed.header(), allowed.value())
                        .contentType("application/json").content("{\"title\":\"Changed\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.title").value("Changed"));
        mvc.perform(get("/api/users/" + owner.id() + "/watch-history").session(allowed.session()))
                .andExpect(status().isOk()).andExpect(content().json("[]"));
    }

    @Test
    void spoofedOwnerIdDoesNotChangeTheAuthenticatedOwner() throws Exception {
        UserResponse actor = account();
        UserResponse other = account();
        Token token = csrf(login(actor));
        mvc.perform(post("/api/videos").session(token.session()).header(token.header(), token.value())
                        .contentType("application/json").content(mapper.writeValueAsString(Map.of(
                                "title", "Owned", "description", "", "mediaPath", "owned.mp4",
                                "ownerUserId", other.id(), "durationSeconds", 0))))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.user").value(actor.accountName()));
    }

    @Test
    void commentsLikesAndWatchHistoryUseServerIdentityAndEnforceOwnership() throws Exception {
        UserResponse actor = account();
        UserResponse other = account();
        Long id = video(actor);
        Token token = csrf(login(actor));
        MvcResult result = mvc.perform(post("/api/videos/" + id + "/comments")
                        .session(token.session()).header(token.header(), token.value()).contentType("application/json")
                        .content(mapper.writeValueAsString(Map.of("text", "Mine", "userId", other.id()))))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.userId").value(actor.id())).andReturn();
        Long comment = mapper.readTree(result.getResponse().getContentAsString()).get("id").asLong();
        Token stranger = csrf(login(other));
        mvc.perform(patch("/api/comments/" + comment).session(stranger.session())
                        .header(stranger.header(), stranger.value()).contentType("application/json").content("{\"text\":\"No\"}"))
                .andExpect(status().isForbidden());
        mvc.perform(delete("/api/comments/" + comment).session(stranger.session()).header(stranger.header(), stranger.value()))
                .andExpect(status().isForbidden());
        mvc.perform(patch("/api/comments/" + comment).session(token.session())
                        .header(token.header(), token.value()).contentType("application/json").content("{\"text\":\"Edited\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.text").value("Edited"));
        mvc.perform(delete("/api/comments/" + comment).session(token.session()).header(token.header(), token.value()))
                .andExpect(status().isNoContent());
        mvc.perform(delete("/api/comments/" + comment).session(token.session()).header(token.header(), token.value()))
                .andExpect(status().isNotFound());
        mvc.perform(post("/api/videos/" + id + "/likes").session(token.session()).header(token.header(), token.value())
                        .contentType("application/json").content("{\"userId\":" + other.id() + "}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.userId").value(actor.id()));
        mvc.perform(delete("/api/videos/" + id + "/likes").param("userId", other.id().toString())
                        .session(token.session()).header(token.header(), token.value()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.liked").value(false));
        mvc.perform(post("/api/videos/" + id + "/watch-history").session(token.session()).header(token.header(), token.value())
                        .contentType("application/json").content(mapper.writeValueAsString(Map.of(
                                "userId", other.id(), "progressSeconds", 5))))
                .andExpect(status().isCreated());
        mvc.perform(get("/api/users/" + actor.id() + "/watch-history").session(token.session()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(1));
        mvc.perform(get("/api/users/" + other.id() + "/watch-history").session(stranger.session()))
                .andExpect(status().isOk()).andExpect(content().json("[]"));
    }
}
