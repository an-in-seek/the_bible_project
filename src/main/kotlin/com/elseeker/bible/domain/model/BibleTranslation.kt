package com.elseeker.bible.domain.model

import com.elseeker.bible.domain.vo.BibleTranslationType
import com.elseeker.common.domain.BaseEntity
import com.neovisionaries.i18n.LanguageCode
import jakarta.persistence.*

@Entity
@Table(name = "bible_translation")
class BibleTranslation(

    id: Long? = null,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, unique = true)
    val translationType: BibleTranslationType, // 번역본을 Enum으로 저장

    @Column(nullable = false, unique = true)
    val name: String, // 번역본 이름 (예: 개역개정, NIV)

    @Column(nullable = false)
    val translationOrder: Int,

    /**
     * 번역본의 언어. **데이터로서 명시적으로 보관하는 값이다.**
     *
     * 이 컬럼이 있어야 SQL 만으로 "한국어 번역본이 몇 개인지" 같은 질문에 답할 수 있고,
     * DB 를 직접 들여다보는 사람이 `translation_type` 코드를 enum 정의와 대조하지 않아도 된다.
     *
     * 다만 **런타임에서 언어를 판단할 때의 출처는 `BibleTranslationType.language` 다.**
     * 단어 빈도 통계의 토크나이저 선택이 그 예다(`AdminBibleWordStatService`).
     * 관리자 API 가 `translationType` 과 이 값을 따로 입력받으므로 KRV + `en` 같은 조합이
     * 만들어질 수 있는데, 그런 값으로 한국어 본문을 영어 규칙으로 토크나이즈하면 통계가
     * 통째로 어긋나면서도 화면에는 이상한 단어 목록으로만 보여 알아채기 어렵다.
     *
     * 둘은 항상 같아야 한다. 어긋나면 이 컬럼이 틀린 것이다.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 4)
    val languageCode: LanguageCode,

    @OneToMany(fetch = FetchType.LAZY, mappedBy = "translationId")
    val books: MutableList<BibleBook> = mutableListOf()
) : BaseEntity(
    id = id,
)
