package com.elseeker.member.application.service

import com.elseeker.bible.adapter.output.jpa.BibleBookMemoRepository
import com.elseeker.bible.adapter.output.jpa.BibleChapterMemoRepository
import com.elseeker.bible.adapter.output.jpa.BibleHighlightRepository
import com.elseeker.bible.adapter.output.jpa.BibleMemoRepository
import com.elseeker.bible.adapter.output.jpa.BibleReadingProgressRepository
import com.elseeker.common.domain.ErrorType
import com.elseeker.common.domain.throwError
import com.elseeker.community.adapter.output.jpa.CommentRepository
import com.elseeker.community.adapter.output.jpa.PostRepository
import com.elseeker.game.adapter.output.jpa.BibleTypingSessionRepository
import com.elseeker.game.adapter.output.jpa.GameRankingRepository
import com.elseeker.game.adapter.output.jpa.MemberDictionaryProgressRepository
import com.elseeker.game.adapter.output.jpa.OxMemberQuestionAttemptRepository
import com.elseeker.game.adapter.output.jpa.OxMemberStageAttemptRepository
import com.elseeker.game.adapter.output.jpa.QuizProgressRepository
import com.elseeker.game.adapter.output.jpa.QuizQuestionAttemptRepository
import com.elseeker.game.adapter.output.jpa.QuizQuestionStatRepository
import com.elseeker.game.adapter.output.jpa.QuizStageAttemptRepository
import com.elseeker.game.adapter.output.jpa.QuizStageProgressRepository
import com.elseeker.game.adapter.output.jpa.WordPuzzleAttemptCellRepository
import com.elseeker.game.adapter.output.jpa.WordPuzzleAttemptRepository
import com.elseeker.game.adapter.output.jpa.WordPuzzleHintUsageRepository
import com.elseeker.member.adapter.output.jpa.MemberOAuthAccountRepository
import com.elseeker.member.adapter.output.jpa.MemberRepository
import com.elseeker.member.adapter.output.jpa.MemberWithdrawalAuditRepository
import com.elseeker.member.domain.model.Member
import com.elseeker.member.domain.model.MemberWithdrawalAudit
import com.elseeker.member.domain.vo.MemberRole
import com.elseeker.member.domain.vo.OAuthProvider
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.*

