package com.elseeker.auth.application.component

import com.elseeker.common.domain.ErrorType
import com.elseeker.common.domain.throwError
import com.elseeker.member.domain.vo.OAuthProvider
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier
import com.google.api.client.http.javanet.NetHttpTransport
import com.google.api.client.json.gson.GsonFactory
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.beans.factory.annotation.Value
import org.springframework.core.ParameterizedTypeReference
import org.springframework.http.client.SimpleClientHttpRequestFactory
import org.springframework.stereotype.Component
import org.springframework.web.client.RestClient
import java.time.Duration

/**
 * 소셜 로그인 토큰 검증 컴포넌트.
 *
 * 앱에서 전달받은 소셜 토큰을 각 Provider API를 통해 검증하고
 * 사용자 정보를 추출합니다.
 *
 * - Google: ID Token → google-auth-library로 로컬 JWT 검증 + audience(client ID) 확인
 * - Kakao: Access Token → User Info API 호출
 * - Naver: Access Token → User Info API 호출
 */
@Component
class SocialTokenVerifier(
    @Value("\${spring.security.oauth2.client.registration.google.client-id}")
    private val googleClientId: String,
) {

    private val logger = KotlinLogging.logger {}

    private val restClient: RestClient = RestClient.builder()
        .requestFactory(SimpleClientHttpRequestFactory().apply {
            setConnectTimeout(Duration.ofSeconds(3))
            setReadTimeout(Duration.ofSeconds(5))
        })
        .build()

    private val mapType = object : ParameterizedTypeReference<Map<String, Any>>() {}

    private val googleIdTokenVerifier: GoogleIdTokenVerifier = GoogleIdTokenVerifier.Builder(
        NetHttpTransport(), GsonFactory.getDefaultInstance()
    ).setAudience(listOf(googleClientId)).build()

    fun verify(provider: OAuthProvider, token: String): SocialUserInfo {
        return when (provider) {
            OAuthProvider.GOOGLE -> verifyGoogle(token)
            OAuthProvider.KAKAO -> verifyKakao(token)
            OAuthProvider.NAVER -> verifyNaver(token)
        }
    }

    /**
     * Google ID Token 검증.
     *
     * google-auth-library를 사용하여 로컬에서 JWT 서명과 만료를 검증하고,
     * audience(aud)가 서버의 Google Client ID와 일치하는지 확인합니다.
     * Google 공개키는 라이브러리 내부에서 캐싱됩니다.
     *
     * 주의: Android 앱에서 GoogleSignInOptions.requestIdToken() 호출 시
     * 반드시 서버(웹)의 Client ID를 serverClientId로 설정해야 합니다.
     */
    private fun verifyGoogle(idToken: String): SocialUserInfo {
        val googleIdToken = try {
            googleIdTokenVerifier.verify(idToken)
        } catch (e: Exception) {
            logger.warn(e) { "Google ID Token 검증 실패: ${e.message}" }
            null
        } ?: throwError(ErrorType.SOCIAL_LOGIN_INVALID_TOKEN, "google")

        val payload = googleIdToken.payload

        return SocialUserInfo(
            provider = OAuthProvider.GOOGLE,
            providerUserId = payload.subject
                ?: throwError(ErrorType.SOCIAL_LOGIN_INVALID_TOKEN, "google"),
            email = payload.email ?: "",
            name = payload["name"] as? String ?: "",
            imageUrl = payload["picture"] as? String,
            emailVerified = payload.emailVerified == true,
        )
    }

    /**
     * Kakao Access Token 검증.
     *
     * Kakao User Info API를 호출하여 토큰 유효성을 검증하고
     * 사용자 정보를 추출합니다.
     */
    @Suppress("UNCHECKED_CAST")
    private fun verifyKakao(accessToken: String): SocialUserInfo {
        val response = try {
            restClient.get()
                .uri("https://kapi.kakao.com/v2/user/me")
                .header("Authorization", "Bearer $accessToken")
                .retrieve()
                .body(mapType)
        } catch (e: Exception) {
            logger.warn(e) { "Kakao Access Token 검증 실패: ${e.message}" }
            throwError(ErrorType.SOCIAL_LOGIN_INVALID_TOKEN, "kakao")
        } ?: throwError(ErrorType.SOCIAL_LOGIN_INVALID_TOKEN, "kakao")

        val kakaoAccount = response["kakao_account"] as? Map<String, Any> ?: emptyMap()
        val profile = kakaoAccount["profile"] as? Map<String, Any> ?: emptyMap()

        return SocialUserInfo(
            provider = OAuthProvider.KAKAO,
            providerUserId = response["id"]?.toString()
                ?: throwError(ErrorType.SOCIAL_LOGIN_INVALID_TOKEN, "kakao"),
            email = kakaoAccount["email"] as? String ?: "",
            name = profile["nickname"] as? String ?: "",
            imageUrl = profile["profile_image_url"] as? String,
            emailVerified = (kakaoAccount["is_email_verified"] as? Boolean) == true,
        )
    }

    /**
     * Naver Access Token 검증.
     *
     * Naver User Info API를 호출하여 토큰 유효성을 검증하고
     * 사용자 정보를 추출합니다.
     */
    @Suppress("UNCHECKED_CAST")
    private fun verifyNaver(accessToken: String): SocialUserInfo {
        val response = try {
            restClient.get()
                .uri("https://openapi.naver.com/v1/nid/me")
                .header("Authorization", "Bearer $accessToken")
                .retrieve()
                .body(mapType)
        } catch (e: Exception) {
            logger.warn(e) { "Naver Access Token 검증 실패: ${e.message}" }
            throwError(ErrorType.SOCIAL_LOGIN_INVALID_TOKEN, "naver")
        } ?: throwError(ErrorType.SOCIAL_LOGIN_INVALID_TOKEN, "naver")

        val naverResponse = response["response"] as? Map<String, Any>
            ?: throwError(ErrorType.SOCIAL_LOGIN_INVALID_TOKEN, "naver")

        return SocialUserInfo(
            provider = OAuthProvider.NAVER,
            providerUserId = naverResponse["id"] as? String
                ?: throwError(ErrorType.SOCIAL_LOGIN_INVALID_TOKEN, "naver"),
            email = naverResponse["email"] as? String ?: "",
            name = naverResponse["name"] as? String
                ?: naverResponse["nickname"] as? String ?: "",
            imageUrl = naverResponse["profile_image"] as? String,
            // Naver userinfo는 이메일 인증 플래그를 제공하지 않으나, Naver 가입 시 이메일 소유 인증을 거치므로 verified로 간주.
            emailVerified = true,
        )
    }
}

data class SocialUserInfo(
    val provider: OAuthProvider,
    val providerUserId: String,
    val email: String,
    val name: String,
    val imageUrl: String?,
    /**
     * Provider가 제공하는 이메일 인증 여부.
     * 기본값을 두지 않아 모든 provider에서 명시적으로 설정하도록 강제한다(신규 provider 추가 시 무검증 자동병합 방지).
     */
    val emailVerified: Boolean,
)
