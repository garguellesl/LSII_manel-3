package com.tecnocampus.LS2.protube_back.support;

import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

import static com.tecnocampus.LS2.protube_back.support.UploadFixtures.box;
import static com.tecnocampus.LS2.protube_back.support.UploadFixtures.join;

/** Synthetic container/timing fixture, not codec data or a user's movie. */
public final class FragmentedMp4Fixture {
    public int timescale = 1000;
    public int defaultDuration = 500;
    public int defaultSize = 2;
    public Integer fragmentDuration;
    public Integer fragmentSize;
    public int[] durations;
    public int[] sizes;
    public int[] compositionOffsets;
    public int samples = 2;
    public long[] decodeTimes = {0, 1000};
    public boolean versionOne;
    public boolean omitDecodeTime;
    public boolean explicitBase;
    public boolean defaultBaseIsMoof = true;
    public boolean extendedMediaBox;
    public boolean firstSampleFlags;
    public boolean perSampleFlags;
    public int fragmentTrackId = 1;
    public String handler = "vide";
    public int payloadTrim;

    public byte[] bytes() {
        byte[] clock = clock(1000);
        ByteBuffer track = ByteBuffer.allocate(versionOne ? 24 : 16).putInt(versionOne ? 0x01000000 : 0);
        if (versionOne) track.putLong(0).putLong(0); else track.putInt(0).putInt(0);
        track.putInt(1);
        byte[] media = box("mdia", join(box("mdhd", clock(timescale)),
                box("hdlr", ByteBuffer.allocate(12).putLong(0).put(handler.getBytes(StandardCharsets.US_ASCII)).array())));
        byte[] defaults = ByteBuffer.allocate(24).putInt(0).putInt(1).putInt(1)
                .putInt(defaultDuration).putInt(defaultSize).putInt(0).array();
        byte[] init = join(box("ftyp", "isom0000mp42".getBytes(StandardCharsets.US_ASCII)),
                box("moov", join(box("mvhd", clock), box("trak", join(box("tkhd", track.array()), media)),
                        box("mvex", box("trex", defaults)))));
        List<byte[]> parts = new ArrayList<>();
        parts.add(init);
        long position = init.length;
        for (long time : decodeTimes) {
            int flags = explicitBase ? 1 : defaultBaseIsMoof ? 0x020000 : 0;
            if (fragmentDuration != null) flags |= 8;
            if (fragmentSize != null) flags |= 16;
            ByteBuffer tfhd = ByteBuffer.allocate(8 + (explicitBase ? 8 : 0)
                    + (fragmentDuration != null ? 4 : 0) + (fragmentSize != null ? 4 : 0))
                    .putInt(flags).putInt(fragmentTrackId);
            if (explicitBase) tfhd.putLong(position);
            if (fragmentDuration != null) tfhd.putInt(fragmentDuration);
            if (fragmentSize != null) tfhd.putInt(fragmentSize);
            byte[] tfdt = omitDecodeTime ? new byte[0] : box("tfdt", versionOne
                    ? ByteBuffer.allocate(12).putInt(0x01000000).putLong(time).array()
                    : ByteBuffer.allocate(8).putInt(0).putInt((int) time).array());
            byte[] header = box("tfhd", tfhd.array());
            byte[] moof = box("moof", box("traf", join(header, tfdt, run(0))));
            moof = box("moof", box("traf", join(header, tfdt, run(moof.length + (extendedMediaBox ? 16 : 8)))));
            int bytes = 0;
            for (int i = 0; i < samples; i++) bytes += sizes != null ? sizes[i] : fragmentSize != null ? fragmentSize : defaultSize;
            byte[] payload = new byte[Math.max(0, bytes - payloadTrim)];
            byte[] mdat = extendedMediaBox
                    ? ByteBuffer.allocate(payload.length + 16).putInt(1).put("mdat".getBytes(StandardCharsets.US_ASCII))
                        .putLong(payload.length + 16L).put(payload).array()
                    : box("mdat", payload);
            parts.add(moof); parts.add(mdat); position += moof.length + mdat.length;
        }
        return join(parts.toArray(byte[][]::new));
    }

    private byte[] clock(int scale) {
        ByteBuffer value = ByteBuffer.allocate(versionOne ? 32 : 20).putInt(versionOne ? 0x01000000 : 0);
        if (versionOne) return value.putLong(0).putLong(0).putInt(scale).putLong(0).array();
        return value.putInt(0).putInt(0).putInt(scale).putInt(0).array();
    }

    private byte[] run(int offset) {
        int fields = (durations != null ? 1 : 0) + (sizes != null ? 1 : 0)
                + (compositionOffsets != null ? 1 : 0) + (perSampleFlags ? 1 : 0);
        int flags = 1 | (durations != null ? 0x100 : 0) | (sizes != null ? 0x200 : 0)
                | (compositionOffsets != null ? 0x800 : 0) | (perSampleFlags ? 0x400 : 0) | (firstSampleFlags ? 4 : 0);
        ByteBuffer result = ByteBuffer.allocate(12 + (firstSampleFlags ? 4 : 0) + samples * fields * 4)
                .putInt((versionOne ? 0x01000000 : 0) | flags).putInt(samples).putInt(offset);
        if (firstSampleFlags) result.putInt(0);
        for (int i = 0; i < samples; i++) {
            if (durations != null) result.putInt(durations[i]);
            if (sizes != null) result.putInt(sizes[i]);
            if (perSampleFlags) result.putInt(0);
            if (compositionOffsets != null) result.putInt(compositionOffsets[i]);
        }
        return box("trun", result.array());
    }
}
