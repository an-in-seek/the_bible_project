package com.elseeker.common.adapter.input.web

import io.kotest.matchers.shouldBe
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import org.springframework.mock.web.MockHttpServletRequest

@DisplayName("GlobalModelAttribute 단위테스트 — 공유 버튼 노출 경로")
class GlobalModelAttributeTest {

    private val sut = GlobalModelAttribute()

    @Test
    @DisplayName("학습 화면은 공유 버튼을 노출한다")
    fun showShareButton_study() {
        sut.showShareButton(request("/web/study")) shouldBe true
        sut.showShareButton(request("/web/study/old-testament-kings")) shouldBe true
    }

    @Test
    @DisplayName("풀스크린 연출 화면인 창조는 제외한다")
    fun showShareButton_creation() {
        sut.showShareButton(request("/web/study/creation")) shouldBe false
    }

    @Test
    @DisplayName("커뮤니티 목록과 게시글 상세는 공유 버튼을 노출한다")
    fun showShareButton_community() {
        sut.showShareButton(request("/web/community")) shouldBe true
        sut.showShareButton(request("/web/community/42")) shouldBe true
    }

    @Test
    @DisplayName("공유할 대상이 없는 글쓰기 화면은 제외한다")
    fun showShareButton_communityWrite() {
        sut.showShareButton(request("/web/community/write")) shouldBe false
    }

    @Test
    @DisplayName("관리자 화면은 접두사가 달라 노출되지 않는다")
    fun showShareButton_admin() {
        sut.showShareButton(request("/web/admin/community/posts")) shouldBe false
    }

    @Test
    @DisplayName("공유 대상이 아닌 섹션은 노출되지 않는다")
    fun showShareButton_otherSection() {
        sut.showShareButton(request("/web/bible/verse")) shouldBe false
    }

    private fun request(uri: String) = MockHttpServletRequest().apply { requestURI = uri }
}
