package com.elseeker.common.security.oauth.info

import com.elseeker.member.domain.vo.OAuthProvider

/**
 * Apple 구현체.
 *
 * Apple 은 **userinfo 엔드포인트를 제공하지 않는다.** 사용자 식별 정보는 전부 `id_token` 클레임으로
 * 전달되므로, 이 클래스의 [attributes] 는 OIDC id_token 의 클레임 맵이다.
 * (Google/Naver/Kakao 는 userinfo 응답이 들어온다 — 여기가 유일한 구조적 차이다.)
 *
 * 이메일은 사용자가 "이메일 가리기"를 선택하면 Apple 의 비공개 릴레이 주소
 * (`...@privaterelay.appleid.com`)로 내려온다. 정상 값이므로 별도 처리하지 않는다.
 *
 * ## 이름을 얻을 수 없는 이유
 * Apple 은 이름을 `id_token` 에 담지 않고, **최초 인증 1회에 한해** 별도 `user` 폼 파라미터로만
 * 보낸다. 현재 등록 scope 도 `openid`/`email` 뿐이라 이름은 어느 경로로도 들어오지 않는다.
 *
 * 이때 이메일 로컬 파트를 이름 대신 쓰면 안 된다. '이메일 가리기' 사용자의 로컬 파트는
 * `k3j9xq2m8p` 같은 무작위 문자열이라, 그대로 `oauthNickname` 에 저장되어 마이페이지의
 * 연동 계정 목록에 그대로 노출된다. 대신 고정 표시값을 쓴다.
 */
class AppleOAuth2UserInfo(
    override val attributes: Map<String, Any>
) : OAuth2UserInfo {

    override val providerUserId: String
        get() = attributes["sub"] as? String ?: ""

    override val provider: OAuthProvider
        get() = OAuthProvider.APPLE

    override val email: String
        get() = attributes["email"] as? String ?: ""

    override val name: String
        get() = DISPLAY_NAME

    override val imageUrl: String?
        get() = null

    companion object {
        /** Apple 이 이름을 제공하지 않으므로 사용하는 고정 표시값. */
        private const val DISPLAY_NAME = "Apple 사용자"
    }
}
