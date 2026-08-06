# el_seeker (the_bible_project) 통합 Dockerfile — 하나의 파일이 두 가지 빌드 흐름을 지원한다.
#   runtime (기본)   : 컨테이너 안에서 Gradle 빌드까지 수행 (로컬/자체 빌드)
#   runtime-prebuilt : 워크스페이스의 build/libs jar 만 조립 (Cloud Build용, Gradle 미실행)
#
# 이미지는 프로파일 중립이다. SPRING_PROFILES_ACTIVE 를 런타임에 주입한다
# (Cloud Run 은 Deploy 단계의 --update-env-vars, docker run 은 -e).
# application.yml 에 기본 프로파일이 없으므로 미지정 시 datasource 설정이 비어 기동에 실패한다 —
# 잘못된 프로파일로 조용히 뜨는 대신 즉시 드러난다.
#
# 예) 로컬 self-contained 빌드 (기본 타깃)
#   docker build -t el-seeker:local .
#   docker run -e SPRING_PROFILES_ACTIVE=prod -e JWT_SECRET_BASE64=... \
#     -e DB_HOST=... -e DB_PORT=5432 -e DB_NAME=... -e DB_USER=... -e DB_PASSWORD=... \
#     -p 8080:8080 el-seeker:local
#
# 예) CI (gradle 스텝에서 jar 를 먼저 만든 뒤)
#   docker build --target runtime-prebuilt -t el-seeker:prod .
#
# ⚠️ BuildKit(DOCKER_BUILDKIT=1) 필수. 레거시 빌더는 --target 과 무관하게 모든 스테이지를 빌드하므로
#    CI 에서도 builder 의 Gradle 컴파일이 돌아 통합의 이점(중복 컴파일 제거)이 사라진다.
#    cloudbuild.yaml 의 Build 스텝은 DOCKER_BUILDKIT=1 을 지정하고 있다.

# jar 이름은 settings.gradle.kts 의 rootProject.name(el_seeker)과 build.gradle.kts 의 version(1.0.0)에서 나온다.
# 둘 중 하나를 바꾸면 이 기본값도 함께 바꾸거나 --build-arg JAR_NAME=... 으로 넘긴다.
ARG JAR_NAME=el_seeker-1.0.0.jar

# 📌 빌더: 소스에서 Gradle 빌드 (기본 타깃에서만 사용 — runtime-prebuilt 는 이 스테이지를 건너뛴다)
#
# build.gradle.kts 의 toolchain(Java 25)과 Spring Boot 4.1 / Kotlin 2.4 요구사항에 맞춘 태그다.
# 이미지에 Gradle 9.6.1 이 동봉되어 있으므로 wrapper 대신 이미지의 gradle 을 쓴다(배포판 중복 다운로드 회피).
# ⚠️ 이 태그를 올릴 때는 gradle/wrapper/gradle-wrapper.properties 도 함께 맞춰야 로컬과 CI 가 같은 Gradle 로 빌드된다.
FROM gradle:9.6.1-jdk25-corretto AS builder

WORKDIR /app
ENV GRADLE_OPTS="-Xmx4096m -Dorg.gradle.daemon=false -Dorg.gradle.workers.max=4 -Dorg.gradle.parallel=true"

# 현재 디렉터리의 모든 파일을 컨테이너로 복사
COPY ./ ./

# 의존성은 전부 mavenCentral 에서 받으므로 사설 저장소 자격증명이 필요 없다.
# - build -x test : 컴파일 및 패키징 (테스트 제외)
#   통합 테스트는 Testcontainers(PostgreSQL 17)를 띄우므로 이미지 빌드 중에는 실행하지 않는다.
#   테스트는 CI(cloudbuild.yaml 의 BuildAndTest 스텝)나 로컬에서 돌린다.
# - --no-daemon   : 데몬 비활성화로 컨테이너 리소스 최소화
RUN gradle build -x test --no-daemon

# 📌 공통 런타임 베이스
#
# headless 변형은 풀 이미지 대비 작다(약 100MB). java.desktop 모듈과 libawt / libawt_headless /
# libfontmanager, DejaVu·Noto 폰트가 그대로 있어 ImageIO·Graphics2D 가 동작하며,
# 빠지는 것은 X11 백엔드뿐이라 서버 프로세스에는 영향이 없다.
FROM amazoncorretto:25-al2023-headless AS runtime-base

