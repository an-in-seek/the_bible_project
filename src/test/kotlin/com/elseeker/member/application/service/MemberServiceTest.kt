package com.elseeker.member.application.service

import com.elseeker.bible.adapter.output.jpa.BibleBookMemoRepository
import com.elseeker.bible.adapter.output.jpa.BibleChapterMemoRepository
import com.elseeker.bible.adapter.output.jpa.BibleHighlightRepository
import com.elseeker.bible.adapter.output.jpa.BibleMemoRepository
import com.elseeker.bible.adapter.output.jpa.BibleReadingProgressRepository
import com.elseeker.bible.domain.model.*
import com.elseeker.common.IntegrationTest
import com.elseeker.community.adapter.output.jpa.CommentRepository
import com.elseeker.community.adapter.output.jpa.PostRepository
import com.elseeker.community.domain.model.Comment
import com.elseeker.community.domain.model.Post
import com.elseeker.community.domain.vo.PostType
import com.elseeker.game.adapter.output.jpa.OxMemberQuestionAttemptRepository
import com.elseeker.game.adapter.output.jpa.OxMemberStageAttemptRepository
import com.elseeker.game.adapter.output.jpa.OxQuestionRepository
import com.elseeker.game.adapter.output.jpa.OxStageRepository
import com.elseeker.game.adapter.output.jpa.QuizQuestionAttemptRepository
import com.elseeker.game.adapter.output.jpa.QuizQuestionRepository
import com.elseeker.game.adapter.output.jpa.QuizStageAttemptRepository
import com.elseeker.game.adapter.output.jpa.QuizStageRepository
import com.elseeker.game.adapter.output.jpa.WordPuzzleAttemptCellRepository
import com.elseeker.game.adapter.output.jpa.WordPuzzleAttemptRepository
import com.elseeker.game.adapter.output.jpa.WordPuzzleEntryRepository
import com.elseeker.game.adapter.output.jpa.WordPuzzleHintUsageRepository
import com.elseeker.game.adapter.output.jpa.WordPuzzleRepository
import com.elseeker.game.domain.model.*
import com.elseeker.game.domain.vo.ClueType
import com.elseeker.game.domain.vo.HintType
import com.elseeker.game.domain.vo.PuzzleDirection
import com.elseeker.game.domain.vo.QuizDifficulty
import com.elseeker.game.domain.vo.QuizStageAttemptMode
import com.elseeker.member.adapter.output.jpa.MemberRepository
import com.elseeker.study.adapter.output.jpa.DictionaryRepository
import com.elseeker.study.domain.model.Dictionary
import com.neovisionaries.i18n.CountryCode
import com.neovisionaries.i18n.LanguageCode
import io.kotest.matchers.collections.shouldBeEmpty
import io.kotest.matchers.shouldBe
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import java.time.Instant

