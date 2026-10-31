package com.tecnocampus.LS2.protube_back.services;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;

public final class TagNormalizer {

    public static final int MIN_LENGTH = 1;
    public static final int MAX_LENGTH = 80;
    public static final int MAX_DISTINCT_TAGS = 40;

    private static final char CURLY_APOSTROPHE = (char) 0x2019;
    private static final char KATAKANA_MIDDLE_DOT = (char) 0x30FB;

    private static final Pattern FORMAT_CHARACTERS = Pattern.compile("\\p{Cf}");
    private static final Pattern MULTIPLE_SPACES = Pattern.compile(" +");
    private static final Pattern LETTER_OR_DIGIT = Pattern.compile("[\\p{L}\\p{Nd}]");
    private static final Pattern ALLOWED_CHARACTERS = Pattern.compile(
            "^[\\p{L}\\p{M}\\p{Nd} '\\-.()#&!/+_" + KATAKANA_MIDDLE_DOT + "]+$"
    );

    private TagNormalizer() {
    }

    public static Result normalizeAndValidate(List<String> rawTags) {
        Map<String, String> fieldErrors = new LinkedHashMap<>();
        LinkedHashSet<String> distinctTags = new LinkedHashSet<>();

        for (int i = 0; i < rawTags.size(); i++) {
            String raw = rawTags.get(i);
            if (raw == null) {
                fieldErrors.put("tags[" + i + "]", "tag must not be null");
                continue;
            }
            String normalized = normalize(raw);
            String error = validateSingle(normalized);
            if (error != null) {
                fieldErrors.put("tags[" + i + "]", error);
                continue;
            }
            distinctTags.add(normalized);
        }

        if (!fieldErrors.isEmpty()) {
            return new Result(List.of(), fieldErrors);
        }

        if (distinctTags.size() > MAX_DISTINCT_TAGS) {
            fieldErrors.put("tags", "must not contain more than " + MAX_DISTINCT_TAGS + " distinct tags");
            return new Result(List.of(), fieldErrors);
        }

        return new Result(new ArrayList<>(distinctTags), Map.of());
    }

    static String normalize(String raw) {
        String withoutFormatCharacters = FORMAT_CHARACTERS.matcher(raw).replaceAll("");
        String withStraightApostrophe = withoutFormatCharacters.replace(CURLY_APOSTROPHE, '\'');
        String trimmed = withStraightApostrophe.strip();
        String collapsedSpaces = MULTIPLE_SPACES.matcher(trimmed).replaceAll(" ");
        return collapsedSpaces.toLowerCase(Locale.ROOT);
    }

    private static String validateSingle(String normalized) {
        if (normalized.isEmpty()) {
            return "tag must not be blank";
        }
        if (normalized.length() > MAX_LENGTH) {
            return "tag must be at most " + MAX_LENGTH + " characters";
        }
        if (!ALLOWED_CHARACTERS.matcher(normalized).matches()) {
            return "tag contains a character outside the allowed set";
        }
        if (!LETTER_OR_DIGIT.matcher(normalized).find()) {
            return "tag must contain at least one letter or digit";
        }
        return null;
    }

    public record Result(List<String> normalizedTags, Map<String, String> fieldErrors) {
        public boolean isValid() {
            return fieldErrors.isEmpty();
        }
    }
}
