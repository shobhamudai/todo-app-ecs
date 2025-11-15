package com.example.dao;

import com.example.mapper.TodoMapper;
import com.example.model.TodoBO;
import com.example.model.TodoDto;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbIndex;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.Key;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;
import software.amazon.awssdk.enhanced.dynamodb.model.QueryConditional;
import software.amazon.awssdk.enhanced.dynamodb.model.ScanEnhancedRequest;

import java.util.List;
import java.util.stream.Collectors;

@Log4j2
@Repository
public class TodoDao {

    private static final String USER_ID_INDEX = "userId-index";
    private final DynamoDbTable<TodoDto> todoTable;
    private final TodoMapper todoMapper;

    public TodoDao(DynamoDbEnhancedClient enhancedClient, TodoMapper todoMapper) {
        String tableName = System.getenv("TABLE_NAME");
        this.todoTable = enhancedClient.table(tableName, TableSchema.fromBean(TodoDto.class));
        this.todoMapper = todoMapper;
        log.info("DAO initialized for table [{}].", tableName);
    }

    public List<TodoBO> getPublicTodos() {
        log.info("DAO: Scanning for public todos (userId is null).");
        // Scan the table and filter where userId is null
        ScanEnhancedRequest scanRequest = ScanEnhancedRequest.builder().build();
        return todoTable.scan(scanRequest)
                .items()
                .stream()
                .filter(dto -> dto.getUserId() == null || dto.getUserId().isEmpty())
                .map(todoMapper::toBo)
                .collect(Collectors.toList());
    }

    public List<TodoBO> getTodosByUserId(String userId) {
        log.info("DAO: Querying userId-index for todos for user ID [{}].", userId);
        DynamoDbIndex<TodoDto> userIndex = todoTable.index(USER_ID_INDEX);
        QueryConditional queryConditional = QueryConditional.keyEqualTo(Key.builder().partitionValue(userId).build());
        return userIndex.query(queryConditional).stream()
                .flatMap(page -> page.items().stream())
                .map(todoMapper::toBo)
                .collect(Collectors.toList());
    }

    public void addTodo(TodoBO todo) {
        log.info("DAO: Putting item with id [{}] and userId [{}].", todo.getId(), todo.getUserId());
        todoTable.putItem(todoMapper.toDto(todo));
    }

    public void updateTodo(TodoBO todo) {
        log.info("DAO: Updating item with id [{}] and userId [{}].", todo.getId(), todo.getUserId());
        todoTable.updateItem(todoMapper.toDto(todo));
    }

    public void deleteTodo(String id) {
        log.info("DAO: Deleting item with id [{}].", id);
        todoTable.deleteItem(Key.builder().partitionValue(id).build());
    }
}
