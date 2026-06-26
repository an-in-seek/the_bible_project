package com.elseeker.analytics.adapter.output.jpa

import com.elseeker.analytics.domain.model.AppInstallBannerEvent
import org.springframework.data.jpa.repository.JpaRepository

interface AppInstallBannerEventRepository : JpaRepository<AppInstallBannerEvent, Long>
