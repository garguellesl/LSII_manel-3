package com.tecnocampus.LS2.protube_back.services;

import com.tecnocampus.LS2.protube_back.support.FragmentedMp4Fixture;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import static org.junit.jupiter.api.Assertions.*;

class FragmentedMp4ValidationTest {
    @TempDir Path store;
    final MediaFileValidator validator = new MediaFileValidator();

    double duration(byte[] bytes) throws Exception {
        Path file = store.resolve("fragmented.mp4");
        Files.write(file, bytes);
        return validator.videoDuration(file);
    }

    @Test void acceptsZeroMovieDurationAndReadsTrackDefaultsAcrossFragments() throws Exception {
        assertEquals(2.0, duration(new FragmentedMp4Fixture().bytes()));
    }

    @Test void fragmentDefaultsOverrideTrackDefaults() throws Exception {
        var movie = new FragmentedMp4Fixture();
        movie.fragmentDuration = 750; movie.fragmentSize = 3;
        movie.decodeTimes = new long[]{0, 1500};
        assertEquals(3.0, duration(movie.bytes()));
    }

    @Test void perSampleValuesOverrideFragmentDefaults() throws Exception {
        var movie = new FragmentedMp4Fixture();
        movie.fragmentDuration = 10; movie.fragmentSize = 1;
        movie.durations = new int[]{500, 1500}; movie.sizes = new int[]{1, 3};
        movie.decodeTimes = new long[]{0, 2000};
        assertEquals(4.0, duration(movie.bytes()));
    }

    @Test void supportsVersionOneClocksLargeDecodeTimesAndExtendedMediaBoxes() throws Exception {
        var movie = new FragmentedMp4Fixture(); movie.versionOne = true; movie.extendedMediaBox = true;
        movie.decodeTimes = new long[]{4_500_000_000L};
        assertEquals(4_500_001.0, duration(movie.bytes()));
    }

    @Test void continuesTimingWhenDecodeTimeIsAbsentAndSupportsImplicitAndExplicitBases() throws Exception {
        var movie = new FragmentedMp4Fixture(); movie.omitDecodeTime = true; movie.defaultBaseIsMoof = false;
        assertEquals(2.0, duration(movie.bytes()));
        movie.explicitBase = true;
        assertEquals(2.0, duration(movie.bytes()));
    }

    @Test void readsLargeTablesInChunksAndConsumesCompositionAndSampleFlags() throws Exception {
        var movie = new FragmentedMp4Fixture(); movie.samples = 5000;
        movie.durations = new int[5000]; Arrays.fill(movie.durations, 1);
        movie.sizes = new int[5000]; Arrays.fill(movie.sizes, 2);
        movie.compositionOffsets = new int[5000]; movie.compositionOffsets[0] = -1;
        movie.perSampleFlags = true; movie.versionOne = true; movie.decodeTimes = new long[]{0, 5000};
        assertEquals(10.0, duration(movie.bytes()));
        movie.perSampleFlags = false; movie.firstSampleFlags = true;
        assertEquals(10.0, duration(movie.bytes()));
    }

    @Test void rejectsInitializationOnlyAudioOnlyAndMissingVideoSamples() {
        var movie = new FragmentedMp4Fixture(); movie.decodeTimes = new long[0]; invalid(movie.bytes());
        movie = new FragmentedMp4Fixture(); movie.handler = "soun"; invalid(movie.bytes());
        movie = new FragmentedMp4Fixture(); movie.samples = 0; invalid(movie.bytes());
        movie = new FragmentedMp4Fixture(); movie.defaultDuration = 0; invalid(movie.bytes());
    }

    @Test void rejectsUnknownTracksZeroTimescalesAndIncompletePayloads() {
        var movie = new FragmentedMp4Fixture(); movie.fragmentTrackId = 9; invalid(movie.bytes());
        movie = new FragmentedMp4Fixture(); movie.timescale = 0; invalid(movie.bytes());
        movie = new FragmentedMp4Fixture(); movie.payloadTrim = 1; invalid(movie.bytes());
        byte[] good = new FragmentedMp4Fixture().bytes(); invalid(Arrays.copyOf(good, good.length - 1));
    }

    @Test void rejectsInvalidRunOffsetsUnboundedCountsAndMalformedTables() {
        byte[] bytes = new FragmentedMp4Fixture().bytes();
        put(bytes, "trun", 8, -4); invalid(bytes);
        var movie = new FragmentedMp4Fixture(); movie.durations = new int[]{500, 500};
        bytes = movie.bytes(); put(bytes, "trun", 4, -1); invalid(bytes);
        bytes = movie.bytes(); put(bytes, "trun", 4, 3); invalid(bytes);
        bytes = movie.bytes(); put(bytes, "tfhd", 0, 0x020001); invalid(bytes);
        bytes = new FragmentedMp4Fixture().bytes();
        put(bytes, "mvhd", 16, 2000); put(bytes, "trun", 4, -1); invalid(bytes);
    }

    @Test void rejectsUnsupportedVersionsReservedFlagsAndMissingInitialization() {
        for (String type : new String[]{"mvhd", "tkhd", "mdhd", "tfhd", "tfdt", "trun", "trex"}) {
            byte[] bytes = new FragmentedMp4Fixture().bytes();
            put(bytes, type, 0, 0x02000000); invalid(bytes);
        }
        byte[] bytes = new FragmentedMp4Fixture().bytes(); put(bytes, "tfhd", 0, 0x00000004); invalid(bytes);
        bytes = new FragmentedMp4Fixture().bytes(); put(bytes, "trun", 0, 0x00000003); invalid(bytes);
        bytes = new FragmentedMp4Fixture().bytes();
        int at = content(bytes, "mvex"); System.arraycopy("free".getBytes(StandardCharsets.US_ASCII), 0, bytes, at - 4, 4); invalid(bytes);
    }

    @Test void rejectsOverflowingOrNegativeDecodeTimes() {
        var movie = new FragmentedMp4Fixture(); movie.versionOne = true;
        movie.decodeTimes = new long[]{Long.MAX_VALUE - 100}; invalid(movie.bytes());
        movie.decodeTimes = new long[]{Long.MIN_VALUE}; invalid(movie.bytes());
    }

    private void invalid(byte[] bytes) {
        assertEquals(415, assertThrows(UploadException.class, () -> duration(bytes)).getStatus());
    }
    private static void put(byte[] bytes, String type, int offset, int value) {
        ByteBuffer.wrap(bytes).putInt(content(bytes, type) + offset, value);
    }
    private static int content(byte[] bytes, String type) {
        byte[] needle = type.getBytes(StandardCharsets.US_ASCII);
        for (int i = 4; i <= bytes.length - 4; i++) {
            if (Arrays.equals(bytes, i, i + 4, needle, 0, 4)) return i + 4;
        }
        throw new AssertionError("Missing fixture box " + type);
    }
}
