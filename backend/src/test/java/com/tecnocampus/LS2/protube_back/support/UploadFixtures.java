package com.tecnocampus.LS2.protube_back.support;

import org.springframework.mock.web.MockMultipartFile;
import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;

public final class UploadFixtures {
    private UploadFixtures() {}

    // Minimal ISO BMFF structure for validation tests, not a playback/codec fixture.
    public static byte[] mp4() {
        byte[] timing = ByteBuffer.allocate(20).putInt(0).putInt(0).putInt(0).putInt(1000).putInt(2000).array();
        byte[] handler = ByteBuffer.allocate(12).putLong(0).put("vide".getBytes(StandardCharsets.US_ASCII)).array();
        return join(box("ftyp", "isom0000mp42".getBytes(StandardCharsets.US_ASCII)),
                box("moov", join(box("mvhd", timing), box("trak", box("mdia", box("hdlr", handler))))),
                box("mdat", new byte[]{1, 2, 3, 4}));
    }

    public static MockMultipartFile video() { return new MockMultipartFile("video", "../../test.mp4", "video/mp4", mp4()); }

    public static MockMultipartFile image(String format) throws IOException {
        var output = new ByteArrayOutputStream();
        ImageIO.write(new BufferedImage(2, 2, BufferedImage.TYPE_INT_RGB), format, output);
        return new MockMultipartFile("thumbnail", "thumbnail." + format, format.equals("png") ? "image/png" : "image/jpeg", output.toByteArray());
    }

    public static byte[] box(String type, byte[] content) {
        return ByteBuffer.allocate(content.length + 8).putInt(content.length + 8)
                .put(type.getBytes(StandardCharsets.US_ASCII)).put(content).array();
    }

    public static byte[] join(byte[]... values) {
        var output = new ByteArrayOutputStream();
        for (byte[] value : values) output.writeBytes(value);
        return output.toByteArray();
    }
}
