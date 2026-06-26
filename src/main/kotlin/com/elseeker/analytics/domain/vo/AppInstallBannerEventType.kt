package com.elseeker.analytics.domain.vo

/**
 * Android 앱 설치 유도 배너 이벤트 종류.
 *
 * 설계 문서: docs/googleplay/app-install-banner-prd.md (13장 이벤트 로깅)
 * - IMPRESSION: 배너가 사용자에게 노출됨
 * - CLICK: "앱 설치하기" 버튼 클릭
 * - DISMISS: "웹에서 계속 보기" 또는 닫기 버튼으로 배너 닫음
 */
enum class AppInstallBannerEventType {
    IMPRESSION,
    CLICK,
    DISMISS,
}
