package com.elseeker.common.config

import org.springframework.boot.context.properties.ConfigurationProperties
import java.time.Duration

@ConfigurationProperties(prefix = "el-seeker")
data class ElSeekerProperties(
    val jwt: Jwt,
    val api: Api,
    /** Apple 로그인 설정. 미설정 시 Apple 로그인만 비활성화되고 나머지 기능은 정상 동작한다. */
    val apple: Apple? = null,
    /** 앱 딥링크(Android App Links) 설정. 미설정 시 assetlinks 엔드포인트만 404 가 된다. */
    val appLink: AppLink = AppLink(),
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

    /**
     * Apple 로그인(Sign in with Apple) 설정.
     *
     * Apple 은 고정 문자열 client_secret 을 쓰지 않고, 개발자 키로 서명한 **ES256 JWT** 를
     * client_secret 으로 요구한다. 아래 값들은 Apple Developer 콘솔에서 발급받는다.
     */
    data class Apple(
        /** Services ID. 웹 OAuth 의 `client_id` 로 쓰인다 (App ID 인 `com.elseeker.ios` 와 다른 값). */
        val clientId: String,
        /** Apple Developer 팀 ID (10자). client_secret JWT 의 `iss`. */
        val teamId: String,
        /** 개인키(.p8)의 Key ID (10자). client_secret JWT 헤더의 `kid`. */
        val keyId: String,
        /** `.p8` 파일 내용(PEM). PEM 헤더/개행이 포함돼 있어도 된다. */
        val privateKey: String,
        /**
         * 서버-대-서버 알림 JWT 의 `aud` 로 허용할 값 목록.
         *
         * 알림 엔드포인트는 **primary App ID 에만** 등록할 수 있어, Apple 이 보내는 `aud` 가
         * 웹 로그인용 Services ID([clientId]) 가 아니라 App ID(예: `com.elseeker.ios`)일 수 있다.
         * 비워 두면 [clientId] 하나만 허용한다. 실제 값이 다르면 검증 실패 로그에 수신한 `aud`
         * 가 찍히므로, 그 값을 이 목록에 추가하면 된다.
         */
        val notificationAudiences: List<String> = emptyList(),
        /**
         * Apple 공개키(JWKS) 엔드포인트. id_token 및 서버-대-서버 알림의 서명 검증에 쓴다.
         *
         * 운영에서 바꿀 일은 없다. **테스트에서 WireMock 으로 돌려 실제 네트워크를 끊기 위해**
         * 설정 가능하게 두었다.
         */
        val jwkSetUri: String = "https://appleid.apple.com/auth/keys",
    )

    /**
     * 앱 딥링크 설정.
     *
     * 공유 버튼이 만드는 링크는 `https://elseeker.com/...` 이고, 이 URL 이 앱에서도 해당 화면을 열도록
     * Android App Links 를 쓴다. 커스텀 스킴(`elseeker://`)을 쓰지 않는 이유는 앱이 없는 사람에게
     * 열리지 않는 링크가 되기 때문이다.
     *
     * 성립 조건은 두 가지이고 **양쪽 다 있어야** 검증이 통과한다.
     * 1. 서버 — `/.well-known/assetlinks.json` 을 이 설정으로 응답한다(여기서 담당).
     * 2. 앱 — `AndroidManifest` 에 `android:autoVerify="true"` 인 intent-filter 로 같은 호스트/경로를 선언한다.
     */
    data class AppLink(
        val android: Android = Android(),
    ) {

        data class Android(
            /** Play Console 의 앱 패키지명. */
            val packageName: String = "",
            /**
             * 앱 서명 인증서의 SHA-256 지문 목록(`AA:BB:...` 형식, 대문자 16진수).
             *
             * Play App Signing 을 쓰면 **업로드 키와 앱 서명 키의 지문이 다르다.** 둘 다 넣지 않으면
             * 내부 테스트 트랙에서만 검증이 통과하거나 그 반대가 된다. Play Console 의
             * `설정 > 앱 서명` 에서 두 지문을 모두 확인할 수 있다.
             *
             * 비워 두면 assetlinks 엔드포인트가 404 를 반환한다. 지문이 빠진 파일을 200 으로 내보내면
             * Android 가 검증 실패로 캐시해 링크가 앱으로 열리지 않게 되므로, 없을 때는 아예 없는 편이 낫다.
             */
            val sha256CertFingerprints: List<String> = emptyList(),
        )
    }
}