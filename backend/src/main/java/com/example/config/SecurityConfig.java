package com.example.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.web.SecurityFilterChain;

import static org.springframework.security.config.Customizer.withDefaults;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    // Inject the issuer URI from the environment variable
    @Value("${SPRING_SECURITY_OAUTH2_RESOURCESERVER_JWT_ISSUER_URI}")
    private String issuerUri;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(authorize -> authorize
                        // FIX: Only allow anonymous access to the public GET endpoint
                        .requestMatchers(HttpMethod.GET, "/api/todos/public").permitAll()
                        // Allow health checks
                        .requestMatchers("/actuator/**").permitAll()
                        // Require authentication for all other requests
                        .anyRequest().authenticated()
                )
                .oauth2ResourceServer(oauth2 -> oauth2.jwt(withDefaults()));
        return http.build();
    }

    // FIX: Explicitly define the JwtDecoder bean to solve the startup failure.
    @Bean
    public JwtDecoder jwtDecoder() {
        // The .well-known/jwks.json endpoint is a standard part of OIDC providers like Cognito
        return NimbusJwtDecoder.withJwkSetUri(this.issuerUri + "/.well-known/jwks.json").build();
    }
}