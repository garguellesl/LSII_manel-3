package com.tecnocampus.LS2.protube_back.entities;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class TagTest {

    @Test
    void storesTheGivenNameAndHasNoIdBeforePersistence() {
        Tag tag = new Tag("java");

        assertEquals("java", tag.getName());
        assertNull(tag.getId());
    }
}
