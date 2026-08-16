package com.elseeker.common.adapter.input.api

import com.elseeker.common.config.ElSeekerProperties
import io.kotest.matchers.nulls.shouldNotBeNull
import io.kotest.matchers.shouldBe
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import org.springframework.http.HttpStatus
import java.time.Duration

@DisplayName("AppLinkApi 단위테스트 — assetlinks.json 응답")
class AppLinkApiTest {

    @Test
    @DisplayName("패키지명과 지문이 설정되면 App Links 규격대로 응답한다")
    fun getAssetLinks() {
        // given
        val sut = AppLinkApi(properties("com.elseeker.android", listOf("AA:BB:CC")))

        // when
        val response = sut.getAssetLinks()

        // then
        response.statusCode shouldBe HttpStatus.OK
        val body = response.body
        body.shouldNotBeNull()
        body.size shouldBe 1
        body[0].relation shouldBe listOf("delegate_permission/common.handle_all_urls")
        body[0].target.namespace shouldBe "android_app"
        body[0].target.packageName shouldBe "com.elseeker.android"
        body[0].target.sha256CertFingerprints shouldBe listOf("AA:BB:CC")
    }

    @Test
    @DisplayName("지문 표기가 흔들려도 대문자로 맞추고 빈 항목은 버린다")
    fun getAssetLinks_normalizesFingerprints() {
        // given
        val sut = AppLinkApi(properties("com.elseeker.android", listOf(" aa:bb ", "", "Cc:Dd")))

        // when
        val response = sut.getAssetLinks()

        // then
        response.body?.get(0)?.target?.sha256CertFingerprints shouldBe listOf("AA:BB", "CC:DD")
    }

    @Test
    @DisplayName("지문이 없으면 404 — 검증 실패로 캐시되지 않도록 파일 자체를 내보내지 않는다")
    fun getAssetLinks_withoutFingerprints() {
        // given
        val sut = AppLinkApi(properties("com.elseeker.android", emptyList()))

        // when
        val response = sut.getAssetLinks()

        // then
        response.statusCode shouldBe HttpStatus.NOT_FOUND
    }

    @Test
    @DisplayName("패키지명이 비면 404")
    fun getAssetLinks_withoutPackageName() {
        // given
        val sut = AppLinkApi(properties(" ", listOf("AA:BB")))

        // when
        val response = sut.getAssetLinks()

        // then
        response.statusCode shouldBe HttpStatus.NOT_FOUND
    }

    private fun properties(packageName: String, fingerprints: List<String>) =
        ElSeekerProperties(
            jwt = ElSeekerProperties.Jwt(
                secret = "test-secret",
                accessTokenTtl = Duration.ofHours(1),
                refreshTokenTtl = Duration.ofDays(14),
            ),
            api = ElSeekerProperties.Api(baseUrl = "http://localhost:8080", apiKey = "TEST_API_KEY"),
            appLink = ElSeekerProperties.AppLink(
                android = ElSeekerProperties.AppLink.Android(
                    packageName = packageName,
                    sha256CertFingerprints = fingerprints,
                ),
            ),
        )
}