@Service
class MemberService(
    private val memberRepository: MemberRepository,
    private val memberOAuthAccountRepository: MemberOAuthAccountRepository,
    private val bibleMemoRepository: BibleMemoRepository,
    private val bibleChapterMemoRepository: BibleChapterMemoRepository,
    private val bibleBookMemoRepository: BibleBookMemoRepository,
    private val bibleHighlightRepository: BibleHighlightRepository,
    private val bibleReadingProgressRepository: BibleReadingProgressRepository,
    private val bibleTypingSessionRepository: BibleTypingSessionRepository,
    private val quizProgressRepository: QuizProgressRepository,
    private val quizStageAttemptRepository: QuizStageAttemptRepository,
    private val quizQuestionAttemptRepository: QuizQuestionAttemptRepository,
    private val quizStageProgressRepository: QuizStageProgressRepository,
    private val quizQuestionStatRepository: QuizQuestionStatRepository,
    private val oxMemberQuestionAttemptRepository: OxMemberQuestionAttemptRepository,
    private val oxMemberStageAttemptRepository: OxMemberStageAttemptRepository,
    private val wordPuzzleAttemptCellRepository: WordPuzzleAttemptCellRepository,
    private val wordPuzzleHintUsageRepository: WordPuzzleHintUsageRepository,
    private val wordPuzzleAttemptRepository: WordPuzzleAttemptRepository,
    private val gameRankingRepository: GameRankingRepository,
    private val memberDictionaryProgressRepository: MemberDictionaryProgressRepository,
    private val postRepository: PostRepository,
    private val commentRepository: CommentRepository,
    private val memberWithdrawalAuditRepository: MemberWithdrawalAuditRepository,
) {

    companion object {
        /** 탈퇴 회원이 작성한 커뮤니티 글의 작성자를 넘겨받는 익명 센티넬 계정. */
        private const val WITHDRAWN_SENTINEL_EMAIL = "withdrawn-user@system.elseeker"
        private const val WITHDRAWN_SENTINEL_NICKNAME = "탈퇴한 사용자"
    }

    // TODO: 회원(Member) 가입

    // TODO: 회원(Member) 정보 조회

    // TODO: 회원(Member) 정보 수정

    @Transactional(readOnly = true)
    fun getMember(memberUid: UUID) = memberRepository.findByUid(memberUid)
        ?: throwError(ErrorType.MEMBER_NOT_FOUND, memberUid)

    @Transactional(readOnly = true)
    fun getMemberWithOAuthAccounts(memberUid: UUID) = memberRepository.findWithOAuthAccountsByUid(memberUid)
        ?: throwError(ErrorType.MEMBER_NOT_FOUND, memberUid)

    /** 인증 주체 검증용 nullable 조회 — orphaned session(유효 토큰 + 없는 회원)을 401로 처리하기 위함. */
    @Transactional(readOnly = true)
    fun findMember(memberUid: UUID) = memberRepository.findByUid(memberUid)

    @Transactional(readOnly = true)
    fun findMemberWithOAuthAccounts(memberUid: UUID) = memberRepository.findWithOAuthAccountsByUid(memberUid)

    @Transactional
    fun deleteMember(memberUid: UUID, principalUid: UUID) {
        if (memberUid != principalUid) {
            throwError(ErrorType.MEMBER_ACCESS_DENIED, memberUid)
        }
        val member = getMember(memberUid)
        val memberId = member.id ?: throwError(ErrorType.MEMBER_ID_MISSING, memberUid)
        memberWithdrawalAuditRepository.save(
            MemberWithdrawalAudit(
                memberUid = member.uid,
                email = member.email,
                nickname = member.nickname
            )
        )
        bibleMemoRepository.deleteAllByMemberId(memberId)
        bibleChapterMemoRepository.deleteAllByMemberId(memberId)
        bibleBookMemoRepository.deleteAllByMemberId(memberId)
        bibleHighlightRepository.deleteAllByMemberId(memberId)
        bibleReadingProgressRepository.deleteAllByMemberId(memberId)
        bibleTypingSessionRepository.deleteAllByMember(member)
        quizQuestionAttemptRepository.deleteAllByMember(member)
        quizStageAttemptRepository.deleteAllByMember(member)
        quizQuestionStatRepository.deleteAllByMember(member)
        quizStageProgressRepository.deleteAllByMember(member)
        quizProgressRepository.deleteAllByMember(member)
        // OX 퀴즈: 자식(문제 시도) → 부모(스테이지 시도) 순서로 삭제 (벌크 삭제는 cascade 미적용)
        oxMemberQuestionAttemptRepository.deleteAllByMemberId(memberId)
        oxMemberStageAttemptRepository.deleteAllByMemberId(memberId)
        // 워드 퍼즐: 자식(셀/힌트 사용) → 부모(시도) 순서로 삭제 (벌크 삭제는 cascade 미적용)
        wordPuzzleAttemptCellRepository.deleteAllByMemberId(memberId)
        wordPuzzleHintUsageRepository.deleteAllByMemberId(memberId)
        wordPuzzleAttemptRepository.deleteAllByMemberId(memberId)
        gameRankingRepository.deleteAllByMemberId(memberId)
        memberDictionaryProgressRepository.deleteAllByMemberId(memberId)
        // 커뮤니티(게시글/댓글)는 정책상 보존 — 작성자만 익명 센티넬 계정으로 재지정하여 회원 삭제를 허용
        val sentinel = getOrCreateWithdrawnSentinel()
        if (sentinel.id != memberId) {
            postRepository.reassignAuthor(memberId, sentinel)
            commentRepository.reassignAuthor(memberId, sentinel)
        }
        memberOAuthAccountRepository.deleteAllByMember(member)
        // 위 deleteAllByMember 들은 파생(derived) 삭제라 flush가 커밋까지 지연된다.
        // member 삭제와 같은 flush에 섞이면 Hibernate가 member를 자식보다 먼저 삭제해 FK 위반이 난다.
        // 자식 삭제를 먼저 DB에 반영(flush)한 뒤 member를 삭제한다.
        memberRepository.flush()
        memberRepository.delete(member)
    }

    /**
     * 익명 센티넬 계정을 조회하거나, 없으면 생성한다. 로그인 불가(OAuth 미연결) 시스템 계정.
     *
     * 탈퇴 트랜잭션과 같은 커넥션/트랜잭션에서 처리한다. (로컬 풀 크기가 1이라 별도 트랜잭션을
     * 여는 REQUIRES_NEW 방식은 커넥션 고갈로 데드락을 유발하므로 사용하지 않는다.)
     * 동시 최초 탈퇴가 겹치면 이메일 unique 제약 위반으로 한쪽 탈퇴가 실패해 재시도가 필요할 수 있으나,
     * 센티넬은 최초 1회만 생성되므로 그 외에는 항상 조회로 처리된다.
     */
    private fun getOrCreateWithdrawnSentinel(): Member =
        memberRepository.findByEmail(WITHDRAWN_SENTINEL_EMAIL)
            ?: memberRepository.save(
                Member.create(
                    email = WITHDRAWN_SENTINEL_EMAIL,
                    nickname = WITHDRAWN_SENTINEL_NICKNAME,
                    profileImageUrl = null,
                    memberRole = MemberRole.USER,
                )
            )

    @Transactional
    fun updateMember(memberUid: UUID, principalUid: UUID, nickname: String, profileImageUrl: String?): Member {
        if (memberUid != principalUid) {
            throwError(ErrorType.MEMBER_ACCESS_DENIED, memberUid)
        }
        val member = getMember(memberUid)
        val normalizedNickname = nickname.trim()
        val memberId = member.id ?: throwError(ErrorType.MEMBER_ID_MISSING, memberUid)
        if (memberRepository.existsByNicknameIgnoreCaseAndIdNot(normalizedNickname, memberId)) {
            throwError(ErrorType.NICKNAME_ALREADY_EXISTS)
        }
        member.update(nickname, profileImageUrl)
        memberRepository.save(member)
        return memberRepository.findWithOAuthAccountsByUid(memberUid)
            ?: member
    }

    // 소셜 계정 연동(providerUserId 직접 신뢰)은 보안상 제거됨.
    // 연동은 토큰 검증을 거치는 SocialLoginService.linkAccount (POST /api/v1/auth/social-login intent=link) 로 일원화.

    @Transactional(readOnly = true)
    fun getOAuthAccounts(memberUid: UUID, principalUid: UUID) =
        if (memberUid != principalUid) {
            throwError(ErrorType.MEMBER_ACCESS_DENIED, memberUid)
        } else {
            memberOAuthAccountRepository.findAllByMemberUid(memberUid)
        }

    @Transactional
    fun unlinkOAuthAccount(
        memberUid: UUID,
        principalUid: UUID,
        providerRegistrationId: String,
        providerUserId: String
    ): Member {
        if (memberUid != principalUid) {
            throwError(ErrorType.MEMBER_ACCESS_DENIED, memberUid)
        }
        if (providerRegistrationId.isBlank()) {
            throwError(ErrorType.INVALID_PARAMETER, "provider")
        }
        if (providerUserId.isBlank()) {
            throwError(ErrorType.OAUTH_PROVIDER_USER_ID_MISSING, providerRegistrationId)
        }
        val provider = runCatching { OAuthProvider.fromRegistrationId(providerRegistrationId) }
            .getOrElse { throwError(ErrorType.INVALID_PARAMETER, providerRegistrationId) }
        val member = getMember(memberUid)
        val account = memberOAuthAccountRepository.findByProviderAndProviderUserId(provider, providerUserId)
            ?: throwError(ErrorType.OAUTH_ACCOUNT_NOT_FOUND, provider.registrationId)
        if (account.member.id != member.id) {
            throwError(ErrorType.MEMBER_ACCESS_DENIED, memberUid)
        }
        member.removeOAuthAccount(account)
        return memberRepository.save(member)
    }

    @Transactional
    fun initializeProfileFromOAuthAccount(
        memberUid: UUID,
        principalUid: UUID,
        providerRegistrationId: String,
        providerUserId: String
    ): Member {
        if (memberUid != principalUid) {
            throwError(ErrorType.MEMBER_ACCESS_DENIED, memberUid)
        }
        if (providerRegistrationId.isBlank()) {
            throwError(ErrorType.INVALID_PARAMETER, "provider")
        }
        if (providerUserId.isBlank()) {
            throwError(ErrorType.OAUTH_PROVIDER_USER_ID_MISSING, providerRegistrationId)
        }
        val provider = runCatching { OAuthProvider.fromRegistrationId(providerRegistrationId) }
            .getOrElse { throwError(ErrorType.INVALID_PARAMETER, providerRegistrationId) }
        val member = getMember(memberUid)
        val account = memberOAuthAccountRepository.findByProviderAndProviderUserId(provider, providerUserId)
            ?: throwError(ErrorType.OAUTH_ACCOUNT_NOT_FOUND, provider.registrationId)
        if (account.member.id != member.id) {
            throwError(ErrorType.MEMBER_ACCESS_DENIED, memberUid)
        }
        member.initializeProfileFromOAuth(account.nickname, account.profileImageUrl)
        return memberRepository.save(member)
    }

}
