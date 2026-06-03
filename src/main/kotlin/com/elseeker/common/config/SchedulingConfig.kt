package com.elseeker.common.config

import org.springframework.context.annotation.Configuration
import org.springframework.scheduling.annotation.EnableScheduling

/**
 * 스케줄링 활성화 설정.
 * 가입 동의 미완(PENDING_CONSENT) 회원 정리 배치 등에 사용된다.
 */
@Configuration
@EnableScheduling
class SchedulingConfig
