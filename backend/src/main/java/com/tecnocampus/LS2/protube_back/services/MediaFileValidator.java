package com.tecnocampus.LS2.protube_back.services;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.channels.FileChannel;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
public class MediaFileValidator {
    public static final long VIDEO_LIMIT = 100L * 1024 * 1024;
    public static final long THUMBNAIL_LIMIT = 5L * 1024 * 1024;
    private static final Set<String> MP4_BRANDS = Set.of("isom", "iso2", "iso4", "iso5", "iso6", "mp41", "mp42", "avc1", "M4V ", "dash");

    public void validateUpload(MultipartFile file, boolean thumbnail) {
        if (file == null || file.isEmpty()) {
            throw new UploadException(400, thumbnail ? "Thumbnail must not be empty" : "Video must not be empty");
        }
        if (file.getSize() > (thumbnail ? THUMBNAIL_LIMIT : VIDEO_LIMIT)) {
            throw new UploadException(413, thumbnail ? "Thumbnail exceeds 5 MiB" : "Video exceeds 100 MiB");
        }
        String name = file.getOriginalFilename() == null ? "" : file.getOriginalFilename().toLowerCase(Locale.ROOT);
        String mime = file.getContentType();
        boolean valid = thumbnail
                ? ((name.endsWith(".jpg") || name.endsWith(".jpeg")) && "image/jpeg".equals(mime))
                    || (name.endsWith(".png") && "image/png".equals(mime))
                : name.endsWith(".mp4") && "video/mp4".equals(mime);
        if (!valid) throw new UploadException(415, thumbnail ? "Thumbnail must be JPG or PNG" : "Video must be MP4");
    }

    public String imageExtension(Path path) throws IOException {
        try (var input = ImageIO.createImageInputStream(path.toFile())) {
            if (input == null) throw invalidImage();
            var readers = ImageIO.getImageReaders(input);
            if (!readers.hasNext()) throw invalidImage();
            var reader = readers.next();
            try {
                String format = reader.getFormatName().toLowerCase(Locale.ROOT);
                if (!Set.of("png", "jpeg", "jpg").contains(format)) throw invalidImage();
                reader.setInput(input, true, true);
                int width = reader.getWidth(0);
                int height = reader.getHeight(0);
                // Bound decoded memory even for tiny compressed image bombs.
                if (width <= 0 || height <= 0 || (long) width * height > 25_000_000) throw invalidImage();
                if (reader.read(0) == null) throw invalidImage();
                return format.equals("png") ? "png" : "jpg";
            } catch (IOException | IllegalArgumentException exception) {
                throw invalidImage();
            } finally {
                reader.dispose();
            }
        }
    }

    public double videoDuration(Path path) throws IOException {
        try (var channel = FileChannel.open(path, StandardOpenOption.READ)) {
            List<Box> top = boxes(channel, 0, channel.size());
            Box type = required(top, "ftyp");
            if (type.end - type.data < 8 || (type.end - type.data) % 4 != 0) throw invalidVideo();
            boolean supported = false;
            for (long offset = type.data; offset < type.end; offset += 4) {
                if (offset != type.data + 4 && MP4_BRANDS.contains(ascii(read(channel, offset, 4)))) supported = true;
            }
            if (!supported) throw invalidVideo();
            if (top.stream().noneMatch(box -> box.type.equals("mdat") && box.end > box.data)) throw invalidVideo();
            Box movie = required(top, "moov");
            List<Box> movieBoxes = boxes(channel, movie.data, movie.end);
            Box header = required(movieBoxes, "mvhd");
            int version = read(channel, header.data, 1).get() & 0xff;
            int offset = version == 0 ? 12 : version == 1 ? 20 : -1;
            int length = version == 0 ? 8 : 12;
            if (offset < 0 || header.data + offset + length > header.end) throw invalidVideo();
            ByteBuffer timing = read(channel, header.data + offset, length);
            long timescale = Integer.toUnsignedLong(timing.getInt());
            long duration = version == 0 ? Integer.toUnsignedLong(timing.getInt()) : timing.getLong();
            if (timescale == 0 || duration <= 0) throw invalidVideo();
            boolean videoTrack = false;
            for (Box track : movieBoxes) {
                if (!track.type.equals("trak")) continue;
                Box media = required(boxes(channel, track.data, track.end), "mdia");
                Box handler = required(boxes(channel, media.data, media.end), "hdlr");
                if (handler.data + 12 > handler.end) throw invalidVideo();
                if (ascii(read(channel, handler.data + 8, 4)).equals("vide")) videoTrack = true;
            }
            if (!videoTrack) throw invalidVideo();
            return (double) duration / timescale;
        }
    }

    private List<Box> boxes(FileChannel channel, long start, long end) throws IOException {
        List<Box> result = new ArrayList<>();
        for (long at = start; at < end;) {
            if (end - at < 8 || result.size() >= 100_000) throw invalidVideo();
            ByteBuffer header = read(channel, at, 8);
            long size = Integer.toUnsignedLong(header.getInt());
            byte[] type = new byte[4];
            header.get(type);
            int headerSize = 8;
            if (size == 1) {
                if (end - at < 16) throw invalidVideo();
                size = read(channel, at + 8, 8).getLong();
                headerSize = 16;
            } else if (size == 0) size = end - at;
            if (size < headerSize || size > end - at) throw invalidVideo();
            result.add(new Box(new String(type, StandardCharsets.US_ASCII), at + headerSize, at + size));
            at += size;
        }
        return result;
    }

    private ByteBuffer read(FileChannel channel, long at, int length) throws IOException {
        ByteBuffer buffer = ByteBuffer.allocate(length);
        while (buffer.hasRemaining()) {
            int count = channel.read(buffer, at + buffer.position());
            if (count <= 0) throw invalidVideo();
        }
        return buffer.flip();
    }

    private String ascii(ByteBuffer buffer) {
        return StandardCharsets.US_ASCII.decode(buffer).toString();
    }

    private Box required(List<Box> boxes, String type) {
        return boxes.stream().filter(box -> box.type.equals(type)).findFirst().orElseThrow(this::invalidVideo);
    }

    private UploadException invalidVideo() {
        return new UploadException(415, "Invalid or incomplete MP4 video");
    }

    private UploadException invalidImage() {
        return new UploadException(415, "Invalid JPG or PNG thumbnail (maximum 25 megapixels)");
    }

    private record Box(String type, long data, long end) {}
}
