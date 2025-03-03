FROM gradle:8.4-jdk17-alpine as builder

# Copy local code to the container image.
WORKDIR /app

ENV HOST 0.0.0.0

COPY ./ ./

# Build a release artifact.
RUN gradle clean build -x test --no-daemon

# https://hub.docker.com/_/eclipse-temurin
FROM eclipse-temurin:17.0.9_9-jdk-alpine

# 빌더 이미지에서 jar 파일만 복사
COPY --from=builder /app/build/libs/the_bible-1.0.0.jar /app.jar

EXPOSE 8091

# root 대신 nobody 권한으로 실행
# 장점: 최소한의 권한으로 프로세스를 실행하면 악의적인 행위자의 잠재적인 공격 표면이 줄어듬, 공격자가 'nobody'로 실행되는 프로세스에 대한 액세스 권한을 얻으면 루트로 실행되는 프로세스에 비해 악용할 수 있는 권한이 더 적음
USER nobody

# Run the web service on container startup.
CMD [ \
  "java",  \
  "-jar", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-Dsun.net.inetaddr.ttl=0",  \
  "-Duser.timezone=Asia/Seoul", \
  "-Dspring.profiles.active=prod", \
  "/app.jar" \
]