package com.elseeker.common.config

import org.springframework.boot.context.properties.ConfigurationProperties
import java.time.Duration

@ConfigurationProperties(prefix = "el-seeker")
data class ElSeekerProperties(
    val jwt: Jwt,
    val api: Api,
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
}