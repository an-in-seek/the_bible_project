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
val jjwtVersion = "0.12.3"

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

    // Jackson — 런타임 JSON 은 Jackson 3, springdoc 스키마 생성은 Jackson 2 로 이원화되어 있다.
    // 두 스택이 각자의 코틀린 모듈을 필요로 하므로 둘 다 선언한다. 자세한 내용은 tech-stack.md 참고.
    //
    // ⚠️ Spring Boot 4 의 HTTP 메시지 컨버터는 Jackson 3(tools.jackson) 을 쓴다. Jackson 2 좌표
    // (com.fasterxml.jackson.module)의 kotlin 모듈은 Jackson 3 매퍼에 등록되지 않으므로 이것만 두면
    // 코틀린 인식이 통째로 빠진다. 그러면 `val isCorrect: Boolean` 의 게터가 자바빈 규칙으로 해석되어
    // JSON 키가 "correct" 로 나가고, isXxx 를 읽는 프런트엔드가 전부 undefined 를 받는다.
    // JacksonAutoConfiguration 이 findAndAddModules() 로 ServiceLoader 등록분을 자동으로 붙이므로
    // 클래스패스에 올리는 것 외의 설정은 필요 없다.
    implementation("tools.jackson.module:jackson-module-kotlin")
    // springdoc 은 swagger-core 와 함께 여전히 Jackson 2 를 쓴다.
    // SpringDocJacksonKotlinModuleConfiguration 이 @ConditionalOnClass(KotlinModule) 로 이 모듈을
    // 자기 ObjectMapper 에 등록한다. 빼면 Swagger 스키마의 프로퍼티명만 조용히 어긋난다.
    implementation("com.fasterxml.jackson.module:jackson-module-kotlin")
    implementation("org.jetbrains.kotlin:kotlin-reflect")

    // SpringDoc
    implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:${springDocVersion}")

    // Kotlin JDSL
    implementation("com.linecorp.kotlin-jdsl:jpql-dsl:${kotlinJdslVersion}")
    implementation("com.linecorp.kotlin-jdsl:jpql-render:${kotlinJdslVersion}")
    // ⚠️ spring-data-jpa-support 가 아니라 -boot4- 변형을 써야 한다.
    // 전자의 QueryEnhancerFactoryAdaptor 는 Spring Data JPA 4 에서 삭제된 StringQuery 를 참조하므로
    // 컴파일은 통과하고 findSlice/findPage 호출 시점에 NoClassDefFoundError 로 터진다.
    // boot4 변형은 대체 API(QueryEnhancerFactories, QueryProvider)를 참조한다.
    implementation("com.linecorp.kotlin-jdsl:spring-data-jpa-boot4-support:${kotlinJdslVersion}")

    // DB
    implementation("org.postgresql:postgresql")

    // Google ID Token 검증
    implementation("com.google.api-client:google-api-client:2.7.2")

    // JWT
    implementation("io.jsonwebtoken:jjwt-api:${jjwtVersion}")
    runtimeOnly("io.jsonwebtoken:jjwt-impl:${jjwtVersion}")
    runtimeOnly("io.jsonwebtoken:jjwt-jackson:${jjwtVersion}")

    // Dev
    developmentOnly("org.springframework.boot:spring-boot-devtools")

    // Test
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    // Spring Boot 4 는 MockMvc 테스트 지원을 기술별 모듈로 분리했다. @AutoConfigureMockMvc 는
    // 더 이상 spring-boot-test-autoconfigure 에 없고 이 모듈에 들어 있다.
    testImplementation("org.springframework.boot:spring-boot-starter-webmvc-test")
    testImplementation("org.jetbrains.kotlin:kotlin-test-junit5")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")

    // Kotest
    testImplementation("io.kotest:kotest-runner-junit5:${kotestVersion}")
    testImplementation("io.kotest:kotest-assertions-core:${kotestVersion}")
    testImplementation("io.kotest:kotest-framework-engine:${kotestVersion}")

    // MockK (Kotlin 친화 모킹 — Docker 불필요 단위 테스트용)
    testImplementation("io.mockk:mockk:1.13.13")

    // testcontainers
    // Spring Boot 4.1 은 testcontainers-bom 2.0.x 를 가져온다. Testcontainers 2.0 에서 모든 모듈
    // 아티팩트명에 testcontainers- 접두사가 붙어(junit-jupiter -> testcontainers-junit-jupiter)
    // 예전 좌표는 BOM 에 없고 버전이 비어 해석에 실패한다.
    testImplementation("org.springframework.boot:spring-boot-testcontainers")
    testImplementation("org.testcontainers:testcontainers-junit-jupiter")
    testImplementation("org.testcontainers:testcontainers-postgresql")
}

// ⚠️ commons-logging 을 제외하지 말 것.
// Spring Framework 6 까지는 spring-jcl 이 org.apache.commons.logging.Log/LogFactory 를 대신 제공했기에
// 중복을 피하려 commons-logging 을 제외하는 것이 관용구였다. Spring Framework 7 에서 spring-jcl 이
// 제거되고 실제 commons-logging 아티팩트를 직접 의존하도록 바뀌었으므로, 지금 제외하면 JCL API 의
// 유일한 공급원이 사라져 Spring 이 NoClassDefFoundError: org/apache/commons/logging/Log 로 죽는다.

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