# 컨테이너에서 사용할 포트 (application.yml 의 server.port 와 동일, Cloud Run 기본 PORT 와도 일치)
EXPOSE 8080

# 아래 레이어들이 모두 이 경로로 평탄하게 합쳐진다 (app.jar + lib/).
WORKDIR /application

# 보안: root 가 아닌 nobody 계정으로 실행
USER nobody

# java 를 PID 1 로 직접 실행하여 시그널이 정상 전달되도록 한다.
# ENTRYPOINT 가 아닌 CMD 를 쓰는 이유는 실행 시 오버라이드/디버깅이 쉽기 때문이다.
# app.jar 는 fat jar 가 아니라 thin jar 다. 매니페스트의 Class-Path 가 같은 디렉터리의 lib/ 를
# 가리키므로 WORKDIR 기준 상대 경로로 실행한다.
#
# --enable-native-access=ALL-UNNAMED (JEP 472): spring-cloud-gcp-starter-trace 가 끌고 오는
# gRPC/netty 등이 네이티브 라이브러리를 로드한다. JDK 25 기본값인 --illegal-native-access=warn
# 에서는 기동 로그에 경고만 남지만, deny 로 전환되면 IllegalCallerException 으로 기동이 실패한다.
#
# -XX:MaxRAMPercentage=75.0 : Cloud Run 의 컨테이너 메모리 한도에 힙을 비례시킨다.
#   (기본값 25% 는 인스턴스 메모리를 3/4 놀린다)
CMD [ \
  "java", \
  "-XX:MaxRAMPercentage=75.0", \
  "-Dsun.net.inetaddr.ttl=0", \
  "-Duser.timezone=Asia/Seoul", \
  "--enable-native-access=ALL-UNNAMED", \
  "-jar", \
  "app.jar" \
]

# 📌 레이어 추출
#
# fat jar 를 통째로 COPY 하면 jar 전체가 단일 레이어가 되어, 코드 한 줄만 바뀌어도 매 배포마다
# 그 전량을 push/pull 한다. bootJar 산출물의 BOOT-INF/layers.idx 를 이용해 변경 빈도별로 쪼갠다.
#   dependencies(의존성 선언 변경 시) / application(커밋마다)
#
# 아래 runtime 스테이지의 COPY 는 변경 빈도가 낮은 순이어야 한다. 순서를 뒤집으면 뒤쪽 레이어가
# 앞쪽을 무효화해 분리한 의미가 사라진다.
# 레지스트리는 원래 다이제스트가 같은 레이어를 올리지 않으므로 --cache-from 은 필요 없다.
FROM amazoncorretto:25-al2023-headless AS extractor-prebuilt
ARG JAR_NAME
WORKDIR /extract
COPY build/libs/${JAR_NAME} app.jar
RUN java -Djarmode=tools -jar app.jar extract --layers --destination extracted

FROM amazoncorretto:25-al2023-headless AS extractor-source
ARG JAR_NAME
WORKDIR /extract
COPY --from=builder /app/build/libs/${JAR_NAME} app.jar
RUN java -Djarmode=tools -jar app.jar extract --layers --destination extracted

# 📌 Cloud Build 용 (--target runtime-prebuilt). builder 를 건너뛰므로 컨테이너 안에서 Gradle 이 돌지 않는다.
FROM runtime-base AS runtime-prebuilt
COPY --from=extractor-prebuilt /extract/extracted/dependencies/ ./
COPY --from=extractor-prebuilt /extract/extracted/spring-boot-loader/ ./
COPY --from=extractor-prebuilt /extract/extracted/snapshot-dependencies/ ./
COPY --from=extractor-prebuilt /extract/extracted/application/ ./

# 📌 기본 타깃(소스 빌드): builder 산출물을 조립한다
FROM runtime-base AS runtime
COPY --from=extractor-source /extract/extracted/dependencies/ ./
COPY --from=extractor-source /extract/extracted/spring-boot-loader/ ./
COPY --from=extractor-source /extract/extracted/snapshot-dependencies/ ./
COPY --from=extractor-source /extract/extracted/application/ ./
