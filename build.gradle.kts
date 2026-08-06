plugins {
    val kotlinVersion = "2.4.10"
    kotlin("jvm") version kotlinVersion
    kotlin("plugin.spring") version kotlinVersion
    kotlin("plugin.jpa") version kotlinVersion
    id("org.springframework.boot") version "4.1.0"
    id("io.spring.dependency-management") version "1.1.7"
}

group = "com.elseeker"
version = "1.0.0"

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(25)
    }
}

repositories {
    mavenCentral()
}

val kotlinLogging = "8.0.02"
val kotestVersion = "6.2.3"
val kotlinJdslVersion = "3.9.0"
val springDocVersion = "3.0.3"
val springCloudVersion = "2025.1.2"
val springCloudGcpVersion = "8.1.0"

dependencyManagement {
    imports {
        mavenBom("org.springframework.cloud:spring-cloud-dependencies:${springCloudVersion}")
        mavenBom("com.google.cloud:spring-cloud-gcp-dependencies:${springCloudGcpVersion}")
    }
}

dependencies {
    // kotlin-logging
    implementation("io.github.oshai:kotlin-logging:${kotlinLogging}")

    // Spring Boot Framework
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-thymeleaf")
    implementation("org.springframework.boot:spring-boot-starter-security")
    implementation("org.springframework.boot:spring-boot-starter-oauth2-client")
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("org.springframework.boot:spring-boot-starter-cache")

    // Spring Cloud GCP
    implementation("com.google.cloud:spring-cloud-gcp-starter")
    implementation("com.google.cloud:spring-cloud-gcp-starter-trace")
    implementation("com.google.cloud:spring-cloud-gcp-starter-logging")

    // Local cache
    implementation("com.github.ben-manes.caffeine:caffeine")

    // Web UI/UX
    implementation("org.webjars:bootstrap:5.3.0")
    implementation("org.webjars:jquery:3.6.0")

    // i18n
    implementation("com.neovisionaries:nv-i18n:1.29")

    //
    implementation("com.fasterxml.jackson.module:jackson-module-kotlin")
    implementation("org.jetbrains.kotlin:kotlin-reflect")

    // SpringDoc
    implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:${springDocVersion}")

    // Kotlin JDSL
    implementation("com.linecorp.kotlin-jdsl:jpql-dsl:${kotlinJdslVersion}")
    implementation("com.linecorp.kotlin-jdsl:jpql-render:${kotlinJdslVersion}")
    implementation("com.linecorp.kotlin-jdsl:spring-data-jpa-support:${kotlinJdslVersion}")

    // DB
    implementation("org.postgresql:postgresql")

    // Google ID Token 검증
    implementation("com.google.api-client:google-api-client:2.7.2")

    // JWT
    implementation("io.jsonwebtoken:jjwt-api:0.12.3")
    runtimeOnly("io.jsonwebtoken:jjwt-impl:0.12.3")
    runtimeOnly("io.jsonwebtoken:jjwt-jackson:0.12.3")

    // Dev
    developmentOnly("org.springframework.boot:spring-boot-devtools")

    // Test
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.jetbrains.kotlin:kotlin-test-junit5")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")

    // Kotest
    testImplementation("io.kotest:kotest-runner-junit5:${kotestVersion}")
    testImplementation("io.kotest:kotest-assertions-core:${kotestVersion}")
    testImplementation("io.kotest:kotest-framework-engine:${kotestVersion}")

    // MockK (Kotlin 친화 모킹 — Docker 불필요 단위 테스트용)
    testImplementation("io.mockk:mockk:1.13.13")

    // testcontainers
    testImplementation("org.springframework.boot:spring-boot-testcontainers")
    testImplementation("org.testcontainers:junit-jupiter")
    testImplementation("org.testcontainers:postgresql")
}

configurations.all {
    exclude(group = "commons-logging", module = "commons-logging")
}

kotlin {
    compilerOptions {
        freeCompilerArgs.addAll("-Xjsr305=strict")
    }
}

allOpen {
    annotation("jakarta.persistence.Entity")
    annotation("jakarta.persistence.MappedSuperclass")
    annotation("jakarta.persistence.Embeddable")
}

tasks.withType<Test> {
    useJUnitPlatform()
}
