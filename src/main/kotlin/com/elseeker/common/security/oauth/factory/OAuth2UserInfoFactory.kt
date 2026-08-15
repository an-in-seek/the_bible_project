package com.elseeker.common.security.oauth.factory

import com.elseeker.common.security.oauth.info.AppleOAuth2UserInfo
import com.elseeker.common.security.oauth.info.GoogleOAuth2UserInfo
import com.elseeker.common.security.oauth.info.KakaoOAuth2UserInfo
import com.elseeker.common.security.oauth.info.NaverOAuth2UserInfo
import com.elseeker.common.security.oauth.info.OAuth2UserInfo
import com.elseeker.member.domain.vo.OAuthProvider

object OAuth2UserInfoFactory {

    fun getOAuth2UserInfo(provider: OAuthProvider, attributes: Map<String, Any>): OAuth2UserInfo {
        return when (provider) {
            OAuthProvider.GOOGLE -> GoogleOAuth2UserInfo(attributes)
            OAuthProvider.NAVER -> NaverOAuth2UserInfo(attributes)
            OAuthProvider.KAKAO -> KakaoOAuth2UserInfo(attributes)
            // Apple 은 userinfo 응답이 아니라 id_token 클레임 맵이 넘어온다 (CustomOidcUserService).
            OAuthProvider.APPLE -> AppleOAuth2UserInfo(attributes)
        }
    }

}
