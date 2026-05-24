package com.elseeker.game.application.service

import com.elseeker.game.adapter.output.jpa.*
import com.elseeker.game.domain.event.GameCompletedEvent
import com.elseeker.game.domain.model.GameRanking
import com.elseeker.game.domain.vo.GameType
import com.elseeker.member.adapter.output.jpa.MemberRepository
import com.elseeker.member.domain.model.Member
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.dao.DataAccessException
import org.springframework.data.domain.PageRequest
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Propagation
import org.springframework.transaction.annotation.Transactional
import org.springframework.transaction.event.TransactionPhase
import org.springframework.transaction.event.TransactionalEventListener
import java.math.BigDecimal
import java.math.RoundingMode

@Service
class GameRankingService(
    private val gameRankingRepository: GameRankingRepository,
    private val memberRepository: MemberRepository,
    private val oxStageAttemptRepository: OxMemberStageAttemptRepository,
    private val quizStageAttemptRepository: QuizStageAttemptRepository,
    private val wordPuzzleAttemptRepository: WordPuzzleAttemptRepository,
    private val typingVerseRepository: BibleTypingVerseRepository
) {

    private val log = KotlinLogging.logger {}

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    fun onGameCompleted(event: GameCompletedEvent) {
        try {
            val member = memberRepository.getReferenceById(event.memberId)
            recalculate(member, event.gameType)
        } catch (e: DataAccessException) {
            log.warn(e) { "랭킹 갱신 실패: memberId=${event.memberId}, gameType=${event.gameType}" }
        } catch (e: Exception) {
            log.error(e) { "랭킹 갱신 중 예상치 못한 오류: memberId=${event.memberId}, gameType=${event.gameType}" }
        }
    }

    private fun recalculate(member: Member, gameType: GameType) {
        val ranking = gameRankingRepository.findByMemberAndGameType(member, gameType)
            ?: GameRanking(member = member, gameType = gameType)

        when (gameType) {
            GameType.OX_QUIZ -> recalculateOxQuiz(member, ranking)
            GameType.MULTIPLE_CHOICE -> recalculateMultipleChoice(member, ranking)
            GameType.WORD_PUZZLE -> recalculateWordPuzzle(member, ranking)
            GameType.TYPING -> recalculateTyping(member, ranking)
        }

        gameRankingRepository.save(ranking)
        gameRankingRepository.recalculateRankPositions(gameType)
    }

    @Transactional(readOnly = true)
    fun getRankings(gameType: GameType, limit: Int): List<GameRanking> {
        return gameRankingRepository.findTopByGameType(gameType, PageRequest.of(0, limit))
    }

    @Transactional(readOnly = true)
    fun getMyRanking(member: Member, gameType: GameType): GameRanking? {
        return gameRankingRepository.findByMemberAndGameType(member, gameType)
    }

    @Transactional(readOnly = true)
    fun getTotalParticipants(gameType: GameType): Long {
        return gameRankingRepository.countByGameType(gameType)
    }

    // ----------------- Private Methods -----------------
    private fun recalculateOxQuiz(member: Member, ranking: GameRanking) {
        val bestScores = oxStageAttemptRepository.findBestScoresByMember(member)
        val totalScore = bestScores.sumOf { it.bestScore ?: 0 }
        val completedCount = bestScores.size
        val perfectCount = bestScores.count { (it.bestScore ?: 0) == 10 }

        ranking.updateScore(
            rankingScore = BigDecimal(totalScore),
            completedCount = completedCount,
            perfectCount = perfectCount
        )
    }

    private fun recalculateMultipleChoice(member: Member, ranking: GameRanking) {
        val bestScores = quizStageAttemptRepository.findBestScoresByMemberAndMode(member)
        val totalScore = bestScores.sumOf { it.bestScore ?: 0 }
        val completedCount = bestScores.size
        val perfectCount = bestScores.count { (it.bestScore ?: 0) == 10 }

        ranking.updateScore(
            rankingScore = BigDecimal(totalScore),
            completedCount = completedCount,
            perfectCount = perfectCount
        )
    }

    private fun recalculateWordPuzzle(member: Member, ranking: GameRanking) {
        val bestScores = wordPuzzleAttemptRepository.findBestScoresByMember(member)
        val totalScore = bestScores.sumOf { it.bestScore ?: 0 }
        val completedCount = bestScores.size
        val perfectCount = bestScores.count { (it.bestScore ?: 0) >= 1500 }

        ranking.updateScore(
            rankingScore = BigDecimal(totalScore),
            completedCount = completedCount,
            perfectCount = perfectCount
        )
    }

    private fun recalculateTyping(member: Member, ranking: GameRanking) {
        val stats = typingVerseRepository.findTypingStatsByMember(member)
        val avgAccuracy = stats?.avgAccuracy ?: 0.0
        val avgCpm = stats?.avgCpm ?: 0.0
        val completedCount = stats?.completedCount?.toInt() ?: 0
        val perfectCount = stats?.perfectCount?.toInt() ?: 0

        // ranking_score = AVG(accuracy) × (1 + AVG(cpm) / 1000) + completed_count × 0.2 + perfect_count × 0.5
        val baseScore = avgAccuracy * (1.0 + avgCpm / 1000.0)
        val volumeBonus = completedCount * 0.2 + perfectCount * 0.5
        val totalScore = baseScore + volumeBonus

        ranking.updateScore(
            rankingScore = BigDecimal.valueOf(totalScore).setScale(2, RoundingMode.HALF_UP),
            completedCount = completedCount,
            perfectCount = perfectCount
        )
    }
}
