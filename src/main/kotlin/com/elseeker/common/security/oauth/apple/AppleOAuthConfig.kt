package com.elseeker.common.security.oauth.apple

import com.elseeker.member.domain.vo.OAuthProvider
import org.springframework.boot.security.oauth2.client.autoconfigure.OAuth2ClientProperties
import org.springframework.boot.security.oauth2.client.autoconfigure.OAuth2ClientPropertiesMapper
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.oauth2.client.registration.ClientRegistration
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository
import org.springframework.security.oauth2.client.registration.InMemoryClientRegistrationRepository
import org.springframework.security.oauth2.client.web.DefaultOAuth2AuthorizationRequestResolver
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestRedirectFilter
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestResolver
import org.springframework.security.oauth2.core.endpoint.OAuth2ParameterNames

/**
 * Apple 로그인만을 위한 OAuth2 클라이언트 설정.
 *
 * Apple 은 표준 OAuth2 에서 두 가지가 다르고, 각각을 여기서 흡수한다.
 * 1. `client_secret` 이 고정 문자열이 아니라 **매번 서명하는 ES256 JWT** → [clientRegistrationRepository]
 * 2. `email`/`name` scope 를 쓰면 **`response_mode=form_post` 가 필수** → [authorizationRequestResolver]
 *
 * Google/Naver/Kakao 는 이 설정의 영향을 받지 않는다.
 */
/*
 * `OAuth2ClientProperties` 를 직접 바인딩한다.
 * Boot 의 OAuth2 클라이언트 자동설정은 registration 이 하나라도 있을 때만 동작하며,
 * 그 안에서 이 프로퍼티 빈이 등록된다. 테스트 프로파일처럼 registration 이 비면 자동설정이
 * 물러나 빈이 사라지고, 이 설정이 기동에 실패한다. (등록이 중복돼도 빈 이름이 같아 안전하다.)
 */
@Configuration
@EnableConfigurationProperties(OAuth2ClientProperties::class)
class AppleOAuthConfig {

    /**
     * `application.yml` 로 만들어진 기본 registration 들을 감싸, Apple 요청에 한해
     * 그때그때 생성한 client_secret 을 끼워 넣는다.
     *
     * Spring Security 는 인가 시작 시점과 토큰 교환 시점에 각각 registration 을 다시 조회하므로,
     * 조회 시점마다 유효한 시크릿이 주입된다.
     */
    @Bean
    fun clientRegistrationRepository(
        properties: OAuth2ClientProperties,
        appleClientSecretGenerator: AppleClientSecretGenerator,
    ): ClientRegistrationRepository {
        val registrations = OAuth2ClientPropertiesMapper(properties).asClientRegistrations()
        // 테스트 프로파일은 registration 을 전부 비운다(application-test.yml). 이때
        // InMemoryClientRegistrationRepository 는 "registrations cannot be empty" 로 기동을
        // 실패시키므로, 아무것도 찾지 못하는 빈 저장소로 대체한다.
        if (registrations.isEmpty()) {
            return ClientRegistrationRepository { null }
        }
        return AppleAwareClientRegistrationRepository(
            InMemoryClientRegistrationRepository(registrations.values.toList()),
            appleClientSecretGenerator,
        )
    }

    /**
     * Apple 인가 요청에만 `response_mode=form_post` 를 덧붙인다.
     *
     * Apple 은 scope 에 `email` 또는 `name` 이 있으면 이 파라미터를 요구하고, 없으면
     * `invalid_request` 로 거부한다. 반대로 다른 provider 에 붙이면 콜백이 POST 로 바뀌어
     * 기존 흐름이 깨지므로 반드시 Apple 로 한정해야 한다.
     */
    @Bean
    fun authorizationRequestResolver(
        clientRegistrationRepository: ClientRegistrationRepository,
    ): OAuth2AuthorizationRequestResolver {
        val resolver = DefaultOAuth2AuthorizationRequestResolver(
            clientRegistrationRepository,
            OAuth2AuthorizationRequestRedirectFilter.DEFAULT_AUTHORIZATION_REQUEST_BASE_URI,
        )
        resolver.setAuthorizationRequestCustomizer { builder ->
            // attributes(Consumer) 는 맵을 제자리에서 넘겨주므로, 여기서 어떤 provider 인지 읽는다.
            builder.attributes { attributes ->
                if (attributes[OAuth2ParameterNames.REGISTRATION_ID] == OAuthProvider.APPLE.registrationId) {
                    builder.additionalParameters { params ->
                        params[RESPONSE_MODE_PARAMETER] = RESPONSE_MODE_FORM_POST
                    }
                }
            }
        }
        return resolver
    }

    companion object {
        private const val RESPONSE_MODE_PARAMETER = "response_mode"
        private const val RESPONSE_MODE_FORM_POST = "form_post"
    }
}

/**
 * Apple registration 을 조회할 때마다 새 `client_secret` 을 채워 반환하는 래퍼.
 *
 * Apple 설정값이 없으면 `null` 을 반환해 **Apple 로그인만 비활성화**한다.
 * (기동 실패로 서비스 전체를 막지 않기 위함)
 */
private class AppleAwareClientRegistrationRepository(
    private val delegate: ClientRegistrationRepository,
    private val appleClientSecretGenerator: AppleClientSecretGenerator,
) : ClientRegistrationRepository {

    override fun findByRegistrationId(registrationId: String): ClientRegistration? {
        val registration = delegate.findByRegistrationId(registrationId) ?: return null
        if (registrationId != OAuthProvider.APPLE.registrationId) {
            return registration
        }
        val clientId = appleClientSecretGenerator.clientId
        if (!appleClientSecretGenerator.isConfigured || clientId == null) {
            return null
        }
        return ClientRegistration.withClientRegistration(registration)
            // client_id 와 client_secret JWT 의 sub 는 같은 Services ID 여야 한다.
            // 두 값을 각각 다른 설정 키에서 읽으면 어긋나도 토큰 교환에서야 invalid_client 로 드러난다.
            .clientId(clientId)
            .clientSecret(appleClientSecretGenerator.generate())
            // id_token 의 iss 검증에 쓰인다. yml 의 issuer-uri 로 주면 기동 시 OIDC discovery 가
            // 호출되므로, 여기서 직접 넣어 네트워크 의존 없이 검증만 살린다.
            .issuerUri(APPLE_ISSUER)
            .build()
    }

    private companion object {
        private const val APPLE_ISSUER = "https://appleid.apple.com"
    }
}
