package com.notevault.util;

public final class TextUtils {

    private TextUtils() {
    }

    public static int countWords(String text) {
        if (text == null || text.isBlank()) {
            return 0;
        }
        String trimmed = text.trim();
        return trimmed.split("\\s+").length;
    }
}
