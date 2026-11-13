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
            java.util.List<String> locations = new java.util.ArrayList<>();
            locations.add(resolvedStoreDirectory.toUri().toString());
            String configuredImports = env.getProperty("pro_tube.import.dir");
            if (configuredImports != null && !configuredImports.isBlank()) {
                Path imports = Paths.get(configuredImports).toAbsolutePath().normalize();
                if (!imports.startsWith(resolvedStoreDirectory.toAbsolutePath().normalize())) {
                    throw new IllegalArgumentException("Import directory must be inside the configured media store");
                }
                String importLocation = imports.toUri().toString();
                locations.add(importLocation.endsWith("/") ? importLocation : importLocation + "/");
            }
            registry
               .addResourceHandler("/media/**")
               .addResourceLocations(locations.toArray(String[]::new))
               .resourceChain(false)
               .addResolver(new org.springframework.web.servlet.resource.PathResourceResolver() {
                   @Override
                   protected org.springframework.core.io.Resource getResource(String resourcePath,
                           org.springframework.core.io.Resource location) throws java.io.IOException {
                       if (java.util.Arrays.stream(resourcePath.replace('\\', '/').split("/"))
                               .anyMatch(part -> part.startsWith("."))) return null;
                       var resource = super.getResource(resourcePath, location);
                       if (resource == null) return null;
                       Path store = resolvedStoreDirectory.toRealPath();
                       Path file = resource.getFile().toPath().toRealPath();
                       return file.startsWith(store) ? resource : null;
                   }
               });
        } else {
            LOG.warn("Skipping /media/** resource handler because ENV_PROTUBE_STORE_DIR is not configured");
        }

        registry.addResourceHandler("/**")
           .addResourceLocations("classpath:/static/", "classpath:/public/",
                        "classpath:/resources/",
                        "classpath:/META-INF/resources/")
           .setCachePeriod(3600);
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
