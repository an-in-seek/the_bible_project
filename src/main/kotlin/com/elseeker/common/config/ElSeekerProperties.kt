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
        /**
         * 서버-대-서버 알림 JWT 의 `aud` 로 허용할 값 목록.
         *
         * 알림 엔드포인트는 **primary App ID 에만** 등록할 수 있어, Apple 이 보내는 `aud` 가
         * 웹 로그인용 Services ID([clientId]) 가 아니라 App ID(예: `com.elseeker.ios`)일 수 있다.
         * 비워 두면 [clientId] 하나만 허용한다. 실제 값이 다르면 검증 실패 로그에 수신한 `aud`
         * 가 찍히므로, 그 값을 이 목록에 추가하면 된다.
         */
        val notificationAudiences: List<String> = emptyList(),
        /**
         * Apple 공개키(JWKS) 엔드포인트. id_token 및 서버-대-서버 알림의 서명 검증에 쓴다.
         *
         * 운영에서 바꿀 일은 없다. **테스트에서 WireMock 으로 돌려 실제 네트워크를 끊기 위해**
         * 설정 가능하게 두었다.
         */
        val jwkSetUri: String = "https://appleid.apple.com/auth/keys",
    )
}