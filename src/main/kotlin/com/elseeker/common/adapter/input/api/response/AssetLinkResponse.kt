package com.elseeker.common.adapter.input.api.response

import com.fasterxml.jackson.annotation.JsonProperty

/**
 * Digital Asset Links 항목 — `/.well-known/assetlinks.json` 응답 배열의 원소.
 *
 * 키 이름(`package_name`, `sha256_cert_fingerprints`)과 relation 문자열은 Android 가 정한 규격이라
 * 바꿀 수 없다. Kotlin 프로퍼티명은 camelCase 를 유지하고 직렬화 이름만 맞춘다.
 *
 * 규격: https://developers.google.com/digital-asset-links/v1/getting-started
 */
data class AssetLinkResponse(
    val relation: List<String>,
    val target: Target,
) {

    data class Target(
        val namespace: String,
        @get:JsonProperty("package_name")
        val packageName: String,
        @get:JsonProperty("sha256_cert_fingerprints")
        val sha256CertFingerprints: List<String>,
    )

    companion object {
        /** 이 도메인의 모든 URL 을 앱이 열도록 위임한다. App Links 검증이 요구하는 relation. */
        private const val RELATION_HANDLE_ALL_URLS = "delegate_permission/common.handle_all_urls"
        private const val NAMESPACE_ANDROID_APP = "android_app"

        fun ofAndroidApp(packageName: String, sha256CertFingerprints: List<String>) =
            AssetLinkResponse(
                relation = listOf(RELATION_HANDLE_ALL_URLS),
                target = Target(
                    namespace = NAMESPACE_ANDROID_APP,
                    packageName = packageName,
                    sha256CertFingerprints = sha256CertFingerprints,
                ),
            )
    }
}
