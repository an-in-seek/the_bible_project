package com.elseeker.member.domain.vo

import com.elseeker.common.domain.ErrorType
import com.elseeker.common.domain.throwError
import jakarta.persistence.AttributeConverter
import jakarta.persistence.Converter

enum class OAuthProvider(val registrationId: String) {
    GOOGLE("google"),
    NAVER("naver"),
    KAKAO("kakao"),
    APPLE("apple");

    companion object {
        fun fromRegistrationId(registrationId: String): OAuthProvider {
            val normalized = registrationId.lowercase()
            return entries.firstOrNull { it.registrationId == normalized }
                ?: throwError(ErrorType.INVALID_PARAMETER)
        }

        fun fromDbValue(dbValue: String): OAuthProvider {
            return entries.firstOrNull { it.registrationId == dbValue }
                ?: throw IllegalArgumentException("알 수 없는 OAuthProvider DB 값: $dbValue")
        }
    }
}

@Converter
class OAuthProviderConverter : AttributeConverter<OAuthProvider, String> {
    override fun convertToDatabaseColumn(attribute: OAuthProvider?): String? {
        return attribute?.registrationId
    }

    override fun convertToEntityAttribute(dbData: String?): OAuthProvider? {
        return dbData?.let { OAuthProvider.fromDbValue(it) }
    }
}
