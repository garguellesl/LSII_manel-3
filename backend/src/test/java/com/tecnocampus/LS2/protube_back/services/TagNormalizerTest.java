package com.tecnocampus.LS2.protube_back.services;

import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class TagNormalizerTest {

    private static final char CURLY_APOSTROPHE = (char) 0x2019;
    private static final char ZERO_WIDTH_NON_JOINER = (char) 0x200C;
    private static final char KATAKANA_MIDDLE_DOT = (char) 0x30FB;
    private static final char BELL = (char) 0x0007;

    @Test
    void mergesCaseInsensitiveDuplicates() {
        var result = TagNormalizer.normalizeAndValidate(List.of("Java", "java "));

        assertTrue(result.isValid());
        assertEquals(List.of("java"), result.normalizedTags());
    }

    @Test
    void stripsFormatCharacterAtStartOfTag() {
        var result = TagNormalizer.normalizeAndValidate(List.of(ZERO_WIDTH_NON_JOINER + "mark ronson"));

        assertTrue(result.isValid());
        assertEquals(List.of("mark ronson"), result.normalizedTags());
    }

    @Test
    void normalizesCurlyApostropheToStraightApostrophe() {
        var result = TagNormalizer.normalizeAndValidate(List.of("guns n" + CURLY_APOSTROPHE + " roses"));

        assertTrue(result.isValid());
        assertEquals(List.of("guns n' roses"), result.normalizedTags());
    }

    @Test
    void acceptsTagAtMaxLength() {
        String tag = "a".repeat(TagNormalizer.MAX_LENGTH);

        var result = TagNormalizer.normalizeAndValidate(List.of(tag));

        assertTrue(result.isValid());
        assertEquals(List.of(tag), result.normalizedTags());
    }

    @Test
    void rejectsTagLongerThanMaxLength() {
        String tag = "a".repeat(TagNormalizer.MAX_LENGTH + 1);

        var result = TagNormalizer.normalizeAndValidate(List.of(tag));

        assertEquals(fieldError("tags[0]", "tag must be at most 80 characters"), result.fieldErrors());
    }

    @Test
    void rejectsEmptyTag() {
        var result = TagNormalizer.normalizeAndValidate(List.of("", "rock"));

        assertEquals(fieldError("tags[0]", "tag must not be blank"), result.fieldErrors());
    }

    @Test
    void rejectsNullElement() {
        var result = TagNormalizer.normalizeAndValidate(java.util.Arrays.asList((String) null));

        assertEquals(fieldError("tags[0]", "tag must not be null"), result.fieldErrors());
    }

    @Test
    void rejectsTagWithOnlySymbolsAndNoLetterOrDigit() {
        var result = TagNormalizer.normalizeAndValidate(List.of("!!!"));

        assertEquals(fieldError("tags[0]", "tag must contain at least one letter or digit"), result.fieldErrors());
    }

    @Test
    void rejectsControlCharacterOutsideAllowedSet() {
        var result = TagNormalizer.normalizeAndValidate(List.of("tag" + BELL + "name"));

        assertEquals(fieldError("tags[0]", "tag contains a character outside the allowed set"), result.fieldErrors());
    }

    @Test
    void rejectsSemicolon() {
        var result = TagNormalizer.normalizeAndValidate(List.of("what;s up"));

        assertEquals(fieldError("tags[0]", "tag contains a character outside the allowed set"), result.fieldErrors());
    }

    @Test
    void acceptsPlusAsTechnicalExtension() {
        var result = TagNormalizer.normalizeAndValidate(List.of("C++"));

        assertTrue(result.isValid());
        assertEquals(List.of("c++"), result.normalizedTags());
    }

    @Test
    void acceptsUnderscoreAsTechnicalExtension() {
        var result = TagNormalizer.normalizeAndValidate(List.of("Node_JS"));

        assertTrue(result.isValid());
        assertEquals(List.of("node_js"), result.normalizedTags());
    }

    @Test
    void collapsesMultipleInternalSpaces() {
        var result = TagNormalizer.normalizeAndValidate(List.of("rock   music"));

        assertTrue(result.isValid());
        assertEquals(List.of("rock music"), result.normalizedTags());
    }

    @Test
    void mergesDuplicatesWithDifferentCasing() {
        var result = TagNormalizer.normalizeAndValidate(List.of("Rock", "rock", "ROCK"));

        assertTrue(result.isValid());
        assertEquals(List.of("rock"), result.normalizedTags());
    }

    @Test
    void keepsKatakanaMiddleDotSeparator() {
        String tag = "a" + KATAKANA_MIDDLE_DOT + "b";

        var result = TagNormalizer.normalizeAndValidate(List.of(tag));

        assertTrue(result.isValid());
        assertEquals(List.of(tag), result.normalizedTags());
    }

    @Test
    void rejectsMoreThanFortyDistinctTags() {
        List<String> tags = IntStream.range(0, TagNormalizer.MAX_DISTINCT_TAGS + 1)
                .mapToObj(i -> "tag" + i)
                .collect(Collectors.toList());

        var result = TagNormalizer.normalizeAndValidate(tags);

        assertEquals(fieldError("tags", "must not contain more than 40 distinct tags"), result.fieldErrors());
    }

    @Test
    void rawCountAboveMaxButDistinctCountAtMaxIsValid() {
        List<String> baseTags = IntStream.range(0, TagNormalizer.MAX_DISTINCT_TAGS)
                .mapToObj(i -> "tag" + i)
                .collect(Collectors.toList());
        List<String> withDuplicates = new java.util.ArrayList<>(baseTags);
        withDuplicates.add("TAG0");
        withDuplicates.add("Tag1");
        withDuplicates.add("tag2 ");
        withDuplicates.add("tag3");
        withDuplicates.add("tag4");

        var result = TagNormalizer.normalizeAndValidate(withDuplicates);

        assertTrue(result.isValid());
        assertEquals(TagNormalizer.MAX_DISTINCT_TAGS, result.normalizedTags().size());
    }

    private static java.util.Map<String, String> fieldError(String key, String value) {
        return java.util.Map.of(key, value);
    }
}
