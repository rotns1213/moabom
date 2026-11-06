package com.moabom.grants;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PopularGrantsHandlerTest {
    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final Clock NOW = Clock.fixed(Instant.parse("2026-11-06T09:00:00Z"), ZoneOffset.UTC);

    @Test
    void ranksByRecentViewsAndScrapsAndShowsChange() throws Exception {
        List<Grant> grants = List.of(grant("g1"), grant("g2"), grant("g3"), grant("g4"), grant("g5"), grant("g6"));
        List<UserBehavior> log = new ArrayList<>(List.of(
                // 이번 주: g2 = 스크랩 2번(6점), g1 = 조회 2번(2점), g3 = 조회 1번(1점)
                new UserBehavior("a", BehaviorType.SCRAP, "g2", "2026-11-05T10:00:00Z"),
                new UserBehavior("b", BehaviorType.SCRAP, "g2", "2026-11-04T10:00:00Z"),
                new UserBehavior("a", BehaviorType.VIEW, "g1", "2026-11-05T11:00:00Z"),
                new UserBehavior("c", BehaviorType.VIEW, "g1", "2026-11-03T11:00:00Z"),
                new UserBehavior("c", BehaviorType.VIEW, "g3", "2026-11-02T11:00:00Z"),
                // 지난주: g1 1위, g3 2위
                new UserBehavior("d", BehaviorType.SCRAP, "g1", "2026-10-28T10:00:00Z"),
                new UserBehavior("d", BehaviorType.VIEW, "g3", "2026-10-27T10:00:00Z"),
                // 2주보다 오래된 기록은 빠진다
                new UserBehavior("e", BehaviorType.SCRAP, "g6", "2026-10-01T10:00:00Z")
        ));
        var handler = new PopularGrantsHandler(new InMemoryGrantsRepository(grants), new InMemoryBehaviorRepository(log), NOW);

        var response = handler.handleRequest(null, null);
        assertEquals(200, response.getStatusCode());
        JsonNode ranking = MAPPER.readTree(response.getBody()).get("ranking");
        assertEquals(5, ranking.size());
        assertEquals("g2", ranking.get(0).get("grant").get("grantId").asText());
        assertTrue(ranking.get(0).get("change").isNull());          // 새로 진입
        assertEquals("g1", ranking.get(1).get("grant").get("grantId").asText());
        assertEquals(-1, ranking.get(1).get("change").asInt());     // 1위 → 2위
        assertEquals("g3", ranking.get(2).get("grant").get("grantId").asText());
        assertEquals(-1, ranking.get(2).get("change").asInt());     // 2위 → 3위
        assertEquals(1, ranking.get(0).get("rank").asInt());
        assertFalse(response.getBody().contains("\"userId\""));     // 누가 봤는지는 내보내지 않음
    }

    @Test
    void fillsWithOpenGrantsWhenThereIsNoActivity() throws Exception {
        List<Grant> grants = List.of(grant("g1"), grant("g2"));
        var handler = new PopularGrantsHandler(new InMemoryGrantsRepository(grants), new InMemoryBehaviorRepository(new ArrayList<>()), NOW);
        JsonNode body = MAPPER.readTree(handler.handleRequest(null, null).getBody());
        assertEquals(2, body.get("ranking").size());
        assertEquals("2026-11-06T09:00:00Z", body.get("updatedAt").asText());
        assertEquals(0, body.get("ranking").get(0).get("change").asInt());
    }

    private static Grant grant(String id) {
        return TestGrants.grant(id, "취업", List.of("청년"), null, null, null, null, null);
    }
}
