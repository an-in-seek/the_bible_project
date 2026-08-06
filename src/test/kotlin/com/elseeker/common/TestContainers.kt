package com.elseeker.common

import org.springframework.test.context.ActiveProfiles
import org.springframework.test.context.DynamicPropertyRegistry
import org.springframework.test.context.DynamicPropertySource
import org.testcontainers.postgresql.PostgreSQLContainer
import org.testcontainers.junit.jupiter.Testcontainers
import org.testcontainers.utility.DockerImageName

@Testcontainers
@ActiveProfiles(resolver = TestProfileResolver::class)
abstract class TestContainers {

    companion object {
        // ===== Constants =====
        private const val POSTGRESQL_IMAGE = "postgres:17"

        // reuse=true  : JVM 종료 후에도 컨테이너를 제거하지 않고 Docker에 유지한다 (재사용 목적)
        // reuse=false : JVM 종료 시 컨테이너를 자동으로 제거한다 (기본 동작)
        private const val CONTAINER_REUSE = false

        // ===== Containers =====
        // Testcontainers 2.0 의 org.testcontainers.postgresql.PostgreSQLContainer 는 비제네릭이다
        // (구 org.testcontainers.containers.PostgreSQLContainer<SELF> 는 deprecated).
        @JvmStatic
        private val postgresContainer: PostgreSQLContainer =
            PostgreSQLContainer(DockerImageName.parse(POSTGRESQL_IMAGE))
                .withDatabaseName("container")
                .withUsername("user")
                .withPassword("password")
                .withReuse(CONTAINER_REUSE)

        // ===== Container Init =====
        init {
            postgresContainer.start()
        }

        // ===== Dynamic Properties =====
        @JvmStatic
        @DynamicPropertySource
        fun overrideProps(registry: DynamicPropertyRegistry) {
            // PostgreSQL properties
            registry.add("spring.datasource.url") { postgresContainer.jdbcUrl }
            registry.add("spring.datasource.username") { postgresContainer.username }
            registry.add("spring.datasource.password") { postgresContainer.password }

        }
    }
}
