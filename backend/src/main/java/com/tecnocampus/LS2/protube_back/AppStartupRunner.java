package com.tecnocampus.LS2.protube_back;

import com.tecnocampus.LS2.protube_back.services.VideoImportService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.nio.file.Path;
import java.nio.file.Paths;

@Component
public class AppStartupRunner implements ApplicationRunner {
    private static final Logger LOG =
            LoggerFactory.getLogger(AppStartupRunner.class);

    private final VideoImportService videoImportService;
    private final Path rootPath;
    private final boolean loadInitialData;

    public AppStartupRunner(Environment env, VideoImportService videoImportService) {
        this.videoImportService = videoImportService;
        final var rootDir = env.getProperty("pro_tube.store.dir");
        Path store = resolveStoreDirectory(rootDir);
        String importDir = env.getProperty("pro_tube.import.dir");
        if (importDir == null || importDir.isBlank()) {
            this.rootPath = store;
        } else {
            Path imports = Paths.get(importDir).toAbsolutePath().normalize();
            if (store == null || !imports.startsWith(store.toAbsolutePath().normalize())) {
                throw new IllegalArgumentException("Import directory must be inside the configured media store");
            }
            try {
                if (!imports.toRealPath().startsWith(store.toRealPath())) {
                    throw new IllegalArgumentException("Import directory must resolve inside the media store");
                }
                this.rootPath = imports;
            } catch (java.io.IOException exception) {
                throw new IllegalArgumentException("Configured import directory is unavailable", exception);
            }
        }
        this.loadInitialData = env.getProperty("pro_tube.load_initial_data", Boolean.class, false);
    }

    @Override
    public void run(ApplicationArguments args) {
        if (loadInitialData) {
            if (rootPath == null) {
                LOG.warn("Skipping initial video metadata import because ENV_PROTUBE_STORE_DIR is not configured");
                return;
            }
            LOG.info("Loading initial video metadata from {}", rootPath);
            videoImportService.importFromStore(rootPath);
        }
    }

    private Path resolveStoreDirectory(String configuredPath) {
        if (configuredPath == null || configuredPath.isBlank()) {
            return null;
        }
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
