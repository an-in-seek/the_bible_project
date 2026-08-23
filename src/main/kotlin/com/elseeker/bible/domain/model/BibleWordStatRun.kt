package com.elseeker.bible.domain.model

import com.elseeker.common.domain.BaseTimeEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Table
import jakarta.persistence.UniqueConstraint
import java.time.Instant

/**
 * 단어 통계 재계산 이력. 번역본 x 책 단위로 1행.
 *
 * 세 가지를 한 번에 해결한다.
 * 1. 사용자 응답의 `calculatedAt` 출처 — 통계 행에서는 뽑을 수 없는 값이다.
 * 2. 관리자 목록에서 번역본별 재계산 누락을 눈에 띄게 하는 근거.
 * 3. 재계산 결과 요약의 영속 기록.
 */
@Entity
@Table(
    name = "bible_word_stat_run",
    uniqueConstraints = [
        UniqueConstraint(
            name = "uk_bible_word_stat_run",
            columnNames = ["translation_id", "book_order"]
        )
    ]
)
class BibleWordStatRun(

    id: Long? = null,

    @Column(name = "translation_id", nullable = false)
    val translationId: Long,

    @Column(name = "book_order", nullable = false)
    val bookOrder: Int,

    @Column(name = "calculated_at", nullable = false)
    var calculatedAt: Instant,

    @Column(name = "chapter_count", nullable = false)
    var chapterCount: Int,

    @Column(name = "stat_row_count", nullable = false)
    var statRowCount: Int,

    @Column(name = "manual_kept", nullable = false)
    var manualKept: Int,

) : BaseTimeEntity(id = id) {

    fun record(calculatedAt: Instant, chapterCount: Int, statRowCount: Int, manualKept: Int) {
        this.calculatedAt = calculatedAt
        this.chapterCount = chapterCount
        this.statRowCount = statRowCount
        this.manualKept = manualKept
    }
}
