package com.retailflow.backend.config;

import io.swagger.v3.oas.models.ExternalDocumentation;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI retailFlowOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("RetailFlow SaaS POS API")
                        .description("Enterprise multi-tenant POS backend built with Spring Boot 3")
                        .version("v1.0.0")
                        .contact(new Contact()
                                .name("Zvezdan Damjanic"))
                        .license(new License()
                                .name("MIT")))
                .externalDocs(new ExternalDocumentation()
                        .description("RetailFlow Documentation"));
    }
}
