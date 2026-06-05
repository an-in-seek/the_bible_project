package com.elseeker.common.security.jwt

import com.elseeker.common.config.ElSeekerProperties
import io.github.oshai.kotlinlogging.KotlinLogging
import io.jsonwebtoken.Claims
import io.jsonwebtoken.JwtParser
import io.jsonwebtoken.Jwts
import io.jsonwebtoken.io.Decoders
import io.jsonwebtoken.security.Keys
import jakarta.servlet.http.HttpServletRequest
import org.springframework.stereotype.Component
import java.time.Instant
import java.util.*
import javax.crypto.SecretKey

/**
 * JWT 생성과 검증을 담당하는 Provider 컴포넌트입니다.
 *
 * - Access / Refresh 토큰 발급을 담당합니다.
 * - HTTP 요청으로부터 토큰을 추출합니다.
 * - 토큰 파싱 및 만료 여부를 검증합니다.
 *
 * 모든 토큰은 HMAC-SHA256 알고리즘을 사용해 서명됩니다.
 */
@Component
class JwtProvider(
    private val elSeekerProperties: ElSeekerProperties,
) {

    private val logger = KotlinLogging.logger {}

    /**
     * JWT 서명 및 검증에 사용되는 Secret Key입니다.
     */
    private val secretKey: SecretKey =
        Keys.hmacShaKeyFor(Decoders.BASE64.decode(elSeekerProperties.jwt.secret))

    /**
     * JWT 파싱을 담당하는 [JwtParser] 인스턴스입니다.
     *
     * Thread-Safe 하므로 한 번만 생성해 재사용합니다.
     */
    private val jwtParser: JwtParser = Jwts.parser()
        .verifyWith(secretKey)
        .build()

    /**
     * 액세스 토큰(JWT)을 생성합니다.
     *
     * 토큰에는 회원 식별자, 이메일, 권한 정보가 포함되며
     * 설정된 TTL 이후 자동으로 만료됩니다.
     *
     * @param memberUid 회원 UID (UUID 문자열)
     * @param email 회원 이메일
     * @param roles 회원 권한 목록
     * @return 서명된 Access Token 문자열
     */
    fun generateAccessToken(
        memberUid: String,
        email: String,
        roles: List<com.elseeker.member.domain.vo.MemberRole>,
    ): String {
        val now = Instant.now()
        val expiry = now.plusSeconds(elSeekerProperties.jwt.accessTokenTtl.seconds)

        return Jwts.builder()
            .subject(memberUid)
            .claim("email", email)
            .claim("roles", roles.map { it.name })
            .claim(TYP_CLAIM, TYP_ACCESS)
            .issuedAt(Date.from(now))
            .expiration(Date.from(expiry))
            .signWith(secretKey, Jwts.SIG.HS256)
            .compact()
    }

    /**
     * 가입 동의 대기(PENDING_CONSENT) 회원용 단기 토큰을 생성합니다.
     *
     * 일반 Access Token과 구조는 같지만 `scope = SIGNUP` 클레임을 포함하며,
     * 이 토큰으로는 동의 관련 경로 외 서비스 접근이 차단됩니다(ConsentGateFilter).
     * Refresh Token은 발급하지 않습니다.
     *
     * @param memberUid 회원 UID (UUID 문자열)
     * @param email 회원 이메일
     * @return 서명된 Signup Token 문자열
     */
    fun generateSignupToken(
        memberUid: String,
        email: String,
    ): String {
        val now = Instant.now()
        val expiry = now.plusSeconds(elSeekerProperties.jwt.signupTokenTtl.seconds)

        return Jwts.builder()
            .subject(memberUid)
            .claim("email", email)
            .claim("roles", listOf(com.elseeker.member.domain.vo.MemberRole.USER.name))
            .claim(SCOPE_CLAIM, SCOPE_SIGNUP)
            .claim(TYP_CLAIM, TYP_SIGNUP)
            .issuedAt(Date.from(now))
            .expiration(Date.from(expiry))
            .signWith(secretKey, Jwts.SIG.HS256)
            .compact()
    }

    /**
     * 리프레시 토큰(JWT)을 생성합니다.
     *
     * 리프레시 토큰은 재발급 용도로만 사용되며,
     * 사용자 식별 정보만 포함합니다.
     *
     * @param memberUid 회원 UID (UUID 문자열)
     * @return 서명된 Refresh Token 문자열
     */
    fun generateRefreshToken(memberUid: String): String {
        val now = Instant.now()
        val expiry = now.plusSeconds(elSeekerProperties.jwt.refreshTokenTtl.seconds)

        return Jwts.builder()
            .subject(memberUid)
            .claim(TYP_CLAIM, TYP_REFRESH)
            .issuedAt(Date.from(now))
            .expiration(Date.from(expiry))
            .signWith(secretKey, Jwts.SIG.HS256)
            .compact()
    }

    /**
     * HTTP 요청에서 액세스 토큰을 추출합니다.
     *
     * 우선순위는 다음과 같습니다.
     * 1. Authorization 헤더의 Bearer 토큰
     * 2. ACCESS_TOKEN 쿠키
     *
     * @param request HTTP 요청
     * @return 액세스 토큰 문자열, 없으면 null
     */
    fun resolveAccessToken(request: HttpServletRequest): String? {
        val bearerToken = request.getHeader("Authorization")
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7)
        }

        return request.cookies
            ?.firstOrNull { it.name == ACCESS_TOKEN_COOKIE_NAME }
            ?.value
    }

    /**
     * HTTP 요청의 쿠키에서 리프레시 토큰을 추출합니다.
     *
     * @param request HTTP 요청
     * @return 리프레시 토큰 문자열, 없으면 null
     */
    fun resolveRefreshToken(request: HttpServletRequest): String? {
        return request.cookies
            ?.firstOrNull { it.name == REFRESH_TOKEN_COOKIE_NAME }
            ?.value
    }

    /**
     * JWT를 파싱하고 유효성을 검증합니다.
     *
     * - 서명 검증
     * - 만료 여부 검증
     *
     * 유효하지 않거나 만료된 토큰의 경우 null을 반환합니다.
     *
     * @param token JWT 문자열
     * @return 유효한 경우 [Claims], 그렇지 않으면 null
     */
    fun resolveClaims(token: String): Claims? {
        return try {
            val claims = jwtParser.parseSignedClaims(token).payload

            if (claims.expiration.before(Date.from(Instant.now()))) {
                null
            } else {
                claims
            }
        } catch (e: Exception) {
            logger.debug { "Invalid JWT token" }
            null
        }
    }

    /**
     * 리프레시 토큰 전용 검증. 서명·만료 검증에 더해 typ=refresh 클레임을 강제합니다.
     * (Access/Signup 토큰을 Refresh 쿠키에 넣어 Access 토큰을 재발급받는 토큰 혼동 공격 차단)
     */
    fun resolveRefreshClaims(token: String): Claims? {
        val claims = resolveClaims(token) ?: return null
        return if (claims[TYP_CLAIM]?.toString() == TYP_REFRESH) claims else null
    }

    companion object {

        /**
         * 액세스 토큰이 저장되는 쿠키 이름입니다.
         */
        const val ACCESS_TOKEN_COOKIE_NAME = "ACCESS_TOKEN"

        /**
         * 리프레시 토큰이 저장되는 쿠키 이름입니다.
         */
        const val REFRESH_TOKEN_COOKIE_NAME = "REFRESH_TOKEN"

        const val TYP_CLAIM = "typ"

        const val TYP_ACCESS = "access"

        const val TYP_REFRESH = "refresh"

        const val TYP_SIGNUP = "signup"

        /**
         * 토큰 스코프 클레임 이름입니다.
         */
        const val SCOPE_CLAIM = "scope"

        /**
         * 가입 동의 대기 상태 토큰의 스코프 값입니다.
         */
        const val SCOPE_SIGNUP = "SIGNUP"
    }
}
