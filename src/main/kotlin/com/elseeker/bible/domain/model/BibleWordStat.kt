package com.elseeker.bible.domain.model

import com.elseeker.bible.domain.vo.BibleWordStatSource
import com.elseeker.common.domain.BaseEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Index
import jakarta.persistence.Table
import jakarta.persistence.UniqueConstraint

/**
 * 성경 책/장 단위 단어 언급 횟수.
 *
 * `chapterNumber = 0` 이면 책 전체 집계다. NULL 을 쓰지 않는 이유는 PostgreSQL 유니크 제약에서
 * NULL 이 서로 다른 값으로 취급돼 중복 행이 그대로 들어가기 때문이다.
 *
 * 행 수가 번역본당 약 15만 규모로 커지므로 [BaseEntity] 를 상속해 `createdAt`/`updatedAt` 을
 * 두지 않는다. 재계산 시각은 [BibleWordStatRun] 에 책 단위로 기록한다.
 *
 * "자동값으로 덮어쓰기" 메서드가 없는 것은 의도적이다. AUTO 행은 재계산 때 범위 단위로 지우고
 * 다시 넣으므로 개별 갱신할 일이 없다.
 */
@Entity
@Table(
    name = "bible_word_stat",
    uniqueConstraints = [
        UniqueConstraint(
            name = "uk_bible_word_stat",
            columnNames = ["translation_id", "book_order", "chapter_number", "bible_word_id"]
        )
    ],
    indexes = [
        Index(
            name = "idx_bible_word_stat_scope",
            columnList = "translation_id, book_order, chapter_number, word_count DESC"
        ),
        Index(name = "idx_bible_word_stat_word", columnList = "bible_word_id"),
    ]
)
class BibleWordStat(

    id: Long? = null,

    @Column(name = "bible_word_id", nullable = false)
    val bibleWordId: Long,

    @Column(name = "translation_id", nullable = false)
    val translationId: Long,

    @Column(name = "book_order", nullable = false)
    val bookOrder: Int,

    /** 0 이면 책 전체 집계 */
    @Column(name = "chapter_number", nullable = false)
    val chapterNumber: Int,

    @Column(name = "word_count", nullable = false)
    var wordCount: Int,

    @Enumerated(EnumType.STRING)
    @Column(name = "source", nullable = false, length = 10)
    var source: BibleWordStatSource = BibleWordStatSource.AUTO,

) : BaseEntity(id = id) {

    /** 관리자가 값을 직접 고친다. 이 순간부터 재계산이 건드리지 않는다. */
    fun updateByAdmin(wordCount: Int) {
        this.wordCount = wordCount
        this.source = BibleWordStatSource.MANUAL
    }

    fun isBookScope(): Boolean = chapterNumber == BOOK_SCOPE_CHAPTER_NUMBER

    companion object {
        const val BOOK_SCOPE_CHAPTER_NUMBER = 0

        fun auto(
            bibleWordId: Long,
            translationId: Long,
            bookOrder: Int,
            chapterNumber: Int,
            wordCount: Int,
        ) = BibleWordStat(
            bibleWordId = bibleWordId,
            translationId = translationId,
            bookOrder = bookOrder,
            chapterNumber = chapterNumber,
            wordCount = wordCount,
            source = BibleWordStatSource.AUTO,
        )

        fun manual(
            bibleWordId: Long,
            translationId: Long,
            bookOrder: Int,
            chapterNumber: Int,
            wordCount: Int,
        ) = BibleWordStat(
            bibleWordId = bibleWordId,
            translationId = translationId,
            bookOrder = bookOrder,
            chapterNumber = chapterNumber,
            wordCount = wordCount,
            source = BibleWordStatSource.MANUAL,
        )
    }
}
