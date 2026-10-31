package com.tecnocampus.LS2.protube_back.configuration;

import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;
import java.nio.charset.StandardCharsets;
import java.util.Locale;

@Component
public class DemoAdminSettings {
    private final String email;
    private final String accountName;
    private final String password;

    public DemoAdminSettings(Environment environment) {
        email = environment.getProperty("pro_tube.demo-admin.email", "admin@protube.local").trim().toLowerCase(Locale.ROOT);
        accountName = environment.getProperty("pro_tube.demo-admin.account-name", "admin").trim().toLowerCase(Locale.ROOT);
        password = environment.getProperty("pro_tube.demo-admin.password", "");
    }

    public String email() { return email; }
    public String accountName() { return accountName; }
    public boolean hasPassword() { return !password.isBlank(); }

    public String password() {
        if (password.length() < 8 || password.getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new IllegalStateException("Set ENV_PROTUBE_DEMO_ADMIN_PASSWORD to 8 characters or more, at most 72 UTF-8 bytes, before creating the demo account");
        }
        return password;
    }
}
