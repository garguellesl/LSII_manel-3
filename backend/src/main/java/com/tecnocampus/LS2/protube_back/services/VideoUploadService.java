package com.tecnocampus.LS2.protube_back.services;

import com.tecnocampus.LS2.protube_back.entities.Tag;
import com.tecnocampus.LS2.protube_back.entities.Video;
import com.tecnocampus.LS2.protube_back.model.CreateVideoRequest;
import com.tecnocampus.LS2.protube_back.model.UploadVideoRequest;
import com.tecnocampus.LS2.protube_back.model.VideoDetail;
import com.tecnocampus.LS2.protube_back.repositories.TagRepository;
import com.tecnocampus.LS2.protube_back.repositories.UserAccountRepository;
import com.tecnocampus.LS2.protube_back.repositories.VideoRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class VideoUploadService implements ApplicationRunner {
    public static final List<String> CATEGORIES = List.of("Music", "Gaming", "Education", "Technology", "Entertainment", "Sports", "Other");
    private static final Logger LOG = LoggerFactory.getLogger(VideoUploadService.class);
    private final MediaStorageService storage;
    private final MediaFileValidator validator;
    private final VideoRepository videos;
    private final UserAccountRepository users;
    private final TagRepository tags;
    private final VideoService videoService;
    private final TransactionTemplate transaction;

    public VideoUploadService(MediaStorageService storage, MediaFileValidator validator, VideoRepository videos,
                              UserAccountRepository users, TagRepository tags, VideoService videoService,
                              PlatformTransactionManager transactions) {
        this.storage = storage;
        this.validator = validator;
        this.videos = videos;
        this.users = users;
        this.tags = tags;
        this.videoService = videoService;
        this.transaction = new TransactionTemplate(transactions);
    }

    public VideoDetail upload(UploadVideoRequest metadata, MultipartFile video, MultipartFile thumbnail, Long actorId) {
        if (metadata.title() == null || metadata.title().isBlank() || metadata.title().trim().length() > 255) {
            throw new UploadException(400, "Title is required (maximum 255 characters)");
        }
        if (!CATEGORIES.contains(metadata.category())) throw new UploadException(400, "Select a valid category");
        TagNormalizer.Result normalized = TagNormalizer.normalizeAndValidate(metadata.tags() == null ? List.of() : metadata.tags());
        if (!normalized.isValid()) throw new InvalidTagsException(normalized.fieldErrors());
        validator.validateUpload(video, false);
        if (thumbnail != null) validator.validateUpload(thumbnail, true);
        UUID id = null;
        try {
            // Reject unavailable owners and unknown tags before transferring files to the store.
            if (!users.existsById(actorId)) throw new ResourceNotFoundException("User not found");
            for (String name : normalized.normalizedTags()) tags.findByNameIgnoreCase(name)
                    .orElseThrow(() -> new InvalidTagsException(Map.of("tags", "Select existing tags")));
            id = storage.begin();
            double duration = validator.videoDuration(storage.write(id, video, false));
            String extension = null;
            if (thumbnail != null) {
                extension = validator.imageExtension(storage.write(id, thumbnail, true));
                String expectedMime = extension.equals("png") ? "image/png" : "image/jpeg";
                if (!expectedMime.equals(thumbnail.getContentType())) throw new UploadException(415, "Thumbnail content does not match its format");
                storage.nameThumbnail(id, extension);
            }
            storage.publish(id);
            String mediaPath = storage.mediaPath(id);
            String thumbnailPath = storage.thumbnailPath(id, extension);
            VideoDetail result = transaction.execute(status -> {
                var owner = users.findById(actorId).orElseThrow(() -> new ResourceNotFoundException("User not found"));
                var selectedTags = new LinkedHashSet<Tag>();
                for (String name : normalized.normalizedTags()) selectedTags.add(tags.findByNameIgnoreCase(name)
                        .orElseThrow(() -> new InvalidTagsException(Map.of("tags", "Select existing tags"))));
                Video entity = new Video(metadata.title().trim(), metadata.description() == null ? "" : metadata.description().trim(),
                        mediaPath, thumbnailPath, duration, owner, selectedTags);
                entity.markUploaded(metadata.category());
                Video saved = videos.saveAndFlush(entity);
                return videoService.getVideo(saved.getId()).orElseThrow(() -> new ResourceNotFoundException("Video not found"));
            });
            try { storage.finish(id); } catch (IOException exception) { LOG.warn("Upload committed; recovery will finish its manifest", exception); }
            return result;
        } catch (IOException | RuntimeException exception) {
            if (id != null) compensate(id);
            if (exception instanceof UploadException upload) throw upload;
            if (exception instanceof ResourceNotFoundException missing) throw missing;
            if (exception instanceof InvalidTagsException invalid) throw invalid;
            throw new UploadException("Could not save the video. Please try again.", exception);
        }
    }

    public VideoDetail registerExisting(CreateVideoRequest request, Long actorId) {
        try {
            validator.videoDuration(storage.existingFile(request.mediaPath()));
            if (request.thumbnailPath() != null && !request.thumbnailPath().isBlank()) storage.existingFile(request.thumbnailPath());
            return videoService.createVideo(new CreateVideoRequest(request.title(), request.description(), request.mediaPath(),
                    request.thumbnailPath(), request.durationSeconds(), actorId, request.tags()));
        } catch (IOException exception) {
            throw new UploadException("Could not access the media store", exception);
        }
    }

    @Override
    public void run(ApplicationArguments args) throws IOException {
        for (UUID id : storage.pendingIds()) recover(id);
    }

    private void recover(UUID id) throws IOException {
        if (videos.existsByMediaPath(storage.mediaPath(id))) storage.finish(id);
        else storage.discard(id);
    }

    private void compensate(UUID id) {
        try {
            // A lost commit acknowledgement is ambiguous: retain files if the row exists.
            recover(id);
        } catch (IOException | DataAccessException exception) {
            LOG.warn("Upload recovery deferred; manifest retained", exception);
        }
    }
}
