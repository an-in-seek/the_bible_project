package com.elseeker.bible.application.service

import com.elseeker.bible.adapter.output.jpa.BibleTranslationRepository
import com.elseeker.bible.adapter.output.jpa.BibleWordAliasRepository
import com.elseeker.bible.adapter.output.jpa.BibleWordRepository
import com.elseeker.bible.adapter.output.jpa.BibleWordStatRepository
import com.elseeker.bible.application.component.BibleWordTokenizer
import com.elseeker.bible.application.component.DictionaryImportFilter
import com.elseeker.bible.domain.model.BibleWord
import com.elseeker.bible.domain.model.BibleWordAlias
import com.elseeker.bible.domain.model.BibleWordUpdateCommand
import com.elseeker.bible.domain.vo.BibleWordCategory
import com.elseeker.bible.domain.vo.BibleWordStatSource
import com.elseeker.bible.domain.vo.BibleWordStatus
import com.elseeker.common.domain.ErrorType
import com.elseeker.common.domain.throwError
import com.elseeker.study.adapter.output.jpa.DictionaryRepository
import com.neovisionaries.i18n.LanguageCode
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.repository.findByIdOrNull
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

/**
 * 관리자 어휘(`bible_word`) 관리.
 *
 * 어휘는 **번역본별**이다(설계 문서 §3.7). 같은 언어의 두 번역본은 [copyFrom] 으로 복사한 뒤
 * 후보 리포트로 표기 차이만 메우는 것이 현실적인 순서다.
 */
