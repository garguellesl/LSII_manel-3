package com.tecnocampus.LS2.protube_back.services;

import com.tecnocampus.LS2.protube_back.support.UploadFixtures;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;
import java.nio.ByteBuffer;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class MediaFileValidatorTest {
    @TempDir Path store;
    MediaFileValidator validator = new MediaFileValidator();

    @Test void acceptsInclusiveSizeLimitsAndRejectsTheNextByte() {
        for (boolean image : new boolean[]{false, true}) {
            MultipartFile file = mock(MultipartFile.class);
            when(file.getOriginalFilename()).thenReturn(image ? "thumb.png" : "video.mp4");
            when(file.getContentType()).thenReturn(image ? "image/png" : "video/mp4");
            long limit = image ? MediaFileValidator.THUMBNAIL_LIMIT : MediaFileValidator.VIDEO_LIMIT;
            when(file.getSize()).thenReturn(limit);
            assertDoesNotThrow(() -> validator.validateUpload(file, image));
            when(file.getSize()).thenReturn(limit + 1);
            assertEquals(413, assertThrows(UploadException.class, () -> validator.validateUpload(file, image)).getStatus());
        }
    }

    @Test void rejectsMissingEmptyAndUnsupportedFiles() {
        assertEquals(400, assertThrows(UploadException.class, () -> validator.validateUpload(null, false)).getStatus());
        assertThrows(UploadException.class, () -> validator.validateUpload(new MockMultipartFile("video", new byte[0]), false));
        for (String[] value : new String[][]{{"x.avi", "video/mp4"}, {"x.mp4", "text/plain"}, {"x.png", "image/gif"}}) {
            assertEquals(415, assertThrows(UploadException.class, () -> validator.validateUpload(
                    new MockMultipartFile("file", value[0], value[1], new byte[]{1}), value[0].endsWith("png"))).getStatus());
        }
    }

    @Test void readsMp4DurationAndRejectsCorruptContainersAndAudioOnly() throws Exception {
        Path file = store.resolve("video.mp4");
        Files.write(file, UploadFixtures.mp4());
        assertEquals(2, validator.videoDuration(file));
        byte[] valid = UploadFixtures.mp4();
        for (byte[] invalid : new byte[][]{new byte[0], new byte[]{1,2,3}, Arrays.copyOf(valid, valid.length - 1),
                "not a movie even when named mp4".getBytes(), new byte[12]}) {
            Files.write(file, invalid);
            assertEquals(415, assertThrows(UploadException.class, () -> validator.videoDuration(file)).getStatus());
        }
        byte[] audio = new String(valid, java.nio.charset.StandardCharsets.ISO_8859_1).replace("vide", "soun").getBytes(java.nio.charset.StandardCharsets.ISO_8859_1);
        Files.write(file, audio);
        assertThrows(UploadException.class, () -> validator.videoDuration(file));
        byte[] zeroTimescale = valid.clone();
        ByteBuffer.wrap(zeroTimescale).putInt(48, 0);
        Files.write(file, zeroTimescale);
        assertThrows(UploadException.class, () -> validator.videoDuration(file));
    }

    @Test void checksDecodedImageContentInsteadOfTrustingNameOrMime() throws Exception {
        Path path = store.resolve("image");
        for (String format : new String[]{"png", "jpg"}) {
            Files.write(path, UploadFixtures.image(format).getBytes());
            assertEquals(format, validator.imageExtension(path));
        }
        Files.writeString(path, "not an image");
        assertEquals(415, assertThrows(UploadException.class, () -> validator.imageExtension(path)).getStatus());
        Files.write(path, UploadFixtures.mp4());
        assertThrows(UploadException.class, () -> validator.imageExtension(path));
    }
}
