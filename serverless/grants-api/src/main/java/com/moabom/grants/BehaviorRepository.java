package com.moabom.grants;

import java.util.List;

public interface BehaviorRepository {
    List<UserBehavior> listByUser(String userId);

    BehaviorWriteResult saveBehavior(UserBehavior behavior);

    ScrapDeleteResult deleteScrap(String userId, String grantId);

    /** 모든 사용자의 행동 중 occurredAt 이 since(ISO 시각) 이후인 것. 실시간 HOT 순위 집계용. */
    List<UserBehavior> listSince(String since);
}
