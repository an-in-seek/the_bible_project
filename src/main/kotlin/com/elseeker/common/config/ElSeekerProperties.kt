package com.elseeker.common.config

import org.springframework.boot.context.properties.ConfigurationProperties
import java.time.Duration

@ConfigurationProperties(prefix = "el-seeker")
data class ElSeekerProperties(
    val jwt: Jwt,
    val api: Api,
    /** Apple 로그인 설정. 미설정 시 Apple 로그인만 비활성화되고 나머지 기능은 정상 동작한다. */
    val apple: Apple? = null,
) {

    data class Jwt(
        val secret: String,
        val accessTokenTtl: Duration,
        val refreshTokenTtl: Duration,
        /** 가입 동의 대기(PENDING_CONSENT) 회원에게 발급하는 단기 토큰 TTL. */
        val signupTokenTtl: Duration = Duration.ofMinutes(30),
        /** null이면 요청의 isSecure를 따르고, 설정 시 강제합니다(운영=true 권장). */
        val cookieSecure: Boolean? = null
    )

    data class Api(
        val baseUrl: String,
        val apiKey: String
    )

    /**
     * Apple 로그인(Sign in with Apple) 설정.
     *
     * Apple 은 고정 문자열 client_secret 을 쓰지 않고, 개발자 키로 서명한 **ES256 JWT** 를
     * client_secret 으로 요구한다. 아래 값들은 Apple Developer 콘솔에서 발급받는다.
     */
    data class Apple(
        /** Services ID. 웹 OAuth 의 `client_id` 로 쓰인다 (App ID 인 `com.elseeker.ios` 와 다른 값). */
        val clientId: String,
        /** Apple Developer 팀 ID (10자). client_secret JWT 의 `iss`. */
        val teamId: String,
        /** 개인키(.p8)의 Key ID (10자). client_secret JWT 헤더의 `kid`. */
        val keyId: String,
        /** `.p8` 파일 내용(PEM). PEM 헤더/개행이 포함돼 있어도 된다. */
        val privateKey: String,
    )
}