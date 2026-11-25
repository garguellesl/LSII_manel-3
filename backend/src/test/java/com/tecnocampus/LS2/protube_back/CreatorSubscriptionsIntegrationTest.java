package com.tecnocampus.LS2.protube_back;

import com.tecnocampus.LS2.protube_back.model.CreateVideoRequest;
import com.tecnocampus.LS2.protube_back.model.RegisterRequest;
import com.tecnocampus.LS2.protube_back.model.UpdateProfileRequest;
import com.tecnocampus.LS2.protube_back.services.CreatorSubscriptionService;
import com.tecnocampus.LS2.protube_back.services.UserService;
import com.tecnocampus.LS2.protube_back.services.VideoService;
import com.tecnocampus.LS2.protube_back.support.PostgreSqlIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.forwardedUrl;

@AutoConfigureMockMvc
class CreatorSubscriptionsIntegrationTest extends PostgreSqlIntegrationTest {
    private static final String OWN = "/api/users/me/subscriptions";

    @Autowired private MockMvc mvc;
    @Autowired private UserService users;
    @Autowired private VideoService videos;
    @Autowired private CreatorSubscriptionService subscriptions;
    @Autowired private JdbcTemplate jdbc;

    @Test
    @Transactional
    void authenticatesMutationsAndScopesListAndStateToTheCurrentPrincipal() throws Exception {
        Long viewer = account();
        Long creator = account();
        Long other = account();
        String path = "/api/users/" + creator + "/subscription";

        mvc.perform(get(OWN)).andExpect(status().isUnauthorized());
        mvc.perform(get(path)).andExpect(status().isUnauthorized());
        mvc.perform(put(path).with(csrf())).andExpect(status().isUnauthorized());
        mvc.perform(put(path).with(user(viewer.toString()))).andExpect(status().isForbidden());
        mvc.perform(put("/api/users/" + viewer + "/subscription").with(user(viewer.toString())).with(csrf()))
                .andExpect(status().isBadRequest());
        mvc.perform(put("/api/users/9223372036854775807/subscription").with(user(viewer.toString())).with(csrf()))
                .andExpect(status().isNotFound());
        for (int attempt = 0; attempt < 2; attempt++) {
            mvc.perform(put(path).with(user(viewer.toString())).with(csrf()).param("subscriberId", other.toString()))
                    .andExpect(status().isNoContent());
        }
        mvc.perform(get(path).with(user(viewer.toString())))
                .andExpect(status().isOk()).andExpect(header().string("Cache-Control", "no-store"))
                .andExpect(jsonPath("$.subscribed").value(true));
        mvc.perform(get(OWN).with(user(viewer.toString())).param("size", "1"))
                .andExpect(status().isOk()).andExpect(header().string("Cache-Control", "no-store"))
                .andExpect(jsonPath("$.totalElements").value(1)).andExpect(jsonPath("$.content[0].id").value(creator))
                .andExpect(jsonPath("$.content[0].email").doesNotExist());
        mvc.perform(get(OWN).with(user(other.toString())).param("userId", viewer.toString()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(0));
        mvc.perform(get("/api/users/" + viewer + "/subscriptions").with(user(other.toString())))
                .andExpect(status().isNotFound());
        mvc.perform(delete(path).with(user(other.toString())).with(csrf()).param("subscriberId", viewer.toString()))
                .andExpect(status().isNoContent());
        mvc.perform(get(path).with(user(viewer.toString()))).andExpect(jsonPath("$.subscribed").value(true));
        for (int attempt = 0; attempt < 2; attempt++) {
            mvc.perform(delete(path).with(user(viewer.toString())).with(csrf())).andExpect(status().isNoContent());
        }
        mvc.perform(get(path).with(user(viewer.toString()))).andExpect(jsonPath("$.subscribed").value(false));
        mvc.perform(get(OWN).with(user(viewer.toString())).param("size", "101")).andExpect(status().isBadRequest());
    }

    @Test
    @Transactional
    void publicCreatorShowsOnlyPublicFieldsAndItsOwnPaginatedVideos() throws Exception {
        Long creator = account();
        users.updateProfile(creator, new UpdateProfileRequest("Public name", "Bio", false), null);
        Long older = video(creator, "Older video");
        Long newer = video(creator, "Newer video");
        video(account(), "Other creator's video");
        jdbc.update("update videos set created_at = timestamp '2020-01-01' where id = ?", older);
        String creatorPath = "/api/creators/" + creator;

        mvc.perform(get(creatorPath)).andExpect(status().isOk()).andExpect(jsonPath("$.id").value(creator))
                .andExpect(jsonPath("$.displayName").value("Public name")).andExpect(jsonPath("$.description").value("Bio"))
                .andExpect(jsonPath("$.email").doesNotExist()).andExpect(jsonPath("$.subscriptions").doesNotExist());
        mvc.perform(get(creatorPath + "/videos").param("size", "1"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.content[0].id").value(newer)).andExpect(jsonPath("$.hasNext").value(true));
        mvc.perform(get(creatorPath + "/videos").param("size", "1").param("page", "1"))
                .andExpect(jsonPath("$.content[0].id").value(older)).andExpect(jsonPath("$.hasNext").value(false));
        mvc.perform(get("/api/creators/9223372036854775807/videos")).andExpect(status().isNotFound());
        mvc.perform(get("/creators/" + creator)).andExpect(forwardedUrl("/index.html"));
        mvc.perform(get("/subscriptions")).andExpect(forwardedUrl("/index.html"));
    }

    @Test
    @Transactional
    void publicCreatorListContainsOnlyAccountsWithVideosAndPublicFields() throws Exception {
        Long withVideo = account();
        users.updateProfile(withVideo, new UpdateProfileRequest("Listed creator", "Bio", false), null);
        video(withVideo, "A video");
        Long withoutVideo = account();

        mvc.perform(get("/api/creators").param("size", "100"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[?(@.id == " + withVideo + ")].displayName").value("Listed creator"))
                .andExpect(jsonPath("$.content[?(@.id == " + withoutVideo + ")]").isEmpty())
                .andExpect(jsonPath("$.content[0].email").doesNotExist());
    }

    @Test
    void simultaneousSubscribesLeaveOnePairAndAnOrderedPrivatePage() throws Exception {
        Long viewer = account();
        Long first = account();
        Long second = account();
        try {
            subscriptions.subscribe(viewer, first);
            jdbc.update("update creator_subscriptions set created_at = timestamp '2020-01-01' where subscriber_id = ?", viewer);

            try (var pool = Executors.newFixedThreadPool(2)) {
                var start = new CountDownLatch(1);
                var one = pool.submit(() -> { start.await(); subscriptions.subscribe(viewer, second); return null; });
                var two = pool.submit(() -> { start.await(); subscriptions.subscribe(viewer, second); return null; });
                start.countDown();
                one.get(10, TimeUnit.SECONDS);
                two.get(10, TimeUnit.SECONDS);
            }
            assertEquals(1L, jdbc.queryForObject("select count(*) from creator_subscriptions where subscriber_id=? and creator_id=?",
                    Long.class, viewer, second));
            mvc.perform(get(OWN).with(user(viewer.toString())).param("size", "1"))
                    .andExpect(jsonPath("$.totalElements").value(2)).andExpect(jsonPath("$.content[0].id").value(second));
            mvc.perform(get(OWN).with(user(viewer.toString())).param("size", "1").param("page", "1"))
                    .andExpect(jsonPath("$.content[0].id").value(first));
        } finally {
            jdbc.update("delete from app_users where id in (?, ?, ?)", viewer, first, second);
        }
    }

    private Long account() {
        String name = "subs-" + UUID.randomUUID();
        return users.register(new RegisterRequest(name + "@example.test", name, "Test", "User", "password123")).id();
    }

    private Long video(Long owner, String title) {
        return videos.createVideo(new CreateVideoRequest(title, "Description", UUID.randomUUID() + ".mp4",
                null, 1, owner, List.of())).id();
    }
}
