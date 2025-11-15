package com.example.controller;

import com.example.model.TodoBO;
import com.example.service.TodoService;
import lombok.extern.log4j.Log4j2;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
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

    // FIX: This is now the primary GET endpoint and requires authentication
    @GetMapping
    public ResponseEntity<List<TodoBO>> getTodosForUser(@AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        log.info("Controller: Received request to get todos for user [{}].", userId);
        return ResponseEntity.ok(todoService.getTodosForUser(userId));
    }

    @PostMapping
    public ResponseEntity<TodoBO> addTodo(@AuthenticationPrincipal Jwt jwt, @RequestBody TodoBO todo) {
        String userId = jwt.getSubject();
        log.info("Controller: Received request to add a new todo for user [{}].", userId);
        TodoBO createdTodo = todoService.addTodoForUser(todo, userId);
        log.info("Controller: Successfully created todo with id [{}] for user [{}].", createdTodo.getId(), userId);
        return new ResponseEntity<>(createdTodo, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TodoBO> updateTodo(@AuthenticationPrincipal Jwt jwt, @PathVariable String id, @RequestBody TodoBO todo) {
        String userId = jwt.getSubject();
        log.info("Controller: Received request to update todo with id [{}] for user [{}].", id, userId);
        return ResponseEntity.ok(todoService.updateTodo(id, todo, userId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTodo(@AuthenticationPrincipal Jwt jwt, @PathVariable String id) {
        String userId = jwt.getSubject();
        log.info("Controller: Received request to delete todo with id [{}] for user [{}].", id, userId);
        todoService.deleteTodo(id, userId);
        log.info("Controller: Successfully deleted todo with id [{}] for user [{}].", id, userId);
        return ResponseEntity.noContent().build();
    }
}
