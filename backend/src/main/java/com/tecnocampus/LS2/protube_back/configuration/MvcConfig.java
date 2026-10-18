package com.tecnocampus.LS2.protube_back.configuration;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.web.servlet.config.annotation.*;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
@EnableWebMvc
public class MvcConfig implements WebMvcConfigurer {

    private static final Logger LOG =
            LoggerFactory.getLogger(MvcConfig.class);

    private final Environment env;

    public MvcConfig(Environment env) {
        this.env = env;
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String storeDirectory = env.getProperty("pro_tube.store.dir");
        if (storeDirectory != null && !storeDirectory.isBlank()) {
            Path resolvedStoreDirectory = resolveStoreDirectory(storeDirectory);
            registry
               .addResourceHandler("/media/**")
               .addResourceLocations(resolvedStoreDirectory.toUri().toString());
        } else {
            LOG.warn("Skipping /media/** resource handler because ENV_PROTUBE_STORE_DIR is not configured");
        }

        registry.addResourceHandler("/**")
           .addResourceLocations("classpath:/static/", "classpath:/public/",
                        "classpath:/resources/",
                        "classpath:/META-INF/resources/")
           .setCachePeriod(3600);
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOriginPatterns("*")
                .allowedMethods("GET", "POST", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*");
        registry.addMapping("/auth/**")
                .allowedOriginPatterns("*")
                .allowedMethods("GET", "POST", "OPTIONS")
                .allowedHeaders("*");
    }

    private Path resolveStoreDirectory(String configuredPath) {
        Path path = Paths.get(configuredPath);
        if (path.toFile().isDirectory()) {
            return path;
        }
        Path parentPath = Paths.get("..").resolve(configuredPath).normalize();
        if (parentPath.toFile().isDirectory()) {
            return parentPath;
        }
        return path;
    }
}
