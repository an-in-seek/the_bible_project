package com.elseeker.common.adapter.input.api

import com.elseeker.common.adapter.input.api.response.AssetLinkResponse
import com.elseeker.common.config.ElSeekerProperties
import io.swagger.v3.oas.annotations.Hidden
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController

/**
 * Android App Links 검증 파일 — `/.well-known/assetlinks.json`.
 *
 * 상단 공유 버튼이 만드는 링크는 `https://elseeker.com/...` 이다(설계 문서: docs/common/url-share.md).
 * 이 파일이 있어야 Android 가 그 도메인을 앱에 위임해도 되는지 확인하고, 앱이 설치돼 있으면 링크를
 * 브라우저 대신 **앱의 해당 화면**으로 연다. 즉 공유 URL 을 딥링크로 만드는 서버 쪽 절반이다.
 *
 * 나머지 절반은 앱에 있다. `AndroidManifest` 에 `android:autoVerify="true"` 인 intent-filter 로 같은
 * 호스트를 선언해야 하며, 한쪽만 있으면 검증은 통과하지 않는다.
 *
 * 정적 파일 대신 엔드포인트로 둔 이유는 서명 지문이 환경변수라서다. 지문을 레포에 커밋할 필요가 없고,
 * 키를 교체할 때 배포 없이 환경변수만 바꿔도 된다.
 */
@Hidden
@RestController
class AppLinkApi(
    private val elSeekerProperties: ElSeekerProperties,
) {

    @GetMapping(WELL_KNOWN_ASSET_LINKS_PATH, produces = [MediaType.APPLICATION_JSON_VALUE])
    fun getAssetLinks(): ResponseEntity<List<AssetLinkResponse>> {
        val android = elSeekerProperties.appLink.android
        val packageName = android.packageName.trim()
        val fingerprints = normalizeFingerprints(android.sha256CertFingerprints)

        // 설정이 비면 파일이 아예 없는 것으로 둔다.
        // 지문 없는 파일을 200 으로 내보내면 Android 가 '검증 실패' 로 캐시해, 나중에 지문을 채워도
        // 재검증 전까지 링크가 앱으로 열리지 않는다. 없는 것보다 나쁘다.
        if (packageName.isEmpty() || fingerprints.isEmpty()) {
            return ResponseEntity.notFound().build()
        }

        return ResponseEntity.ok(listOf(AssetLinkResponse.ofAndroidApp(packageName, fingerprints)))
    }

    /** Android 는 콜론으로 구분된 대문자 16진수를 기대한다. 환경변수 표기가 흔들려도 맞춰 준다. */
    private fun normalizeFingerprints(fingerprints: List<String>): List<String> =
        fingerprints.map { it.trim().uppercase() }.filter { it.isNotEmpty() }

    companion object {
        const val WELL_KNOWN_ASSET_LINKS_PATH = "/.well-known/assetlinks.json"
    }
}
