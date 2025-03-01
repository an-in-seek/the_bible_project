package com.seek.thebible.infrastructure.config

import io.swagger.v3.oas.models.OpenAPI
import io.swagger.v3.oas.models.info.Info
import io.swagger.v3.oas.models.servers.Server
import org.springdoc.core.models.GroupedOpenApi
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class SwaggerConfig(
    private val theBibleApiProperties: TheBibleApiProperties
) {

    @Bean
    fun apiDocumentation(): OpenAPI {
        return OpenAPI()
            .info(
                Info()
                    .title("The Bible API Swagger")
                    .description("The Bible API Swagger Documentation")
                    .version("1.0")
            )
            .servers(
                listOf<Server>(
                    Server()
                        .url(theBibleApiProperties.url)
                        .description("Default API Server")
                )
            )
    }


    @Bean
    fun apiGroupConfiguration(): GroupedOpenApi {
        return GroupedOpenApi.builder()
            .group("api")
            .pathsToMatch("/bibles/**")  // ✅ RESTful API 경로에 맞게 수정
            .packagesToScan("com.seek.thebible")  // ✅ 패키지 기반 스캔
            .build()
    }
}