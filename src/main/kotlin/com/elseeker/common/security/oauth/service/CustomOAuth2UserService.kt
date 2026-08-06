package com.elseeker.common.security.oauth.service

import com.elseeker.common.domain.ErrorType
import com.elseeker.common.domain.ServiceError
import com.elseeker.common.domain.throwError
import com.elseeker.common.security.oauth.component.OAuth2MemberResolver
import com.elseeker.common.security.oauth.factory.OAuth2UserInfoFactory
import com.elseeker.common.security.oauth.info.OAuth2UserInfo
import com.elseeker.common.security.oauth.result.OAuth2MemberResult
import com.elseeker.member.domain.vo.OAuthProvider
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest
import org.springframework.security.oauth2.core.OAuth2AuthenticationException
import org.springframework.security.oauth2.core.OAuth2Error
import org.springframework.security.oauth2.core.user.DefaultOAuth2User
import org.springframework.security.oauth2.core.user.OAuth2User
import org.springframework.stereotype.Service

/**
 * provider 로부터 받은 사용자 정보를 후속 Handler 가 쓸 [OAuth2User] 로 변환한다.
 *
 * ⚠️ 이 클래스에는 `@Transactional` 등 AOP 애노테이션을 붙이지 않는다.
 * 상위 클래스인 [DefaultOAuth2UserService] 의 `setRestOperations`/`setRequestEntityConverter` 가
 * `final` 이라, 프록시가 만들어지는 순간 CGLIB 이 "cannot get proxied" 경고를 남기고 해당 setter 는
 * 프록시 인스턴스에만 적용돼 대상 객체와 상태가 어긋난다.
 * DB 작업은 [OAuth2MemberResolver] 가 자기 트랜잭션 안에서 처리한다.
 */
@Service
class CustomOAuth2UserService(
    private val oAuth2MemberResolver: OAuth2MemberResolver,
) : DefaultOAuth2UserService() {

    override fun loadUser(userRequest: OAuth2UserRequest): OAuth2User {
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

    private fun doLoadUser(userRequest: OAuth2UserRequest): OAuth2User {
        val oAuth2User = super.loadUser(userRequest)

        // 1. Provider별 파싱된 사용자 정보 획득 후 필수 값 검증
        val provider = OAuthProvider.fromRegistrationId(userRequest.clientRegistration.registrationId)
        val userInfo = OAuth2UserInfoFactory.getOAuth2UserInfo(provider, oAuth2User.attributes)
        validateUserInfo(userInfo)

        // 2. 회원 저장 전에 식별자 속성명을 먼저 확인한다. 저장 이후에 던지면 트랜잭션이 이미 커밋된 뒤라
        //    가입만 되고 로그인은 실패하는 상태가 남는다.
        // Spring Security 7 에서 userNameAttributeName 은 nullable 로 선언됐다. 값이 없다는 것은
        // 해당 provider 등록에 user-name-attribute 가 빠졌다는 뜻이라 사용자 식별이 불가능하다.
        val userNameAttributeName = userRequest.clientRegistration.providerDetails.userInfoEndpoint.userNameAttributeName
            ?: throwError(ErrorType.OAUTH_PROVIDER_USER_ID_MISSING, provider.registrationId)

        // 3. OAuth 계정 기준으로 회원을 연동/로그인/가입 처리
        val member = oAuth2MemberResolver.resolveMember(userInfo)

        // 4. 후속 Handler가 사용할 OAuth2User 구성 (memberUid/role/status 등 주입)
        return buildOAuth2User(oAuth2User, member, userNameAttributeName)
    }

    /** 이메일·providerUserId 등 필수 값 존재 여부 검증. */
    private fun validateUserInfo(userInfo: OAuth2UserInfo) {
        if (userInfo.email.isBlank()) {
            throwError(ErrorType.OAUTH_EMAIL_MISSING, userInfo.provider.registrationId)
        }
        if (userInfo.providerUserId.isBlank()) {
            throwError(ErrorType.OAUTH_PROVIDER_USER_ID_MISSING, userInfo.provider.registrationId)
        }
    }

    /**
     * 후속 Handler용 OAuth2User 구성.
     * 주의: Handler에서 attributes["memberUid"] 등으로 접근하므로 내부 시스템용 데이터를 반드시 포함시킨다.
     */
    private fun buildOAuth2User(
        oAuth2User: OAuth2User,
        member: OAuth2MemberResult,
        userNameAttributeName: String,
    ): OAuth2User {
        val enrichedAttributes = HashMap<String, Any>(oAuth2User.attributes).apply {
            put("memberUid", member.uid.toString())
            put("role", member.memberRole.name)
            put("email", member.email) // Provider 구조에 따라 최상위에 없을 수 있으므로 명시적 추가
            put("status", member.status.name) // 가입 동의 대기(PENDING_CONSENT) 분기용
        }
        // userNameAttributeName: Google은 "sub", Naver는 "response", Kakao는 "id" 등
        val authorities = listOf(SimpleGrantedAuthority("ROLE_${member.memberRole.name}"))
        return DefaultOAuth2User(authorities, enrichedAttributes, userNameAttributeName)
    }
}
