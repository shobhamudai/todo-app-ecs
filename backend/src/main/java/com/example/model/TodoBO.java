package com.example.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TodoBO {
    private String id;
    private String task;
    private boolean completed;
    private Long createdAt;
    private String userId; // Add userId field
}
