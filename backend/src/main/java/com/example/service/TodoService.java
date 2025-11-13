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

    public List<TodoBO> getAllTodos() {
        log.info("Service: Fetching all todos.");
        return todoDao.getAllTodos();
    }

    public TodoBO addTodo(TodoBO todo) {
        String newId = UUID.randomUUID().toString();
        log.info("Service: Adding new todo with id [{}].", newId);
        todo.setId(newId);
        todo.setCompleted(false);
        todo.setCreatedAt(Instant.now().toEpochMilli());
        todoDao.addTodo(todo);
        return todo;
    }

    public TodoBO updateTodo(String id, TodoBO todo) {
        log.info("Service: Updating todo with id [{}].", id);
        todo.setId(id);
        todoDao.updateTodo(todo);
        return todo;
    }

    public void deleteTodo(String id) {
        log.info("Service: Deleting todo with id [{}].", id);
        todoDao.deleteTodo(id);
    }
}
