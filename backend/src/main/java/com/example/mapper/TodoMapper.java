package com.example.mapper;

import com.example.model.TodoBO;
import com.example.model.TodoDto;
import org.mapstruct.Mapper;

import java.util.List;

@Mapper(componentModel = "spring")
public interface TodoMapper {

    TodoDto toDto(TodoBO bo);

    TodoBO toBo(TodoDto dto);

    List<TodoBO> toBoList(List<TodoDto> dtoList);
}
