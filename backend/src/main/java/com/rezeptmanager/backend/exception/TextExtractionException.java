package com.rezeptmanager.backend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(value = HttpStatus.INTERNAL_SERVER_ERROR, reason = "Text extraction failed")
public class TextExtractionException extends RuntimeException {
    public TextExtractionException(String message) {
        super(message);
    }

    public TextExtractionException(String message, Throwable cause) {
        super(message, cause);
    }
}
