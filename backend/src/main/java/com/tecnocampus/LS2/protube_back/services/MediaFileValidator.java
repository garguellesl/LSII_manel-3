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
import java.util.HashMap;
import java.util.Map;
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

    public static final long AVATAR_LIMIT = 2L * 1024 * 1024;

    public void validateAvatar(MultipartFile file) {
        if (file == null || file.isEmpty()) throw new UploadException(400, "Avatar must not be empty");
        if (file.getSize() > AVATAR_LIMIT) throw new UploadException(413, "Avatar exceeds 2 MiB");
        String name = file.getOriginalFilename() == null ? "" : file.getOriginalFilename().toLowerCase(Locale.ROOT);
        String mime = file.getContentType();
        boolean valid = ((name.endsWith(".jpg") || name.endsWith(".jpeg")) && "image/jpeg".equals(mime))
                || (name.endsWith(".png") && "image/png".equals(mime));
        if (!valid) throw new UploadException(415, "Avatar must be JPG or PNG");
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
            if (timescale == 0) throw invalidVideo();
            boolean videoTrack = false;
            for (Box track : movieBoxes) {
                if (!track.type.equals("trak")) continue;
                Box media = required(boxes(channel, track.data, track.end), "mdia");
                Box handler = required(boxes(channel, media.data, media.end), "hdlr");
                if (handler.data + 12 > handler.end) throw invalidVideo();
                if (ascii(read(channel, handler.data + 8, 4)).equals("vide")) videoTrack = true;
            }
            if (!videoTrack) throw invalidVideo();
            // Fragmented files may leave mvhd/mdhd duration unknown until their runs are read.
            if (top.stream().anyMatch(box -> box.type.equals("moof")))
                return fragmentedDuration(channel, top, movieBoxes);
            if (duration <= 0) throw invalidVideo();
            return (double) duration / timescale;
        }
    }

    private double fragmentedDuration(FileChannel channel, List<Box> top, List<Box> movie) throws IOException {
        try {
            Map<Long, Track> tracks = fragmentTracks(channel, movie);
            Map<Long, SampleDefaults> defaults = fragmentDefaults(channel, required(movie, "mvex"), tracks);
            Map<Long, Long> decodeEnds = new HashMap<>();
            List<Box> media = top.stream().filter(box -> box.type.equals("mdat") && box.end > box.data).toList();
            boolean hasVideoSamples = false;
            double duration = 0;
            for (Box fragment : top) {
                if (!fragment.type.equals("moof")) continue;
                long implicitBase = fragment.start;
                boolean hasTrack = false;
                for (Box part : boxes(channel, fragment.data, fragment.end)) {
                    if (!part.type.equals("traf")) continue;
                    hasTrack = true;
                    List<Box> parts = boxes(channel, part.data, part.end);
                    FragmentHeader header = fragmentHeader(channel, required(parts, "tfhd"),
                            fragment.start, implicitBase, defaults);
                    Track track = tracks.get(header.trackId);
                    long time = decodeEnds.getOrDefault(header.trackId, 0L);
                    for (Box clock : parts) {
                        if (clock.type.equals("tfdt")) time = decodeTime(channel, clock);
                    }
                    long dataEnd = header.base;
                    boolean hasRun = false;
                    for (Box partRun : parts) {
                        if (!partRun.type.equals("trun")) continue;
                        hasRun = true;
                        Run run = fragmentRun(channel, partRun, header, dataEnd, media);
                        if (header.empty && run.samples > 0) throw invalidVideo();
                        time = Math.addExact(time, run.duration);
                        dataEnd = run.end;
                        if (run.samples > 0) {
                            duration = Math.max(duration, (double) time / track.timescale);
                            if (track.video) hasVideoSamples = true;
                        }
                    }
                    if (!hasRun && !header.empty) throw invalidVideo();
                    decodeEnds.put(header.trackId, time);
                    implicitBase = dataEnd;
                }
                if (!hasTrack) throw invalidVideo();
            }
            if (!hasVideoSamples || duration <= 0) throw invalidVideo();
            return duration;
        } catch (ArithmeticException exception) {
            throw invalidVideo();
        }
    }

    private Map<Long, Track> fragmentTracks(FileChannel channel, List<Box> movie) throws IOException {
        Map<Long, Track> result = new HashMap<>();
        for (Box track : movie) {
            if (!track.type.equals("trak")) continue;
            List<Box> children = boxes(channel, track.data, track.end);
            BoxInput header = new BoxInput(channel, required(children, "tkhd"));
            int version = header.integer() >>> 24;
            if (version > 1) throw invalidVideo();
            header.take(version == 0 ? 8 : 16);
            long id = header.unsigned();
            Box media = required(children, "mdia");
            List<Box> mediaBoxes = boxes(channel, media.data, media.end);
            BoxInput clock = new BoxInput(channel, required(mediaBoxes, "mdhd"));
            int full = clock.integer();
            version = full >>> 24;
            if (version > 1 || (full & 0xffffff) != 0) throw invalidVideo();
            clock.take(version == 0 ? 8 : 16);
            long scale = clock.unsigned();
            clock.take(version == 0 ? 4 : 8);
            BoxInput handler = new BoxInput(channel, required(mediaBoxes, "hdlr"));
            handler.take(8);
            boolean video = ascii(handler.take(4)).equals("vide");
            if (id == 0 || scale == 0 || result.put(id, new Track(scale, video)) != null) throw invalidVideo();
        }
        return result;
    }

    private Map<Long, SampleDefaults> fragmentDefaults(FileChannel channel, Box extendsBox,
                                                       Map<Long, Track> tracks) throws IOException {
        Map<Long, SampleDefaults> result = new HashMap<>();
        for (Box box : boxes(channel, extendsBox.data, extendsBox.end)) {
            if (!box.type.equals("trex")) continue;
            BoxInput input = new BoxInput(channel, box);
            if (input.integer() != 0) throw invalidVideo();
            long id = input.unsigned();
            if (!tracks.containsKey(id) || input.unsigned() == 0) throw invalidVideo();
            SampleDefaults defaults = new SampleDefaults(input.unsigned(), input.unsigned());
            input.integer(); // Default sample flags do not affect duration or byte bounds.
            if (input.remaining() != 0 || result.put(id, defaults) != null) throw invalidVideo();
        }
        return result;
    }

    private FragmentHeader fragmentHeader(FileChannel channel, Box box, long movieBase, long implicitBase,
                                          Map<Long, SampleDefaults> defaults) throws IOException {
        BoxInput input = new BoxInput(channel, box);
        int full = input.integer();
        int flags = full & 0xffffff;
        if ((full >>> 24) != 0 || (flags & ~0x03003b) != 0) throw invalidVideo();
        long id = input.unsigned();
        SampleDefaults track = defaults.get(id);
        if (track == null) throw invalidVideo();
        long base = (flags & 1) != 0 ? input.wide() : (flags & 0x020000) != 0 ? movieBase : implicitBase;
        if ((flags & 2) != 0 && input.unsigned() == 0) throw invalidVideo();
        long duration = (flags & 8) != 0 ? input.unsigned() : track.duration;
        long size = (flags & 16) != 0 ? input.unsigned() : track.size;
        if ((flags & 32) != 0) input.integer();
        if (input.remaining() != 0) throw invalidVideo();
        return new FragmentHeader(id, base, duration, size, (flags & 0x010000) != 0);
    }

    private long decodeTime(FileChannel channel, Box box) throws IOException {
        BoxInput input = new BoxInput(channel, box);
        int full = input.integer();
        int version = full >>> 24;
        if (version > 1 || (full & 0xffffff) != 0) throw invalidVideo();
        long time = version == 0 ? input.unsigned() : input.wide();
        if (input.remaining() != 0) throw invalidVideo();
        return time;
    }

    private Run fragmentRun(FileChannel channel, Box box, FragmentHeader header, long previousEnd,
                            List<Box> media) throws IOException {
        BoxInput input = new BoxInput(channel, box);
        int full = input.integer();
        int version = full >>> 24;
        int flags = full & 0xffffff;
        if (version > 1 || (flags & ~0x000f05) != 0 || ((flags & 4) != 0 && (flags & 0x400) != 0))
            throw invalidVideo();
        long count = input.unsigned();
        long start = (flags & 1) != 0 ? Math.addExact(header.base, input.integer()) : previousEnd;
        if ((flags & 4) != 0) input.integer();
        int entrySize = Integer.bitCount(flags & 0xf00) * 4;
        if (Math.multiplyExact(count, entrySize) != input.remaining()) throw invalidVideo();
        long duration = 0;
        long bytes = 0;
        if (entrySize == 0) {
            duration = Math.multiplyExact(count, header.duration);
            bytes = Math.multiplyExact(count, header.size);
        } else {
            for (long remaining = count; remaining > 0;) {
                int batch = (int) Math.min(4096, remaining);
                ByteBuffer samples = input.take(batch * entrySize);
                for (int i = 0; i < batch; i++) {
                    long sampleDuration = (flags & 0x100) != 0 ? Integer.toUnsignedLong(samples.getInt()) : header.duration;
                    long sampleSize = (flags & 0x200) != 0 ? Integer.toUnsignedLong(samples.getInt()) : header.size;
                    duration = Math.addExact(duration, sampleDuration);
                    bytes = Math.addExact(bytes, sampleSize);
                    if ((flags & 0x400) != 0) samples.getInt();
                    if ((flags & 0x800) != 0) samples.getInt(); // Composition offsets do not change decode duration.
                }
                remaining -= batch;
            }
        }
        long end = Math.addExact(start, bytes);
        if (count > 0 && (duration <= 0 || bytes <= 0 || !withinMedia(media, start, end))) throw invalidVideo();
        return new Run(count, duration, end);
    }

    private boolean withinMedia(List<Box> media, long start, long end) {
        // File-order boxes allow bounded lookup even for many small fragments.
        int low = 0, high = media.size() - 1;
        while (low <= high) {
            int middle = (low + high) >>> 1;
            Box box = media.get(middle);
            if (start < box.data) high = middle - 1;
            else if (start >= box.end) low = middle + 1;
            else return end <= box.end;
        }
        return false;
    }

    private final class BoxInput {
        private final FileChannel channel;
        private final Box box;
        private long position;
        private BoxInput(FileChannel channel, Box box) { this.channel = channel; this.box = box; }
        private long remaining() { return box.end - box.data - position; }
        private ByteBuffer take(int length) throws IOException {
            if (length < 0 || length > remaining()) throw invalidVideo();
            ByteBuffer value = read(channel, box.data + position, length);
            position += length;
            return value;
        }
        private int integer() throws IOException { return take(4).getInt(); }
        private long unsigned() throws IOException { return Integer.toUnsignedLong(integer()); }
        private long wide() throws IOException {
            long value = take(8).getLong();
            if (value < 0) throw invalidVideo();
            return value;
        }
    }

    private record Track(long timescale, boolean video) {}
    private record SampleDefaults(long duration, long size) {}
    private record FragmentHeader(long trackId, long base, long duration, long size, boolean empty) {}
    private record Run(long samples, long duration, long end) {}

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
            result.add(new Box(new String(type, StandardCharsets.US_ASCII), at, at + headerSize, at + size));
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

    private record Box(String type, long start, long data, long end) {}
}
