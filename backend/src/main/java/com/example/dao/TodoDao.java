package com.example.dao;

import com.example.mapper.TodoMapper;
import com.example.model.TodoBO;
import com.example.model.TodoDto;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.Key;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;

import java.util.List;

@Log4j2
@Repository
public class TodoDao {

    private final DynamoDbTable<TodoDto> todoTable;
    private final TodoMapper todoMapper;

    public TodoDao(DynamoDbEnhancedClient enhancedClient, TodoMapper todoMapper) {
        String tableName = System.getenv("TABLE_NAME");
        this.todoTable = enhancedClient.table(tableName, TableSchema.fromBean(TodoDto.class));
        this.todoMapper = todoMapper;
        log.info("DAO initialized for table [{}].", tableName);
    }

    public List<TodoBO> getAllTodos() {
        log.info("DAO: Scanning for all todos.");
        return todoMapper.toBoList(todoTable.scan().items().stream().toList());
    }

    public void addTodo(TodoBO todo) {
        log.info("DAO: Putting item with id [{}].", todo.getId());
        todoTable.putItem(todoMapper.toDto(todo));
    }

    public void updateTodo(TodoBO todo) {
        log.info("DAO: Updating item with id [{}].", todo.getId());
        todoTable.updateItem(todoMapper.toDto(todo));
    }

    public void deleteTodo(String id) {
        log.info("DAO: Deleting item with id [{}].", id);
        todoTable.deleteItem(Key.builder().partitionValue(id).build());
    }
}
