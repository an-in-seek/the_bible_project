package com.elseeker.common.security.oauth.repository

import com.elseeker.common.config.ElSeekerProperties
import com.elseeker.common.security.oauth.util.CookieUtils
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.security.oauth2.client.web.AuthorizationRequestRepository
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest
import org.springframework.stereotype.Component
import org.springframework.util.SerializationUtils
import java.io.ByteArrayInputStream
import java.io.ObjectInputFilter
import java.io.ObjectInputStream
import java.nio.charset.StandardCharsets
import java.security.MessageDigest
import java.util.*
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec

@Component
class HttpCookieOAuth2AuthorizationRequestRepository(
    elSeekerProperties: ElSeekerProperties,
) : AuthorizationRequestRepository<OAuth2AuthorizationRequest> {

    /**
     * OAuth2 인가 요청 쿠키의 위변조를 방지하기 위한 HMAC 서명 키입니다.
     * JWT 서명에 사용하는 시크릿을 재사용합니다.
     */
    private val signingKey: ByteArray = Base64.getDecoder().decode(elSeekerProperties.jwt.secret)

    override fun loadAuthorizationRequest(request: HttpServletRequest): OAuth2AuthorizationRequest? {
        val cookie = CookieUtils.getCookie(request, OAUTH2_AUTH_REQUEST_COOKIE_NAME) ?: return null
        return deserialize(cookie.value)
    }

    /**
     * Spring Security 7 에서 이 메서드의 파라미터는 non-null 로 바뀌었습니다(패키지가 JSpecify
     * `@NullMarked` 이며 파라미터에 `@Nullable` 이 없음). 이전 버전의 "null 을 넘겨 쿠키를 지운다"는
     * 관례가 사라졌으므로, 삭제는 [removeAuthorizationRequest] 가 전담합니다.
     */
    override fun saveAuthorizationRequest(
        authorizationRequest: OAuth2AuthorizationRequest,
        request: HttpServletRequest,
        response: HttpServletResponse,
    ) {
        val linkFlag = request.getParameter(LINK_FLAG_PARAMETER)
        val enrichedRequest = if (!linkFlag.isNullOrBlank() && linkFlag.equals("true", ignoreCase = true)) {
            OAuth2AuthorizationRequest.from(authorizationRequest)
                // attributes(Consumer) 는 전달된 맵을 제자리에서 수정하는 API 다. 복사본을 만들어
                // 반환해도 Consumer 의 반환값은 버려지므로 플래그가 유실된다.
                .attributes { attrs -> attrs[LINK_FLAG_ATTRIBUTE] = true }
                .build()
        } else {
            authorizationRequest
        }

        val serialized = serialize(enrichedRequest)
        CookieUtils.addCookie(
            response,
            OAUTH2_AUTH_REQUEST_COOKIE_NAME,
            serialized,
            COOKIE_EXPIRE_SECONDS,
            request.isSecure,
        )

        val returnUrl = request.getParameter(RETURN_URL_PARAMETER)
        if (!returnUrl.isNullOrBlank()) {
            val encodedReturnUrl = Base64.getUrlEncoder()
                .encodeToString(returnUrl.toByteArray(StandardCharsets.UTF_8))
            CookieUtils.addCookie(
                response,
                REDIRECT_URI_PARAM_COOKIE_NAME,
                encodedReturnUrl,
                COOKIE_EXPIRE_SECONDS,
                request.isSecure,
            )
        }

        if (!linkFlag.isNullOrBlank() && linkFlag.equals("true", ignoreCase = true)) {
            CookieUtils.addCookie(
                response,
                LINK_FLAG_COOKIE_NAME,
                "true",
                COOKIE_EXPIRE_SECONDS,
                request.isSecure,
            )
        }
    }

    override fun removeAuthorizationRequest(
        request: HttpServletRequest,
        response: HttpServletResponse,
    ): OAuth2AuthorizationRequest? {
        val authorizationRequest = loadAuthorizationRequest(request)
        removeAuthorizationRequestCookies(request, response)
        return authorizationRequest
    }

    fun getRedirectUriFromCookie(request: HttpServletRequest): String? {
        val cookie = CookieUtils.getCookie(request, REDIRECT_URI_PARAM_COOKIE_NAME) ?: return null
        return try {
            val decoded = Base64.getUrlDecoder().decode(cookie.value)
            String(decoded, StandardCharsets.UTF_8)
        } catch (ex: IllegalArgumentException) {
            null
        }
    }

    fun removeAuthorizationRequestCookies(
        request: HttpServletRequest,
        response: HttpServletResponse,
    ) {
        CookieUtils.deleteCookie(response, OAUTH2_AUTH_REQUEST_COOKIE_NAME, request.isSecure)
        CookieUtils.deleteCookie(response, REDIRECT_URI_PARAM_COOKIE_NAME, request.isSecure)
        CookieUtils.deleteCookie(response, LINK_FLAG_COOKIE_NAME, request.isSecure)
    }

    private fun serialize(authorizationRequest: OAuth2AuthorizationRequest): String {
        val bytes = SerializationUtils.serialize(authorizationRequest)
            ?: throw IllegalStateException("OAuth2AuthorizationRequest serialization failed.")
        // payload 와 HMAC 서명을 함께 저장하여, 복원 시 서버가 발급한 쿠키만 역직렬화하도록 한다.
        return Base64.getUrlEncoder().encodeToString(bytes) +
            SIGNATURE_SEPARATOR +
            Base64.getUrlEncoder().encodeToString(hmac(bytes))
    }

    /**
     * 쿠키 값을 [OAuth2AuthorizationRequest]로 복원합니다.
     *
     * 보안상 다음 순서를 반드시 지킵니다.
     * 1. `payload.signature` 형식을 파싱한다.
     * 2. HMAC 서명을 먼저 검증한다(위변조/구버전 쿠키는 여기서 차단).
     * 3. 서명이 일치할 때만 Java 역직렬화를 수행하되, 허용 클래스 화이트리스트를 적용한다.
     *
     * 이를 통해 공격자가 임의의 직렬화 페이로드를 쿠키로 주입해 역직렬화 가젯을 트리거하는
     * 원격 코드 실행(RCE) 위험을 차단합니다.
     */
    private fun deserialize(serialized: String): OAuth2AuthorizationRequest? {
        val separatorIndex = serialized.indexOf(SIGNATURE_SEPARATOR)
        if (separatorIndex <= 0 || separatorIndex == serialized.length - 1) {
            return null
        }

        val payload: ByteArray
        val signature: ByteArray
        try {
            payload = Base64.getUrlDecoder().decode(serialized.substring(0, separatorIndex))
            signature = Base64.getUrlDecoder().decode(serialized.substring(separatorIndex + 1))
        } catch (ex: IllegalArgumentException) {
            return null
        }

        // 서명 검증 실패 시 역직렬화 자체를 수행하지 않는다 (상수 시간 비교).
        if (!MessageDigest.isEqual(signature, hmac(payload))) {
            return null
        }

        return try {
            ByteArrayInputStream(payload).use { byteStream ->
                ObjectInputStream(byteStream).use { objectStream ->
                    // 심층 방어: 서명 검증과 별개로 허용된 클래스만 역직렬화한다.
                    objectStream.objectInputFilter = AUTH_REQUEST_INPUT_FILTER
                    objectStream.readObject() as? OAuth2AuthorizationRequest
                }
            }
        } catch (ex: Exception) {
            null
        }
    }

    /**
     * 주어진 바이트에 대한 HMAC-SHA256 서명을 계산합니다.
     */
    private fun hmac(data: ByteArray): ByteArray {
        val mac = Mac.getInstance(HMAC_ALGORITHM)
        mac.init(SecretKeySpec(signingKey, HMAC_ALGORITHM))
        return mac.doFinal(data)
    }

    companion object {
        private const val OAUTH2_AUTH_REQUEST_COOKIE_NAME = "OAUTH2_AUTH_REQUEST"
        private const val REDIRECT_URI_PARAM_COOKIE_NAME = "RETURN_URL"
        private const val RETURN_URL_PARAMETER = "returnUrl"
        const val LINK_FLAG_COOKIE_NAME = "OAUTH2_LINK"
        const val LINK_FLAG_ATTRIBUTE = "oauth_link"
        private const val LINK_FLAG_PARAMETER = "link"
        private const val COOKIE_EXPIRE_SECONDS = 180L

        /** 쿠키 위변조 방지 서명 알고리즘. */
        private const val HMAC_ALGORITHM = "HmacSHA256"

        /** `payload.signature` 구분자. */
        private const val SIGNATURE_SEPARATOR = "."

        /**
         * 역직렬화를 허용할 클래스의 패키지 접두 화이트리스트입니다.
         * [OAuth2AuthorizationRequest] 객체 그래프에 필요한 표준 타입만 허용하고,
         * 알려진 역직렬화 가젯(예: commons-collections 등)을 차단합니다.
         */
        private val ALLOWED_DESERIALIZE_PREFIXES = listOf(
            "java.",
            "javax.",
            "kotlin.",
            "org.springframework.",
        )

        /**
         * 허용 클래스만 통과시키는 역직렬화 필터. 배열은 원소 타입이 별도로 검사되므로 허용합니다.
         */
        private val AUTH_REQUEST_INPUT_FILTER = ObjectInputFilter { info ->
            val serialClass = info.serialClass()
                ?: return@ObjectInputFilter ObjectInputFilter.Status.UNDECIDED
            val name = serialClass.name
            when {
                name.startsWith("[") -> ObjectInputFilter.Status.ALLOWED
                ALLOWED_DESERIALIZE_PREFIXES.any { name.startsWith(it) } -> ObjectInputFilter.Status.ALLOWED
                else -> ObjectInputFilter.Status.REJECTED
            }
        }
    }
}
