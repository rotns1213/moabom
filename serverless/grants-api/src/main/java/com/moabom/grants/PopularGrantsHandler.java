package com.moabom.grants;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * GET /grants/popular — 실시간 HOT 지원금 순위.
 *
 * 최근 7일 동안 모든 사용자가 남긴 조회(VIEW=1점)와 스크랩(SCRAP=3점)을 더해 순위를 매긴다.
 * 바로 전 7일 순위와 비교해 change(올라간 칸 수, 새로 들어오면 null, 기록 없이 채운 칸은 0)를 함께 돌려준다.
 * 기록이 부족하면 마감이 가까운 지원금으로 5개를 채운다.
 */
public final class PopularGrantsHandler
        implements RequestHandler<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {

    static final int SIZE = 5;
    static final int VIEW_POINTS = 1;
    static final int SCRAP_POINTS = 3;
    static final Duration WINDOW = Duration.ofDays(7);
    private static final ZoneId SEOUL = ZoneId.of("Asia/Seoul");
    private static final ObjectMapper MAPPER = new ObjectMapper();

    private final GrantsRepository grants;
    private final BehaviorRepository behaviors;
    private final Clock clock;

    public PopularGrantsHandler() {
        this(DynamoGrantsRepository.fromEnvironment(), DynamoBehaviorRepository.fromEnvironment(), Clock.systemUTC());
    }

    public PopularGrantsHandler(GrantsRepository grants, BehaviorRepository behaviors, Clock clock) {
        this.grants = grants;
        this.behaviors = behaviors;
        this.clock = clock;
    }

    @Override
    public APIGatewayProxyResponseEvent handleRequest(APIGatewayProxyRequestEvent event, Context context) {
        try {
            return json(200, ranking());
        } catch (RuntimeException ex) {
            if (context != null && context.getLogger() != null) {
                context.getLogger().log("GET /grants/popular failed");
            }
            return json(500, Map.of("message", "인기 지원금 순위를 조회하지 못했습니다."));
        }
    }

    Map<String, Object> ranking() {
        Instant now = clock.instant().truncatedTo(ChronoUnit.MINUTES);
        Instant currentStart = now.minus(WINDOW);
        Instant previousStart = currentStart.minus(WINDOW);
        String today = LocalDate.ofInstant(now, SEOUL).toString();

        List<Grant> visible = grants.listAllGrants().stream()
                .filter(grant -> grant != null && !grant.sample() && grant.grantId() != null)
                .toList();
        Map<String, Grant> byId = new LinkedHashMap<>();
        for (Grant grant : visible) {
            byId.putIfAbsent(grant.grantId(), grant);
        }

        Map<String, Integer> currentScores = new HashMap<>();
        Map<String, Integer> previousScores = new HashMap<>();
        String currentFrom = currentStart.toString();
        for (UserBehavior behavior : behaviors.listSince(previousStart.toString())) {
            if (behavior.grantId() == null || !byId.containsKey(behavior.grantId())) {
                continue;
            }
            int points = behavior.type() == BehaviorType.SCRAP ? SCRAP_POINTS : VIEW_POINTS;
            Map<String, Integer> target = behavior.occurredAt().compareTo(currentFrom) >= 0
                    ? currentScores
                    : previousScores;
            target.merge(behavior.grantId(), points, Integer::sum);
        }

        List<String> current = top(byId, currentScores, today);
        List<String> previous = top(byId, previousScores, today);

        List<Map<String, Object>> ranking = new ArrayList<>();
        for (int i = 0; i < current.size(); i++) {
            String grantId = current.get(i);
            int rank = i + 1;
            int score = currentScores.getOrDefault(grantId, 0);
            int previousIndex = previousScores.getOrDefault(grantId, 0) > 0 ? previous.indexOf(grantId) : -1;
            Integer change;
            if (previousIndex >= 0) {
                change = (previousIndex + 1) - rank;   // 지난주보다 몇 칸 올랐는지(+), 내렸는지(-)
            } else if (score > 0) {
                change = null;                         // 이번 주에 새로 들어옴(NEW)
            } else {
                change = 0;                            // 기록이 없어 채워 넣은 지원금
            }
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("rank", rank);
            item.put("change", change);
            item.put("score", score);
            item.put("grant", byId.get(grantId));
            ranking.add(item);
        }
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("updatedAt", now.toString());
        body.put("ranking", ranking);
        return body;
    }

    /** 점수 높은 순으로 고르고, 부족하면 아직 마감되지 않은 지원금 중 마감이 가까운 순으로 채운다. */
    private static List<String> top(Map<String, Grant> byId, Map<String, Integer> scores, String today) {
        List<String> picked = new ArrayList<>(scores.keySet().stream()
                .sorted(Comparator.<String>comparingInt(id -> -scores.get(id)).thenComparing(id -> id))
                .limit(SIZE)
                .toList());
        if (picked.size() < SIZE) {
            byId.values().stream()
                    .filter(grant -> !picked.contains(grant.grantId()))
                    .filter(grant -> grant.endDate() == null || grant.endDate().isBlank()
                            || grant.endDate().compareTo(today) >= 0)
                    .sorted(Comparator
                            .comparing((Grant grant) -> grant.endDate() == null || grant.endDate().isBlank()
                                    ? "9999-12-31" : grant.endDate())
                            .thenComparing(Grant::grantId))
                    .limit(SIZE - picked.size())
                    .forEach(grant -> picked.add(grant.grantId()));
        }
        return picked;
    }

    private static APIGatewayProxyResponseEvent json(int statusCode, Object body) {
        try {
            Map<String, String> headers = new HashMap<>();
            headers.put("Content-Type", "application/json; charset=utf-8");
            headers.put("Access-Control-Allow-Origin", "*");
            return new APIGatewayProxyResponseEvent()
                    .withStatusCode(statusCode)
                    .withHeaders(headers)
                    .withBody(MAPPER.writeValueAsString(body))
                    .withIsBase64Encoded(false);
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("JSON 응답을 만들지 못했습니다.", ex);
        }
    }
}
