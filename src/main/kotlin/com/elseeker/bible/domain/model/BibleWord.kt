package com.elseeker.bible.domain.model

import com.elseeker.bible.domain.vo.BibleWordCategory
import com.elseeker.bible.domain.vo.BibleWordStatus
import com.elseeker.common.domain.BaseTimeEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Index
import jakarta.persistence.Table
import jakarta.persistence.UniqueConstraint

/**
 * 성경 단어 빈도 통계에 사용할 표제어 어휘.
 *
 * 어휘는 **번역본별**로 관리한다. 번역본마다 표기(`가라사대` / `이르시되`)와 차단 판단이
 * 다르기 때문이다. 언어는 `bible_translation.language_code` 에서 끌어오므로 여기 두지 않는다.
 */
@Entity
@Table(
    name = "bible_word",
    uniqueConstraints = [
        UniqueConstraint(
            name = "uk_bible_word_term",
            columnNames = ["translation_id", "term"]
        )
    ],
    indexes = [
        Index(name = "idx_bible_word_status", columnList = "translation_id, status")
    ]
)
class BibleWord(

    id: Long? = null,

    @Column(name = "translation_id", nullable = false)
    val translationId: Long,

    @Column(name = "term", nullable = false, length = 50)
    var term: String,

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 20)
    var category: BibleWordCategory = BibleWordCategory.ETC,

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    var status: BibleWordStatus = BibleWordStatus.CANDIDATE,

    @Column(name = "dictionary_id")
    var dictionaryId: Long? = null,

    @Column(name = "note", columnDefinition = "TEXT")
    var note: String? = null,

) : BaseTimeEntity(id = id) {

    fun approve() {
        status = BibleWordStatus.APPROVED
    }

    fun block() {
        status = BibleWordStatus.BLOCKED
    }

    fun changeStatus(status: BibleWordStatus) {
        this.status = status
    }

    fun linkDictionary(dictionaryId: Long?) {
        this.dictionaryId = dictionaryId
    }

    fun updateDetail(command: BibleWordUpdateCommand) {
        term = command.term
        category = command.category
        dictionaryId = command.dictionaryId
        note = command.note
    }

    companion object {
        /** 본문에서 자동 추출한 후보. 분류를 알 수 없으므로 ETC 로 둔다. */
        fun candidateOf(translationId: Long, term: String) = BibleWord(
            translationId = translationId,
            term = term,
            category = BibleWordCategory.ETC,
            status = BibleWordStatus.CANDIDATE,
        )

        /** 성경 사전에서 가져온 어휘. 사람이 이미 검수한 용어라 바로 승인 상태로 둔다. */
        fun approvedOf(
            translationId: Long,
            term: String,
            category: BibleWordCategory,
            dictionaryId: Long?,
        ) = BibleWord(
            translationId = translationId,
            term = term,
            category = category,
            status = BibleWordStatus.APPROVED,
            dictionaryId = dictionaryId,
        )
    }
}

/**
 * 표제어 수정 명령. 여러 필드가 함께 바뀌므로 커맨드로 받는다.
 */
data class BibleWordUpdateCommand(
    val term: String,
    val category: BibleWordCategory,
    val dictionaryId: Long?,
    val note: String?,
)
