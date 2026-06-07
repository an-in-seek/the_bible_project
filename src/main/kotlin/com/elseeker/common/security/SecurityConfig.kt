package com.elseeker.common.security

import com.elseeker.common.config.ElSeekerProperties
import com.elseeker.common.security.jwt.ConsentGateFilter
import com.elseeker.common.security.jwt.JwtAuthenticationFilter
import com.elseeker.common.security.jwt.JwtRefreshFilter
import com.elseeker.common.security.oauth.handler.OAuth2LoginFailureHandler
import com.elseeker.common.security.oauth.handler.OAuth2LoginSuccessHandler
import com.elseeker.common.security.oauth.repository.HttpCookieOAuth2AuthorizationRequestRepository
import com.elseeker.common.security.oauth.service.CustomOAuth2UserService
import jakarta.servlet.http.HttpServletRequest
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.http.HttpStatus
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.config.http.SessionCreationPolicy
import org.springframework.security.web.SecurityFilterChain
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter
import org.springframework.web.cors.CorsConfiguration
import org.springframework.web.cors.CorsConfigurationSource
import org.springframework.web.cors.UrlBasedCorsConfigurationSource
import java.net.URLEncoder
import java.nio.charset.StandardCharsets

/**
 * Spring Security 전반 설정을 담당하는 설정 클래스입니다.
 *
 * JWT 기반 인증과 OAuth2 로그인을 결합한 무상태(stateless) 보안 구성을 정의하며,
 * API 요청과 SSR(Web) 요청에 대해 서로 다른 인증·예외 처리 전략을 적용합니다.
 */
