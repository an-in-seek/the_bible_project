package com.elseeker.member.domain.model

import com.elseeker.common.domain.BaseTimeEntity
import com.elseeker.common.domain.ErrorType
import com.elseeker.common.domain.throwError
import com.elseeker.member.domain.vo.MemberRole
import com.elseeker.member.domain.vo.MemberStatus
import com.elseeker.member.domain.vo.OAuthProvider
import jakarta.persistence.*
import org.springframework.data.jpa.domain.support.AuditingEntityListener
import java.util.*

@Entity
@Table(
    name = "member",
    uniqueConstraints = [
        UniqueConstraint(
            name = "uk_member_uid",
            columnNames = ["uid"]
        ),
        UniqueConstraint(
            name = "uk_member_email",
            columnNames = ["email"]
        )
    ],
    indexes = [
        // 동의 미완 회원 정리 배치(findByStatusAndCreatedAtBefore) 지원
        Index(name = "idx_member_status_created_at", columnList = "status, created_at")
    ]
)
@EntityListeners(AuditingEntityListener::class)
class Member(

    id: Long? = null,

    @Column(nullable = false, unique = true, columnDefinition = "uuid default gen_random_uuid()")
    var uid: UUID = UUID.randomUUID(),

    @Column(nullable = false, length = 255, unique = true)
    var email: String,

    @Column(nullable = false, length = 50)
    var nickname: String = "",

    @Column(length = 512)
    var profileImageUrl: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    var memberRole: MemberRole = MemberRole.USER,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    var status: MemberStatus = MemberStatus.ACTIVE,
) : BaseTimeEntity(
    id = id,
) {

    @OneToMany(mappedBy = "member", cascade = [CascadeType.ALL], orphanRemoval = true, fetch = FetchType.LAZY)
    val oauthAccounts: MutableSet<MemberOAuthAccount> = mutableSetOf()

    companion object {

        fun create(
            email: String,
            nickname: String,
            profileImageUrl: String?,
            memberRole: MemberRole,
            status: MemberStatus = MemberStatus.ACTIVE
        ) = Member(
            email = email,
            nickname = nickname,
            profileImageUrl = profileImageUrl,
            memberRole = memberRole,
            status = status
        )
    }

    /** 동의 완료 처리 — 가입 대기(PENDING_CONSENT) 상태를 정상(ACTIVE)으로 전환. */
    fun activate() {
        this.status = MemberStatus.ACTIVE
    }

    val isPendingConsent: Boolean
        get() = this.status == MemberStatus.PENDING_CONSENT

    fun update(
        nickname: String,
        profileImageUrl: String?
    ) {
        val trimmed = nickname.trim()
        if (trimmed.isBlank()) {
            throwError(ErrorType.REQUIRED_NICKNAME)
        }
        if (trimmed.contains(' ')) {
            throwError(ErrorType.INVALID_NICKNAME_FORMAT)
        }
        this.nickname = nickname.trim()
        profileImageUrl?.let { this.profileImageUrl = it }
    }

    fun addOAuthAccount(
        provider: OAuthProvider,
        providerUserId: String,
        email: String? = null,
        oauthNickname: String? = null,
        oauthProfileImageUrl: String? = null
    ): MemberOAuthAccount {
        val account = MemberOAuthAccount.create(
            member = this,
            provider = provider,
            providerUserId = providerUserId,
            email = email,
            nickname = oauthNickname,
            profileImageUrl = oauthProfileImageUrl
        )
        oauthAccounts.add(account)
        return account
    }

    fun removeOAuthAccount(account: MemberOAuthAccount) {
        oauthAccounts.remove(account)
    }

    fun initializeProfileFromOAuth(oauthNickname: String?, oauthProfileImageUrl: String?) {
        if (this.nickname.isBlank() && !oauthNickname.isNullOrBlank()) {
            this.nickname = oauthNickname
        }
        if (this.profileImageUrl.isNullOrBlank() && !oauthProfileImageUrl.isNullOrBlank()) {
            this.profileImageUrl = oauthProfileImageUrl
        }
    }

}