@DisplayName("MemberService 통합테스트")
class MemberServiceTest @Autowired constructor(
    private val memberService: MemberService,
    private val memberRepository: MemberRepository,
    private val quizStageRepository: QuizStageRepository,
    private val quizQuestionRepository: QuizQuestionRepository,
    private val quizStageAttemptRepository: QuizStageAttemptRepository,
    private val quizQuestionAttemptRepository: QuizQuestionAttemptRepository,
    private val oxStageRepository: OxStageRepository,
    private val oxQuestionRepository: OxQuestionRepository,
    private val oxMemberStageAttemptRepository: OxMemberStageAttemptRepository,
    private val oxMemberQuestionAttemptRepository: OxMemberQuestionAttemptRepository,
    private val wordPuzzleRepository: WordPuzzleRepository,
    private val wordPuzzleEntryRepository: WordPuzzleEntryRepository,
    private val wordPuzzleAttemptRepository: WordPuzzleAttemptRepository,
    private val wordPuzzleAttemptCellRepository: WordPuzzleAttemptCellRepository,
    private val wordPuzzleHintUsageRepository: WordPuzzleHintUsageRepository,
    private val dictionaryRepository: DictionaryRepository,
    private val bibleMemoRepository: BibleMemoRepository,
    private val bibleChapterMemoRepository: BibleChapterMemoRepository,
    private val bibleBookMemoRepository: BibleBookMemoRepository,
    private val bibleHighlightRepository: BibleHighlightRepository,
    private val bibleReadingProgressRepository: BibleReadingProgressRepository,
    private val postRepository: PostRepository,
    private val commentRepository: CommentRepository,
) : IntegrationTest() {

    @Test
    fun `회원 삭제 시 성경 개인 데이터가 함께 삭제되고 FK 위반 없이 완료된다`() {
        // given — 성경 개인 데이터는 member 를 단방향 @ManyToOne 으로만 참조한다.
        // 파생 삭제(deleteAllByMember)는 flush 가 지연되어 member 삭제와 순서가 꼬일 수 있으므로 이를 검증한다.
        bibleBookMemoRepository.save(
            BibleBookMemo(
                member = member,
                translationId = 1L,
                bookOrder = 1,
                content = "테스트 책 메모"
            )
        )
        bibleChapterMemoRepository.save(
            BibleChapterMemo(
                member = member,
                translationId = 1L,
                bookOrder = 1,
                chapterNumber = 1,
                content = "테스트 장 메모"
            )
        )
        bibleMemoRepository.save(
            BibleVerseMemo(
                member = member,
                translationId = 1L,
                bookOrder = 1,
                chapterNumber = 1,
                verseNumber = 1,
                content = "테스트 메모"
            )
        )
        bibleHighlightRepository.save(
            BibleVerseHighlight(
                member = member,
                translationId = 1L,
                bookOrder = 1,
                chapterNumber = 1,
                verseNumber = 2,
                color = BibleHighlightColor.YELLOW
            )
        )
        bibleReadingProgressRepository.save(
            BibleReadingProgress(
                member = member,
                translationId = 1L,
                bookOrder = 1,
                chapterNumber = 1,
            )
        )
        bibleBookMemoRepository.count() shouldBe 1
        bibleChapterMemoRepository.count() shouldBe 1
        bibleMemoRepository.count() shouldBe 1
        bibleHighlightRepository.count() shouldBe 1
        bibleReadingProgressRepository.count() shouldBe 1

        // when
        memberService.deleteMember(member.uid, member.uid)

        // then
        bibleBookMemoRepository.count() shouldBe 0
        bibleChapterMemoRepository.count() shouldBe 0
        bibleMemoRepository.count() shouldBe 0
        bibleHighlightRepository.count() shouldBe 0
        bibleReadingProgressRepository.count() shouldBe 0
        memberRepository.findByUid(member.uid) shouldBe null
    }

    @Test
    fun `회원 삭제 시 퀴즈 시도와 문항 시도가 함께 삭제된다`() {
        // given
        val stage = quizStageRepository.save(
            QuizStage(stageNumber = 1, title = "테스트 스테이지")
        )
        val question = QuizQuestion(
            stage = stage,
            questionText = "테스트 문제",
            answerIndex = 0
        )
        question.addOption(
            QuizQuestionOption(
                question = question,
                optionText = "테스트 보기",
                optionIndex = 0
            )
        )
        val savedQuestion = quizQuestionRepository.save(question)

        val stageAttempt = quizStageAttemptRepository.save(
            QuizMemberStageAttempt(
                member = member,
                stageNumber = stage.stageNumber,
                mode = QuizStageAttemptMode.RECORD,
                score = 0,
                questionCount = 1,
                startedAt = Instant.now()
            )
        )

        quizQuestionAttemptRepository.save(
            QuizMemberQuestionAttempt(
                stageAttempt = stageAttempt,
                question = savedQuestion,
                selectedIndex = 0,
                isCorrect = true,
                answeredAt = Instant.now()
            )
        )

        quizStageAttemptRepository.findAllByMember(member).size shouldBe 1
        quizQuestionAttemptRepository.count() shouldBe 1

        // when
        memberService.deleteMember(member.uid, member.uid)

        // then
        quizQuestionAttemptRepository.count() shouldBe 0
        quizStageAttemptRepository.findAllByMember(member).shouldBeEmpty()
    }

    @Test
    fun `회원 삭제 시 OX 퀴즈 스테이지 시도와 문항 시도가 함께 삭제된다`() {
        // given
        val stage = oxStageRepository.save(
            OxStage(stageNumber = 1, bookName = "창세기")
        )
        val question = oxQuestionRepository.save(
            OxQuestion(
                stage = stage,
                questionText = "OX 테스트 문제",
                correctAnswer = true,
                orderIndex = 1
            )
        )
        val stageAttempt = oxMemberStageAttemptRepository.save(
            OxMemberStageAttempt(
                member = member,
                stageNumber = stage.stageNumber,
                startedAt = Instant.now()
            )
        )
        oxMemberQuestionAttemptRepository.save(
            OxMemberQuestionAttempt(
                stageAttempt = stageAttempt,
                question = question,
                selectedAnswer = true,
                isCorrect = true,
                answeredAt = Instant.now()
            )
        )

        oxMemberStageAttemptRepository.count() shouldBe 1
        oxMemberQuestionAttemptRepository.count() shouldBe 1

        // when
        memberService.deleteMember(member.uid, member.uid)

        // then — 자식(문항 시도)이 먼저, 부모(스테이지 시도)가 그 다음 삭제되어야 한다
        oxMemberQuestionAttemptRepository.count() shouldBe 0
        oxMemberStageAttemptRepository.count() shouldBe 0
    }

    @Test
    fun `회원 삭제 시 워드 퍼즐 시도와 자식(셀-힌트 사용)이 함께 삭제된다`() {
        // given
        val puzzle = wordPuzzleRepository.save(
            WordPuzzle(
                title = "테스트 퍼즐",
                themeCode = "test",
                difficultyCode = QuizDifficulty.NORMAL,
                boardWidth = 5,
                boardHeight = 5
            )
        )
        val dictionary = dictionaryRepository.save(Dictionary(term = "테스트 용어"))
        val entry = wordPuzzleEntryRepository.save(
            WordPuzzleEntry(
                wordPuzzle = puzzle,
                dictionary = dictionary,
                answerText = "답",
                directionCode = PuzzleDirection.ACROSS,
                startRow = 0,
                startCol = 0,
                clueNumber = 1,
                clueTypeCode = ClueType.DEFINITION,
                clueText = "단서"
            )
        )
        val attempt = WordPuzzleAttempt(member = member, wordPuzzle = puzzle)
        attempt.cells.add(WordPuzzleAttemptCell(attempt = attempt, rowIndex = 0, colIndex = 0))
        attempt.hintUsages.add(
            WordPuzzleHintUsage(attempt = attempt, entry = entry, hintTypeCode = HintType.REVEAL_LETTER)
        )
        wordPuzzleAttemptRepository.save(attempt) // cascade로 셀/힌트 사용 저장

        wordPuzzleAttemptRepository.count() shouldBe 1
        wordPuzzleAttemptCellRepository.count() shouldBe 1
        wordPuzzleHintUsageRepository.count() shouldBe 1

        // when
        memberService.deleteMember(member.uid, member.uid)

        // then — 자식(셀/힌트 사용)이 먼저, 부모(시도)가 그 다음 삭제되어야 한다
        wordPuzzleAttemptCellRepository.count() shouldBe 0
        wordPuzzleHintUsageRepository.count() shouldBe 0
        wordPuzzleAttemptRepository.count() shouldBe 0
    }

    @Test
    fun `회원 삭제 시 작성한 게시글과 댓글은 보존되고 작성자가 익명 센티넬로 재지정된다`() {
        // given
        val post = postRepository.save(
            Post.create(
                author = member,
                postType = PostType.FREE,
                language = LanguageCode.ko,
                country = CountryCode.KR,
                title = "테스트 제목",
                content = "테스트 내용"
            )
        )
        val comment = commentRepository.save(
            Comment.create(
                post = post,
                author = member,
                content = "테스트 댓글"
            )
        )

        // when
        memberService.deleteMember(member.uid, member.uid)

        // then — 회원은 삭제되지만 게시글/댓글은 보존되고 작성자만 센티넬로 재지정된다
        memberRepository.findByUid(member.uid) shouldBe null
        postRepository.findByIdWithAuthor(post.id!!)?.author?.nickname shouldBe "탈퇴한 사용자"
        commentRepository.findByIdWithAuthor(comment.id!!)?.author?.nickname shouldBe "탈퇴한 사용자"
        memberRepository.findByEmail("withdrawn-user@system.elseeker")?.nickname shouldBe "탈퇴한 사용자"
    }
}
