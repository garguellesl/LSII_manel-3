package com.tecnocampus.LS2.protube_back.services;

import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.LinkOption;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
public class MediaStorageService {
    private final Environment environment;

    public MediaStorageService(Environment environment) {
        this.environment = environment;
    }

    public UUID begin() throws IOException {
        Path uploads = uploads();
        Files.createDirectories(uploads);
        Path pending = safe(uploads.resolve(".pending"));
        Files.createDirectories(pending);
        UUID id = UUID.randomUUID();
        // Create durable recovery ownership before any staged or public media.
        Files.createFile(marker(id));
        Files.createDirectory(stage(id));
        return id;
    }

    public Path write(UUID id, MultipartFile file, boolean thumbnail) throws IOException {
        Path target = safe(stage(id).resolve(thumbnail ? "thumbnail" : "video.mp4"));
        long limit = thumbnail ? MediaFileValidator.THUMBNAIL_LIMIT : MediaFileValidator.VIDEO_LIMIT;
        try (var input = file.getInputStream(); var output = Files.newOutputStream(target)) {
            byte[] buffer = new byte[64 * 1024];
            long total = 0;
            int count;
            while ((count = input.read(buffer)) != -1) {
                total += count;
                if (total > limit) throw new UploadException(413, thumbnail ? "Thumbnail exceeds 5 MiB" : "Video exceeds 100 MiB");
                output.write(buffer, 0, count);
            }
            if (total == 0 || total != file.getSize()) throw new UploadException(400, "Incomplete uploaded file");
        }
        return target;
    }

    public void nameThumbnail(UUID id, String extension) throws IOException {
        if (!List.of("jpg", "png").contains(extension)) throw new IllegalArgumentException("Invalid image extension");
        Files.move(safe(stage(id).resolve("thumbnail")), safe(stage(id).resolve("thumbnail." + extension)));
    }

    public void publish(UUID id) throws IOException {
        // Same filesystem: either the entire directory moves, or publication fails.
        Files.move(stage(id), destination(id), StandardCopyOption.ATOMIC_MOVE);
    }

    public String mediaPath(UUID id) {
        return "uploads/" + id + "/video.mp4";
    }

    public String thumbnailPath(UUID id, String extension) {
        return extension == null ? null : "uploads/" + id + "/thumbnail." + extension;
    }

    public void finish(UUID id) throws IOException {
        removeDirectory(stage(id));
        Files.deleteIfExists(marker(id));
    }

    public void discard(UUID id) throws IOException {
        removeDirectory(destination(id));
        finish(id);
    }

    public List<UUID> pendingIds() throws IOException {
        String configured = environment.getProperty("pro_tube.store.dir");
        if (configured == null || configured.isBlank() || !Files.isDirectory(Path.of(configured))) return List.of();
        Path pending = safe(uploads().resolve(".pending"));
        if (!Files.isDirectory(pending, LinkOption.NOFOLLOW_LINKS)) return List.of();
        try (var paths = Files.list(pending)) {
            return paths.map(path -> path.getFileName().toString()).filter(name -> name.endsWith(".manifest"))
                    .map(name -> name.substring(0, name.length() - ".manifest".length()))
                    .filter(name -> name.matches("[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"))
                    .map(UUID::fromString).toList();
        }
    }

    public Path existingFile(String relative) throws IOException {
        if (relative == null || relative.isBlank()) throw new UploadException(400, "Media path is required");
        Path path = Path.of(relative.replace('\\', '/')).normalize();
        if (path.isAbsolute() || path.startsWith("..") || path.startsWith("uploads") || path.toString().equals(".")) {
            throw new UploadException(400, "Only existing unmanaged store files can be registered");
        }
        Path resolved = safe(root().resolve(path));
        String imports = environment.getProperty("pro_tube.import.dir");
        if (!Files.isRegularFile(resolved, LinkOption.NOFOLLOW_LINKS) && imports != null && !imports.isBlank()) {
            resolved = safe(Path.of(imports).resolve(path));
        }
        if (!Files.isRegularFile(resolved, LinkOption.NOFOLLOW_LINKS)) throw new UploadException(400, "Media file does not exist");
        return resolved;
    }

    private Path root() throws IOException {
        String configured = environment.getProperty("pro_tube.store.dir");
        if (configured == null || configured.isBlank()) throw new IOException("Media store is not configured");
        return Path.of(configured).toRealPath();
    }

    private Path uploads() throws IOException {
        return safe(root().resolve("uploads"));
    }

    private Path marker(UUID id) throws IOException {
        return safe(uploads().resolve(".pending").resolve(id + ".manifest"));
    }

    private Path stage(UUID id) throws IOException {
        return safe(uploads().resolve(".pending").resolve(id.toString()));
    }

    private Path destination(UUID id) throws IOException {
        return safe(uploads().resolve(id.toString()));
    }

    private Path safe(Path candidate) throws IOException {
        Path store = root();
        Path normalized = candidate.toAbsolutePath().normalize();
        if (!normalized.startsWith(store)) throw new IOException("Path outside store");
        Path current = store;
        for (Path part : store.relativize(normalized)) {
            current = current.resolve(part);
            if (Files.isSymbolicLink(current)) throw new IOException("Symbolic media paths are not allowed");
            if (Files.exists(current, LinkOption.NOFOLLOW_LINKS) && !current.toRealPath().startsWith(store)) {
                throw new IOException("Media path resolves outside store");
            }
        }
        return normalized;
    }

    private void removeDirectory(Path directory) throws IOException {
        Path verified = safe(directory);
        if (!Files.exists(verified, LinkOption.NOFOLLOW_LINKS)) return;
        try (var paths = Files.walk(verified)) {
            // Only the verified UUID directory belonging to a durable manifest is removed.
            for (Path path : paths.sorted(Comparator.reverseOrder()).toList()) Files.delete(safe(path));
        }
    }
}
