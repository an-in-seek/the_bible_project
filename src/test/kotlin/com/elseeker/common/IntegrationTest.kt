package com.elseeker.common

import com.elseeker.auth.AppleTestTokens
import com.elseeker.member.adapter.output.jpa.MemberRepository
import com.elseeker.member.domain.model.Member
import com.elseeker.member.domain.vo.MemberRole
import com.github.tomakehurst.wiremock.WireMockServer
import com.github.tomakehurst.wiremock.client.WireMock.get
import com.github.tomakehurst.wiremock.client.WireMock.okJson
import com.github.tomakehurst.wiremock.client.WireMock.urlEqualTo
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.ActiveProfiles
import org.wiremock.spring.ConfigureWireMock
import org.wiremock.spring.EnableWireMock
import org.wiremock.spring.InjectWireMock

/**
 * WireMock 은 **여기 한 곳에서만** 켠다.
 *
 * 개별 테스트 클래스에 붙이면 그 클래스만 프로퍼티 소스가 달라져 Spring 컨텍스트 캐시가 쪼개진다
 * (testing.md 의 금지 항목). 베이스에 두면 모든 통합 테스트가 컨텍스트 하나를 공유하면서
 * 외부 HTTP 의존을 스텁할 수 있다. 서버 기동 비용은 무시할 수준이다.
 *
 * `test.apple.base-url` 은 `application-test.yml` 의 `el-seeker.apple.jwk-set-uri` 가 참조한다.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@ActiveProfiles(resolver = TestProfileResolver::class)   // 변경하지 말 것
// MockMvc 도 같은 이유로 베이스에서만 켠다. 개별 클래스에 붙이면 컨텍스트가 쪼개진다.
// 라우팅·Content-Type 협상·permitAll 은 HTTP 계층을 실제로 태워야만 검증된다.
@AutoConfigureMockMvc
@EnableWireMock(
    ConfigureWireMock(name = "apple", baseUrlProperties = ["test.apple.base-url"])
)
abstract class IntegrationTest : TestContainers() {

    // ========== 공용 의존성 ==========
    @Autowired
    protected lateinit var databaseCleaner: DatabaseCleaner

    @Autowired
    private lateinit var memberRepository: MemberRepository

    @InjectWireMock("apple")
    protected lateinit var appleServer: WireMockServer

    protected lateinit var member: Member

    /**
     * Apple JWKS 스텁은 **Apple 테스트만이 아니라 모든 통합 테스트에서** 켜 둔다.
     *
     * `AppleNotificationVerifier` 의 `NimbusJwtDecoder` 는 JWKS 를 5분간 캐시하고, 만료 직전에
     * **백그라운드 스레드로 미리 갱신한다.** 반면 `WireMockSpringJunitExtension` 은 매 테스트
     * 시작 전에 `resetAll()` 로 스텁을 지운다. 그래서 스텁을 Apple 테스트 클래스에만 두면
     * 나머지 테스트가 도는 동안 `/auth/keys` 가 404 인 구간이 생기고, 하필 그때 갱신 스레드가
     * 뜨면 JWKS 조회가 실패한다.
     *
     * 그러면 다음 Apple 테스트가 **위조(401)가 아니라 JWKS 조회 실패(503)** 로 끝난다.
     * 로컬은 전체 스위트가 47초라 캐시가 만료될 일이 없어 재현되지 않고, CI 처럼 스위트가
     * 5분을 넘는 환경에서만 간헐적으로 터진다.
     *
     * 스텁을 여기에 두면 리셋 직후 곧바로 다시 등록되므로 그 구간이 사라진다.
     * (JWKS 조회 실패 자체를 검증하는 테스트는 `/auth/keys-down` 이라는 별도 경로를 쓰므로
     * 이 스텁의 영향을 받지 않는다.)
     */
    @BeforeEach
    fun stubAppleJwks() {
        appleServer.stubFor(
            get(urlEqualTo(AppleTestTokens.JWKS_PATH))
                .willReturn(okJson(AppleTestTokens.jwksJson()))
        )
    }

    @BeforeEach
    fun setUp() {
        member = memberRepository.save(
            Member.create(
                email = "seek@elseeker.com",
                nickname = "seek",
                profileImageUrl = null,
                memberRole = MemberRole.USER
            )
        )
    }

    @AfterEach
    fun tearDown() {
        databaseCleaner.execute()
    }

}