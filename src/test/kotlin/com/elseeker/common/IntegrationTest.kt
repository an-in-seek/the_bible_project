package com.elseeker.common

import com.elseeker.member.adapter.output.jpa.MemberRepository
import com.elseeker.member.domain.model.Member
import com.elseeker.member.domain.vo.MemberRole
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.ActiveProfiles
import org.wiremock.spring.ConfigureWireMock
import org.wiremock.spring.EnableWireMock

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

    protected lateinit var member: Member

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