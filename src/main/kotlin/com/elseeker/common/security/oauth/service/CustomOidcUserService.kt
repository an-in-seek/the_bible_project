package com.elseeker.common.security.oauth.service

import com.elseeker.common.domain.ServiceError
import com.elseeker.common.domain.throwError
import com.elseeker.common.domain.ErrorType
import com.elseeker.common.security.oauth.component.OAuth2MemberResolver
import com.elseeker.common.security.oauth.factory.OAuth2UserInfoFactory
import com.elseeker.common.security.oauth.info.OAuth2UserInfo
import com.elseeker.common.security.oauth.result.OAuth2MemberResult
import com.elseeker.member.domain.vo.OAuthProvider
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest
import org.springframework.security.oauth2.core.OAuth2AuthenticationException
import org.springframework.security.oauth2.core.OAuth2Error
import org.springframework.security.oauth2.core.oidc.IdTokenClaimNames
import org.springframework.security.oauth2.core.oidc.OidcIdToken
import org.springframework.security.oauth2.core.oidc.user.DefaultOidcUser
import org.springframework.security.oauth2.core.oidc.user.OidcUser
import org.springframework.stereotype.Service

/**
 * OIDC(`openid` scope) provider 전용 사용자 서비스. 현재는 **Apple 로그인만** 이 경로를 탄다.
 *
 * [CustomOAuth2UserService] 와 동일한 일을 하지만 사용자 정보의 출처가 다르다.
 * - Google/Naver/Kakao: userinfo 엔드포인트 응답 (`scope` 에 `openid` 없음 → 비-OIDC 경로)
 * - Apple: **userinfo 엔드포인트가 없어** `id_token` 클레임이 유일한 출처
 *
 * 그래서 Spring 의 기본 [org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService]
 * 를 상속하지 않고 인터페이스를 직접 구현한다. 상속하면 userinfo 조회 로직을 함께 물려받게 되는데,
 * Apple 에는 호출할 엔드포인트가 없어 의미가 없다.
 *
 * ⚠️ [CustomOAuth2UserService] 와 마찬가지로 `@Transactional` 등 AOP 애노테이션을 붙이지 않는다.
 * DB 작업은 [OAuth2MemberResolver] 가 자기 트랜잭션 안에서 처리한다.
 */
@Service
class CustomOidcUserService(
    private val oAuth2MemberResolver: OAuth2MemberResolver,
) : OAuth2UserService<OidcUserRequest, OidcUser> {

    override fun loadUser(userRequest: OidcUserRequest): OidcUser {
        try {
            return doLoadUser(userRequest)
        } catch (e: ServiceError) {
            throw OAuth2AuthenticationException(
                OAuth2Error(e.errorType.name, e.message, null),
                e.message,
                e
            )
        }
    }

    private fun doLoadUser(userRequest: OidcUserRequest): OidcUser {
        // 1. id_token 클레임에서 provider별 사용자 정보를 파싱하고 필수 값 검증
        val provider = OAuthProvider.fromRegistrationId(userRequest.clientRegistration.registrationId)
        val claims: Map<String, Any> = userRequest.idToken.claims
        val userInfo = OAuth2UserInfoFactory.getOAuth2UserInfo(provider, claims)
        validateUserInfo(userInfo)

        // 2. OAuth 계정 기준으로 회원을 연동/로그인/가입 처리
        val member = oAuth2MemberResolver.resolveMember(userInfo)

        // 3. 후속 Handler가 사용할 OidcUser 구성
        return buildOidcUser(userRequest, member, claims)
    }

    /** 이메일·providerUserId 등 필수 값 존재 여부 검증. */
    private fun validateUserInfo(userInfo: OAuth2UserInfo) {
        if (userInfo.email.isBlank()) {
            // Apple 은 `email` scope 가 승인돼야 이메일을 내려준다. 최초 인증에서 사용자가
            // 이메일 제공을 거부했거나 scope 설정이 빠지면 여기로 떨어진다.
            throwError(ErrorType.OAUTH_EMAIL_MISSING, userInfo.provider.registrationId)
        }
        if (userInfo.providerUserId.isBlank()) {
            throwError(ErrorType.OAUTH_PROVIDER_USER_ID_MISSING, userInfo.provider.registrationId)
        }
    }

    /**
     * 후속 Handler용 OidcUser 구성.
     *
     * [OAuth2LoginSuccessHandler][com.elseeker.common.security.oauth.handler.OAuth2LoginSuccessHandler]
     * 가 `attributes["memberUid"]` 등으로 접근하므로 내부 시스템용 데이터를 반드시 포함시킨다.
     *
     * ⚠️ 주입한 값은 **id_token 클레임 자리에 넣어야 한다.** `DefaultOidcUser` 의 속성 병합
     * (`OidcUserAuthority.collectClaims`)은 userInfo 를 먼저 넣고 id_token 을 나중에 덮어쓰므로,
     * `OidcUserInfo` 로 전달하면 id_token 에 같은 이름이 있는 클레임이 이긴다.
     * 특히 `email` 이 그렇다. Apple 이 '이메일 가리기'로 내려준 비공개 릴레이 주소가
     * 회원의 정본 이메일을 덮어써, 발급되는 JWT 에 엉뚱한 이메일이 담기게 된다.
     */
    private fun buildOidcUser(
        userRequest: OidcUserRequest,
        member: OAuth2MemberResult,
        claims: Map<String, Any>,
    ): OidcUser {
        val enrichedClaims = HashMap<String, Any>(claims).apply {
            put("memberUid", member.uid.toString())
            put("role", member.memberRole.name)
            put("email", member.email)
            put("status", member.status.name) // 가입 동의 대기(PENDING_CONSENT) 분기용
        }
        val enrichedIdToken = OidcIdToken(
            userRequest.idToken.tokenValue,
            userRequest.idToken.issuedAt,
            userRequest.idToken.expiresAt,
            enrichedClaims,
        )
        val authorities = listOf(SimpleGrantedAuthority("ROLE_${member.memberRole.name}"))
        return DefaultOidcUser(authorities, enrichedIdToken, IdTokenClaimNames.SUB)
    }
}
