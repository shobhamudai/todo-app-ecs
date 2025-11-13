package com.example.controller;

import com.example.model.TodoBO;
import com.example.service.TodoService;
import lombok.extern.log4j.Log4j2;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Log4j2
@RestController
@RequestMapping("/api/todos")
public class TodoController {

    private final TodoService todoService;

    public TodoController(TodoService todoService) {
        this.todoService = todoService;
    }

    @GetMapping
    public ResponseEntity<List<TodoBO>> getAllTodos() {
        log.info("Controller: Received request to get all todos.");
        return ResponseEntity.ok(todoService.getAllTodos());
    }

    @PostMapping
    public ResponseEntity<TodoBO> addTodo(@RequestBody TodoBO todo) {
        log.info("Controller: Received request to add a new todo.");
        TodoBO createdTodo = todoService.addTodo(todo);
        log.info("Controller: Successfully created todo with id [{}].", createdTodo.getId());
        return new ResponseEntity<>(createdTodo, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TodoBO> updateTodo(@PathVariable String id, @RequestBody TodoBO todo) {
        log.info("Controller: Received request to update todo with id [{}].", id);
        return ResponseEntity.ok(todoService.updateTodo(id, todo));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTodo(@PathVariable String id) {
        log.info("Controller: Received request to delete todo with id [{}].", id);
        todoService.deleteTodo(id);
        log.info("Controller: Successfully deleted todo with id [{}].", id);
        return ResponseEntity.noContent().build();
    }
}
