package com.example.util;

import org.apache.logging.log4j.ThreadContext;

public class LoggingContextManager {

    private static final String AWS_REQUEST_ID_KEY = "AWSRequestId";

    public static void setAwsRequestId(String requestId) {
        if (requestId != null && !requestId.isEmpty()) {
            ThreadContext.put(AWS_REQUEST_ID_KEY, requestId);
        }
    }

    public static void clearAll() {
        ThreadContext.clearAll();
    }
}
