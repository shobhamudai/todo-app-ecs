package com.example.service;

import com.example.dao.TodoDao;
import com.example.model.TodoBO;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Log4j2
@Service
public class TodoService {

    private final TodoDao todoDao;

    public TodoService(TodoDao todoDao) {
        this.todoDao = todoDao;
    }

    public List<TodoBO> getPublicTodos() {
        log.info("Service: Fetching all public todos (where userId is null).");
        return todoDao.getPublicTodos();
    }

    public List<TodoBO> getTodosForUser(String userId) {
        log.info("Service: Fetching todos for user [{}].", userId);
        return todoDao.getTodosByUserId(userId);
    }

    public TodoBO addTodoForUser(TodoBO todo, String userId) {
        String newId = UUID.randomUUID().toString();
        log.info("Service: Adding new todo with id [{}] for user [{}].", newId, userId);
        todo.setId(newId);
        todo.setUserId(userId); // Set the user ID
        todo.setCompleted(false);
        todo.setCreatedAt(Instant.now().toEpochMilli());
        todoDao.addTodo(todo);
        return todo;
    }

    public TodoBO updateTodo(String id, TodoBO todo, String userId) {
        log.info("Service: Updating todo with id [{}] for user [{}].", id, userId);
        // In a real app, you'd first fetch the existing todo to verify ownership
        todo.setId(id);
        todo.setUserId(userId);
        todoDao.updateTodo(todo);
        return todo;
    }

    public void deleteTodo(String id, String userId) {
        log.info("Service: Deleting todo with id [{}] for user [{}].", id, userId);
        // In a real app, you'd first fetch the existing todo to verify ownership
        todoDao.deleteTodo(id);
    }
}
