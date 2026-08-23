package com.elseeker.bible.application.service

import com.elseeker.bible.adapter.output.jpa.BibleTranslationRepository
import com.elseeker.bible.adapter.output.jpa.BibleWordAliasRepository
import com.elseeker.bible.adapter.output.jpa.BibleWordRepository
import com.elseeker.bible.adapter.output.jpa.BibleWordStatRepository
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
     * 후보를 일괄 등록한다. 초기 구축에서 6천 건 규모를 넣어야 하므로 한 건씩 누를 수 없다.
     */
    @Transactional
    fun bulkCreateCandidates(translationId: Long, terms: List<String>): ImportResult {
        val existingTerms = bibleWordRepository.findTermsByTranslationId(translationId).toHashSet()
        var imported = 0
        var skipped = 0

        terms.asSequence()
            .map { it.trim() }
            .filter { it.isNotEmpty() }
            .forEach { term ->
                if (!existingTerms.add(term)) {
                    skipped++
                    return@forEach
                }
                bibleWordRepository.save(BibleWord.candidateOf(translationId, term))
                imported++
            }

        logger.info { "후보 일괄 등록: translationId=$translationId, imported=$imported, skipped=$skipped" }
        return ImportResult(imported = imported, skipped = skipped)
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

    data class ImportResult(
        val imported: Int,
        val skipped: Int,
    )
}
