package com.example.dao;

import com.example.mapper.TodoMapper;
import com.example.model.TodoBO;
import com.example.model.TodoDto;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.Key;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;

import java.util.List;

@Repository
public class TodoDao {

    private final DynamoDbTable<TodoDto> todoTable;
    private final TodoMapper todoMapper;

    public TodoDao(DynamoDbEnhancedClient enhancedClient, TodoMapper todoMapper) {
        this.todoTable = enhancedClient.table("EcsTodos", TableSchema.fromBean(TodoDto.class));
        this.todoMapper = todoMapper;
    }

    public List<TodoBO> getAllTodos() {
        // Note: A scan is inefficient on large tables. This is for demonstration only.
        return todoMapper.toBoList(todoTable.scan().items().stream().toList());
    }

    public void addTodo(TodoBO todo) {
        todoTable.putItem(todoMapper.toDto(todo));
    }

    public void updateTodo(TodoBO todo) {
        todoTable.updateItem(todoMapper.toDto(todo));
    }

    public void deleteTodo(String id) {
        todoTable.deleteItem(Key.builder().partitionValue(id).build());
    }
}
