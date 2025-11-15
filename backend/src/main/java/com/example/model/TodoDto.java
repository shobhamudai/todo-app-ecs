package com.example.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbAttribute;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbPartitionKey;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbSecondaryPartitionKey;

@Data
@NoArgsConstructor
@AllArgsConstructor
@DynamoDbBean
public class TodoDto {

    private String id;
    private String task;
    private boolean completed;
    private Long createdAt;
    private String userId; // Add userId field

    @DynamoDbPartitionKey
    @DynamoDbAttribute("id")
    public String getId() {
        return this.id;
    }

    public void setId(String id) {
        this.id = id;
    }

    @DynamoDbAttribute("task")
    public String getTask() {
        return this.task;
    }

    public void setTask(String task) {
        this.task = task;
    }

    @DynamoDbAttribute("completed")
    public boolean isCompleted() {
        return this.completed;
    }

    public void setCompleted(boolean completed) {
        this.completed = completed;
    }

    @DynamoDbAttribute("createdAt")
    public Long getCreatedAt() {
        return this.createdAt;
    }

    public void setCreatedAt(Long createdAt) {
        this.createdAt = createdAt;
    }

    // Define the secondary index for querying by userId
    @DynamoDbSecondaryPartitionKey(indexNames = "userId-index")
    @DynamoDbAttribute("userId")
    public String getUserId() {
        return this.userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }
}
