package com.example.config;

import com.example.mapper.TodoMapper;
import org.mapstruct.factory.Mappers;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MapperConfig {

    /**
     * Creates a Spring-managed bean for the TodoMapper interface.
     * This allows the mapper to be injected into other components like the TodoDao.
     * @return An implementation of the TodoMapper.
     */
    @Bean
    public TodoMapper todoMapper() {
        return Mappers.getMapper(TodoMapper.class);
    }
}