@Service
@Transactional(readOnly = true)
class AdminBibleWordService(
    private val bibleWordRepository: BibleWordRepository,
    private val bibleWordAliasRepository: BibleWordAliasRepository,
    private val bibleWordStatRepository: BibleWordStatRepository,
    private val bibleTranslationRepository: BibleTranslationRepository,
    private val dictionaryRepository: DictionaryRepository,
    private val dictionaryImportFilter: DictionaryImportFilter,
    private val bibleWordTokenizer: BibleWordTokenizer,
) {

    private val logger = KotlinLogging.logger {}

    fun findAll(
        translationId: Long,
        status: BibleWordStatus?,
        category: BibleWordCategory?,
        term: String?,
        pageable: Pageable,
    ): Page<BibleWord> =
        bibleWordRepository.findAllBy(
            translationId,
            status,
            category,
            term?.trim()?.takeIf { it.isNotBlank() }?.let { "%$it%" },
            pageable
        )

    fun findById(id: Long): BibleWord =
        bibleWordRepository.findByIdOrNull(id) ?: throwError(ErrorType.BIBLE_WORD_NOT_FOUND, "id=$id")

    fun findAliases(bibleWordId: Long): List<BibleWordAlias> =
        bibleWordAliasRepository.findByBibleWordId(bibleWordId)

    /** 삭제 경고에 쓴다. 관리자가 손으로 넣은 값이 함께 사라지는지 알려 줘야 한다. */
    fun countManualStats(bibleWordId: Long): Long =
        bibleWordStatRepository.countByBibleWordIdAndSource(bibleWordId, BibleWordStatSource.MANUAL)

    @Transactional
    fun create(
        translationId: Long,
        term: String,
        category: BibleWordCategory,
        status: BibleWordStatus,
        dictionaryId: Long?,
        note: String?,
        aliases: List<String>,
    ): BibleWord {
        val normalizedTerm = term.trim()
        if (normalizedTerm.isEmpty()) throwError(ErrorType.INVALID_PARAMETER, "term is blank")
        if (bibleWordRepository.existsByTranslationIdAndTerm(translationId, normalizedTerm)) {
            throwError(ErrorType.BIBLE_WORD_DUPLICATED, normalizedTerm)
        }

        val saved = bibleWordRepository.save(
            BibleWord(
                translationId = translationId,
                term = normalizedTerm,
                category = category,
                status = status,
                dictionaryId = dictionaryId,
                note = note,
            )
        )
        replaceAliases(saved, aliases)
        return saved
    }

    @Transactional
    fun update(id: Long, command: BibleWordUpdateCommand, aliases: List<String>): BibleWord {
        val word = findById(id)
        val newTerm = command.term.trim()
        if (newTerm.isEmpty()) throwError(ErrorType.INVALID_PARAMETER, "term is blank")
        if (newTerm != word.term &&
            bibleWordRepository.existsByTranslationIdAndTerm(word.translationId, newTerm)
        ) {
            throwError(ErrorType.BIBLE_WORD_DUPLICATED, newTerm)
        }

        word.updateDetail(command.copy(term = newTerm))
        replaceAliases(word, aliases)
        return word
    }

    /**
     * 상태를 바꾼다. `BLOCKED` 로 내리면 **그 어휘의 통계 행을 즉시 지운다.**
     * 재계산을 기다리면 차단한 단어가 그때까지 화면에 계속 보인다.
     */
    @Transactional
    fun changeStatus(id: Long, status: BibleWordStatus): BibleWord {
        val word = findById(id)
        word.changeStatus(status)
        if (status == BibleWordStatus.BLOCKED) {
            val deleted = bibleWordStatRepository.deleteByBibleWordId(id)
            logger.info { "어휘 차단으로 통계 행 삭제: bibleWordId=$id, deleted=$deleted" }
        }
        return word
    }

    /** FK 가 없으므로 통계 행과 별칭을 애플리케이션이 직접 지운다. */
    @Transactional
    fun delete(id: Long) {
        val word = findById(id)
        bibleWordStatRepository.deleteByBibleWordId(id)
        bibleWordAliasRepository.deleteByBibleWordId(id)
        bibleWordRepository.delete(word)
    }

    /**
     * 성경 사전에서 어휘를 일괄 등록한다. 이미 있는 표제어는 건너뛰므로 여러 번 실행해도 안전하다.
     *
     * 사전에 표제어 언어 컬럼이 없는 동안에는 [DictionaryImportFilter] 가 문자 종류로 판별한다.
     */
    @Transactional
    fun importFromDictionary(translationId: Long): ImportResult {
        val languageCode = getTranslationLanguage(translationId)
        if (!dictionaryImportFilter.supportsLanguage(languageCode)) {
            throwError(ErrorType.INVALID_PARAMETER, "지원하지 않는 언어입니다: $languageCode")
        }

        val existingTerms = bibleWordRepository.findTermsByTranslationId(translationId).toHashSet()
        var imported = 0
        var skipped = 0

        dictionaryRepository.findAll().forEach { dictionary ->
            val term = dictionary.term.trim()
            if (term.isEmpty() || !dictionaryImportFilter.matchesLanguage(term, languageCode)) {
                skipped++
                return@forEach
            }
            if (!existingTerms.add(term)) {
                skipped++
                return@forEach
            }
            bibleWordRepository.save(
                BibleWord.approvedOf(
                    translationId = translationId,
                    term = term,
                    category = BibleWordCategory.ETC,
                    dictionaryId = dictionary.id,
                )
            )
            imported++
        }

        logger.info { "사전 가져오기 완료: translationId=$translationId, imported=$imported, skipped=$skipped" }
        return ImportResult(imported = imported, skipped = skipped)
    }

    /**
     * 표제어를 일괄 등록한다. 초기 구축에서 6천 건 규모를 넣어야 하므로 한 건씩 누를 수 없다.
     *
     * [status] 로 세 가지 용도를 겸한다.
     *
     * | status | 쓰임 |
     * |---|---|
     * | `CANDIDATE` | 빈도 조건으로 쓸어 담기. **화면 노출 정책에 걸린다**(설계 문서 §3.2) |
     * | `APPROVED` | 후보 화면에서 사람이 **골라서** 넣기. 검수가 등록 시점에 끝난다 |
     * | `BLOCKED` | 쓰레기를 쓸어 담아 재추출을 막기 |
     *
     * **`APPROVED` 로 골라 넣는 경로가 실제 운영에서 필요한 것이다.** `CANDIDATE` 를 크게 넣고
     * 나중에 승인하는 흐름은 승인 수단이 한 건씩뿐이라 6천 건 규모에서 성립하지 않는다.
     *
     * **정규화가 스스로에게 수렴하지 않는 표제어는 거부한다.** 이 방어가 없으면 한 번의
     * 일괄 등록으로 통계 전체가 망가진다. 매처는 어휘 조회를 정규화보다 먼저 하므로
     * (`여자를` 을 살리려고 일부러 그렇게 만든 순서다) 어휘에 `하라`·`몸에` 가 들어가는 순간
     * 그것들이 모든 필터를 건너뛰고 그대로 집계된다. 규칙을 고쳐도 소용이 없다.
     *
     * 실제로 2026-08-24 운영 재계산에서 705건이 검수 없이 들어가 `하라(3)`·`몸에(2)`·
     * `하였으므(1)` 같은 것이 화면에 올라왔다. 화면의 "최소 빈도" 는 몇 번 나왔는지일 뿐
     * 품질과 무관하다.
     *
     * 거부 조건은 둘이다.
     *
     * 1. `normalize(term) == null` — 토크나이저가 애초에 내놓지 않는 형태다(`하라`, `것을`).
     * 2. 정규화 결과가 term 과 다르고 **그 결과가 어휘에 이미 있다** — 조사가 붙은 형태다.
     *    `몸에` → `몸` 이고 `몸` 이 어휘에 있으니 `몸에` 는 표제어가 아니다.
     *
     * 2번에 어휘 확인을 붙인 이유가 중요하다. "정규화 결과가 다르면 거부" 로만 하면
     * `리브가`·`구덩이`·`지팡이` 가 함께 죽는다. 정규화는 이것들의 끝 글자를 조사로 보고
     * `리브`·`구덩`·`지팡` 으로 깎기 때문이다. 반대로 `구덩이에` 에서 뽑힌 후보는 `구덩이` 라서,
     * **같은 단어가 조사 유무에 따라 다르게 정규화된다.** 그래서 정규화 결과를 그대로
     * 신뢰할 수 없고, 어휘에 있는지로 한 번 더 걸러야 한다. 매처가 `verbStemCandidate`·
     * `singularCandidate` 를 어휘 확인 뒤에만 쓰는 것과 같은 이유다.
     *
     * 이 필터가 모든 쓰레기를 막지는 못한다. `올라가니`·`죽으매` 처럼 어미 목록에 없는
     * 3음절 이상 활용형은 통과한다. 규칙 기반의 한계이고, 형태소 분석기를 도입할 때까지는
     * **후보를 사람이 훑는 단계를 건너뛸 수 없다**(설계 문서 §3.2).
     *
     * **`BLOCKED` 에는 이 필터를 적용하지 않는다.** 차단하려는 것은 대개 `하라` 처럼 필터가
     * 거부하는 형태다. 걸러 버리면 정작 막아야 할 단어를 막지 못한다.
     *
     * 필터가 정상 단어를 거부하면 한 건씩 등록하는 [create] 를 쓰면 된다. 그쪽에는 필터가 없다.
     */
    @Transactional
    fun bulkCreate(
        translationId: Long,
        terms: List<String>,
        status: BibleWordStatus,
    ): ImportResult {
        val languageCode = getTranslationLanguage(translationId)
        val existingTerms = bibleWordRepository.findTermsByTranslationId(translationId).toHashSet()
        val incoming = terms.map { it.trim() }.filter { it.isNotEmpty() }

        // 조사 판정용 어휘. 들어오는 목록까지 합쳐 두어야 `몸` 과 `몸에` 의 순서에 좌우되지 않는다.
        val vocabulary = existingTerms + incoming
        val filtered = status != BibleWordStatus.BLOCKED

        var imported = 0
        var skipped = 0
        val rejected = ArrayList<String>()

        incoming.forEach { term ->
            if (!existingTerms.add(term)) {
                skipped++
                return@forEach
            }
            if (filtered) {
                val normalized = bibleWordTokenizer.normalize(term, languageCode)
                if (normalized == null || (normalized != term && normalized in vocabulary)) {
                    rejected += term
                    return@forEach
                }
            }
            bibleWordRepository.save(
                BibleWord(
                    translationId = translationId,
                    term = term,
                    category = BibleWordCategory.ETC,
                    status = status,
                )
            )
            imported++
        }

        logger.info {
            "어휘 일괄 등록: translationId=$translationId, status=$status, imported=$imported, " +
                "skipped=$skipped, rejected=${rejected.size}"
        }
        if (rejected.isNotEmpty()) {
            logger.info { "표제어가 될 수 없어 거부: ${rejected.take(REJECTED_LOG_LIMIT)}" }
        }
        return ImportResult(imported = imported, skipped = skipped, rejected = rejected.size)
    }

    /**
     * 다른 번역본의 어휘·별칭을 복사한다. 같은 언어의 두 번역본은 어휘가 대부분 겹치므로
     * 처음부터 다시 만들지 않는다. 이미 있는 표제어는 건너뛴다(멱등).
     */
    @Transactional
    fun copyFrom(sourceTranslationId: Long, targetTranslationId: Long): ImportResult {
        if (sourceTranslationId == targetTranslationId) {
            throwError(ErrorType.INVALID_PARAMETER, "source 와 target 이 같습니다")
        }
        val sourceLanguage = getTranslationLanguage(sourceTranslationId)
        val targetLanguage = getTranslationLanguage(targetTranslationId)
        if (sourceLanguage != targetLanguage) {
            throwError(ErrorType.INVALID_PARAMETER, "언어가 다른 번역본끼리는 복사할 수 없습니다")
        }

        val existingTerms = bibleWordRepository.findTermsByTranslationId(targetTranslationId).toHashSet()
        val sourceWords = bibleWordRepository.findByTranslationId(sourceTranslationId)
        val aliasesByWordId = bibleWordAliasRepository
            .findByTranslationId(sourceTranslationId)
            .groupBy { it.bibleWordId }

        var imported = 0
        var skipped = 0
        sourceWords.forEach { source ->
            if (!existingTerms.add(source.term)) {
                skipped++
                return@forEach
            }
            val copied = bibleWordRepository.save(
                BibleWord(
                    translationId = targetTranslationId,
                    term = source.term,
                    category = source.category,
                    status = source.status,
                    dictionaryId = source.dictionaryId,
                    note = source.note,
                )
            )
            val sourceAliases = aliasesByWordId[source.id].orEmpty()
            replaceAliases(copied, sourceAliases.map { it.alias })
            imported++
        }

        logger.info {
            "어휘 복사: $sourceTranslationId -> $targetTranslationId, imported=$imported, skipped=$skipped"
        }
        return ImportResult(imported = imported, skipped = skipped)
    }

    // ------------ Private Methods ------------

    /**
     * 언어는 **`BibleTranslationType` enum 이 권위 있는 출처**다. `bible_translation.language_code`
     * 컬럼은 관리자 API 에서 `translationType` 과 따로 입력받아 KRV + `en` 같은 조합을 막지 못한다.
     * 그러면 한국어 본문을 영어 규칙으로 토크나이즈하는데, 화면에는 이상한 단어 목록으로만 보여
     * 알아채기 어렵다.
     */
    private fun getTranslationLanguage(translationId: Long): LanguageCode =
        bibleTranslationRepository.findByIdOrNull(translationId)?.translationType?.language
            ?: throwError(ErrorType.TRANSLATION_NOT_FOUND, "translationId=$translationId")

    /**
     * 별칭을 통째로 교체한다.
     *
     * 조사 결합형(`땅에`, `땅을`)은 별칭이 아니다. 그건 정규화 규칙의 결함이므로 토크나이저에서
     * 고쳐야 한다. 여기서는 막지 않지만 관리자 화면 입력란에 안내 문구를 둔다.
     */
    private fun replaceAliases(word: BibleWord, aliases: List<String>) {
        val wordId = word.id ?: throwError(ErrorType.BIBLE_WORD_NOT_FOUND)
        bibleWordAliasRepository.deleteByBibleWordId(wordId)

        val distinct = aliases.map { it.trim() }.filter { it.isNotEmpty() }.distinct()
        distinct.forEach { alias ->
            if (alias == word.term) return@forEach
            if (bibleWordAliasRepository.existsByTranslationIdAndAlias(word.translationId, alias)) {
                throwError(ErrorType.BIBLE_WORD_DUPLICATED, alias)
            }
            bibleWordAliasRepository.save(
                BibleWordAlias(
                    bibleWordId = wordId,
                    translationId = word.translationId,
                    alias = alias,
                )
            )
        }
    }

    /**
     * @param skipped 이미 있는 표제어라 건너뜀
     * @param rejected 표제어가 될 수 없어 거부 (조사가 붙어 있거나 활용형)
     */
    data class ImportResult(
        val imported: Int,
        val skipped: Int,
        val rejected: Int = 0,
    )

    companion object {
        private const val REJECTED_LOG_LIMIT = 50
    }
}
