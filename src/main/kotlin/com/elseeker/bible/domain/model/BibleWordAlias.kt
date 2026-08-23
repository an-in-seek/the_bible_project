package com.elseeker.bible.domain.model

import com.elseeker.common.domain.BaseTimeEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Index
import jakarta.persistence.Table
import jakarta.persistence.UniqueConstraint

/**
 * 표제어 별칭·이형태.
 *
 * **표기 자체가 다른 경우만 등록한다** (`하나님`/`하느님`, `여호와`/`야훼`).
 * 조사 결합형(`땅에`, `땅을`)은 별칭이 아니다. 그건 정규화 규칙의 결함이므로
 * `BibleWordTokenizer` 쪽에서 고친다. 별칭에 밀어 넣기 시작하면 표제어 하나에
 * 수십 개가 붙고 어느 조사를 빠뜨렸는지 알 수 없게 된다.
 */
@Entity
@Table(
    name = "bible_word_alias",
    uniqueConstraints = [
        UniqueConstraint(
            name = "uk_bible_word_alias",
            columnNames = ["translation_id", "alias"]
        )
    ],
    indexes = [
        Index(name = "idx_bible_word_alias_word", columnList = "bible_word_id")
    ]
)
class BibleWordAlias(

    id: Long? = null,

    @Column(name = "bible_word_id", nullable = false)
    val bibleWordId: Long,

    /** 부모 [BibleWord.translationId] 와 같아야 한다. 유니크 제약을 번역본 단위로 걸기 위해 복제한다. */
    @Column(name = "translation_id", nullable = false)
    val translationId: Long,

    @Column(name = "alias", nullable = false, length = 50)
    val alias: String,

) : BaseTimeEntity(id = id)