@Configuration
@EnableWebSecurity
class SecurityConfig(
    private val customOAuth2UserService: CustomOAuth2UserService,
    private val oAuth2LoginSuccessHandler: OAuth2LoginSuccessHandler,
    private val oAuth2LoginFailureHandler: OAuth2LoginFailureHandler,
    private val authorizationRequestRepository: HttpCookieOAuth2AuthorizationRequestRepository,
    private val jwtAuthenticationFilter: JwtAuthenticationFilter,
    private val jwtRefreshFilter: JwtRefreshFilter,
    private val consentGateFilter: ConsentGateFilter,
    private val elSeekerProperties: ElSeekerProperties,
) {

    /**
     * Spring Security 필터 체인을 구성합니다.
     *
     * - CSRF, Form Login, HTTP Basic 인증을 비활성화합니다.
     * - JWT 기반 무상태 인증을 사용합니다.
     * - OAuth2 로그인 플로우를 설정합니다.
     * - API 요청과 SSR 페이지 요청에 대해 서로 다른 예외 처리 방식을 적용합니다.
     */
    @Bean
    fun securityFilterChain(http: HttpSecurity): SecurityFilterChain {
        http
            // CSRF 비활성화 (JWT 기반 인증 환경)
            .csrf { it.disable() }

            // 기본 인증 방식 비활성화 (API 서버 용도)
            .httpBasic { it.disable() }
            .formLogin { it.disable() }

            // Spring Security 기본 Cache-Control 헤더 비활성화 (불변 API에 브라우저 캐시 허용)
            .headers { headers ->
                headers.cacheControl { it.disable() }
            }

            // CORS 설정 적용
            .cors { it.configurationSource(corsConfigurationSource()) }

            // 세션을 사용하지 않는 무상태 인증 정책
            .sessionManagement {
                it.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            }

            // 요청 URL별 접근 권한 설정
            .authorizeHttpRequests { auth ->
                auth
                    // 관리자 전용 페이지 및 API
                    .requestMatchers("/web/admin/**", "/api/v1/admin/**").hasRole("ADMIN")
                    .requestMatchers(
                        "/api/v1/bibles/translations/{translationId}/books/{bookOrder}/chapters/{chapterNumber}/memos",
                        "/api/v1/bibles/translations/{translationId}/books/{bookOrder}/chapters/{chapterNumber}/verses/{verseNumber}/memo",
                        "/api/v1/bibles/translations/{translationId}/books/{bookOrder}/chapters/{chapterNumber}/highlights",
                        "/api/v1/bibles/translations/{translationId}/books/{bookOrder}/chapters/{chapterNumber}/verses/{verseNumber}/highlight",
                        "/api/v1/bibles/translations/{translationId}/books/{bookOrder}/chapters/{chapterNumber}/state",
                        "/api/v1/bibles/translations/{translationId}/books/{bookOrder}/chapters/{chapterNumber}/chapter-memo",
                        "/api/v1/bibles/translations/{translationId}/books/{bookOrder}/book-memo",
                        "/api/v1/bibles/my-memos/**",
                        "/api/v1/bibles/my-book-memos/**",
                        "/api/v1/bibles/my-chapter-memos/**",
                        "/api/v1/bibles/my-memo-counts"
                    ).authenticated()
                    .requestMatchers(
                        "/",
                        "/error",
                        "/oauth2/**",
                        "/web/auth/login",
                        "/web/auth/login/**",
                        "/web/auth/logout",
                        "/web/auth/logout/**",
                        "/web/game",
                        "/web/game/ranking",
                        "/api/v1/game/ranking",
                        "/api/v1/bibles/**",
                        "/api/v1/study/dictionaries/**",
                        "/api/v1/auth/refresh",
                        "/api/v1/auth/reissue",
                        "/api/v1/auth/social-login"
                    ).permitAll()
                    .requestMatchers(
                        org.springframework.http.HttpMethod.GET,
                        "/api/v1/community/posts",
                        "/api/v1/community/posts/top",
                        "/api/v1/community/posts/{postId}",
                        "/api/v1/community/posts/{postId}/comments"
                    ).permitAll()
                    .requestMatchers(
                        "/api/v1/auth/me",
                        "/api/v1/auth/consent",
                        "/api/v1/auth/consent/cancel",
                        "/api/v1/members/**",
                        "/api/v1/game/bible-quiz/**",
                        "/api/v1/game/ranking/me",
                        "/api/v1/bible/reading/**",
                        "/api/v1/qna/**"
                    ).authenticated()
                    // 게임 관련 페이지는 서버 단에서 인증을 강제
                    .requestMatchers(
                        "/web/game/**",
                        "/game/**",
                    ).authenticated()
                    // 커뮤니티 글쓰기 페이지는 인증 필수
                    .requestMatchers("/web/community/write").authenticated()
                    // 정적 리소스
                    .requestMatchers(
                        "/favicon.ico",
                        "/robots.txt",
                        "/sitemap.xml",
                        "/css/**",
                        "/js/**",
                        "/images/**",
                        "/webjars/**",
                    ).permitAll()
                    // 공개 SSR 페이지
                    .requestMatchers("/web/**").permitAll()
                    .anyRequest().authenticated()
            }

            // OAuth2 로그인 설정
            .oauth2Login { oauth2 ->
                oauth2.authorizationEndpoint { authorizationEndpoint ->
                    authorizationEndpoint.authorizationRequestRepository(authorizationRequestRepository)
                }
                oauth2.userInfoEndpoint { userInfo ->
                    userInfo.userService(customOAuth2UserService)
                }
                oauth2.successHandler(oAuth2LoginSuccessHandler)
                oauth2.failureHandler(oAuth2LoginFailureHandler)
            }

            // JWT 관련 필터를 UsernamePasswordAuthenticationFilter 앞단에 등록
            .addFilterBefore(jwtRefreshFilter, UsernamePasswordAuthenticationFilter::class.java)
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter::class.java)
            // 인증 직후, 가입 동의 대기(SIGNUP) 회원의 비허용 경로 접근 차단
            .addFilterAfter(consentGateFilter, JwtAuthenticationFilter::class.java)

            // 인증 예외 처리 (SSR 페이지는 로그인으로, API는 401을 반환)
            .exceptionHandling {
                it.authenticationEntryPoint { request, response, _ ->
                    val acceptHeader = request.getHeader("Accept").orEmpty()
                    val isHtmlRequest = acceptHeader.contains("text/html")
                    if (isHtmlRequest && request.requestURI.startsWith("/web/")) {
                        val returnUrl = URLEncoder.encode(buildReturnUrl(request), StandardCharsets.UTF_8)
                        response.sendRedirect("/web/auth/login?returnUrl=$returnUrl")
                    } else {
                        response.sendError(HttpStatus.UNAUTHORIZED.value())
                    }
                }
                it.accessDeniedHandler { request, response, _ ->
                    val acceptHeader = request.getHeader("Accept").orEmpty()
                    val isHtmlRequest = acceptHeader.contains("text/html")
                    if (isHtmlRequest) {
                        response.sendError(HttpStatus.FORBIDDEN.value())
                    } else {
                        response.status = HttpStatus.FORBIDDEN.value()
                        response.contentType = "application/json"
                        response.writer.write("""{"status":403,"message":"관리자 권한이 필요합니다."}""")
                    }
                }
            }

        return http.build()
    }

    /**
     * 로그인 성공 후 복귀를 위해 현재 요청 URL을 생성합니다.
     *
     * @param request 현재 HTTP 요청
     * @return 쿼리 스트링을 포함한 요청 URI
     */
    private fun buildReturnUrl(request: HttpServletRequest): String {
        val query = request.queryString?.let { "?$it" }.orEmpty()
        return "${request.requestURI}$query"
    }

    /**
     * CORS 설정을 위한 [CorsConfigurationSource] 빈을 생성합니다.
     *
     * - 허용 Origin은 설정 파일에 정의된 API Base URL을 기준으로 합니다.
     * - 쿠키 기반 리프레시 토큰 전송을 위해 credentials를 허용합니다.
     */
    @Bean
    fun corsConfigurationSource(): CorsConfigurationSource {
        val configuration = CorsConfiguration().apply {
            allowedOrigins = listOf(elSeekerProperties.api.baseUrl)
            allowedMethods = listOf("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
            allowedHeaders = listOf("*")
            allowCredentials = true
        }

        return UrlBasedCorsConfigurationSource().apply {
            registerCorsConfiguration("/**", configuration)
        }
    }
}
