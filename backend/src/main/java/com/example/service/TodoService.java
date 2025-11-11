package com.example.service;

import com.example.dao.TodoDao;
import com.example.model.TodoBO;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class TodoService {

    private final TodoDao todoDao;

    public TodoService(TodoDao todoDao) {
        this.todoDao = todoDao;
    }

    public List<TodoBO> getAllTodos() {
        return todoDao.getAllTodos();
    }

    public TodoBO addTodo(TodoBO todo) {
        todo.setId(UUID.randomUUID().toString());
        todo.setCompleted(false);
        todo.setCreatedAt(Instant.now().toEpochMilli());
        todoDao.addTodo(todo);
        return todo;
    }

    public TodoBO updateTodo(String id, TodoBO todo) {
        todo.setId(id);
        todoDao.updateTodo(todo);
        return todo;
    }

    public void deleteTodo(String id) {
        todoDao.deleteTodo(id);
    }
}
