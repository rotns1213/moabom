package com.moabom.grants;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class ExpandedLabelsTest {
    @Test
    void acceptsEveryInterestTheMyPageOffers() {
        List<String> offered = List.of(
                "주거", "취업", "창업", "교육", "장학금", "자산형성",
                "교통", "문화", "건강·의료", "출산·육아", "생활안정", "금융·대출",
                "귀농·귀촌", "에너지·요금", "청년", "대학생");
        assertEquals(offered.size(), InterestLabels.normalize(offered).size());
        assertThrows(IllegalArgumentException.class, () -> InterestLabels.normalize(List.of("없는분야")));
    }

    @Test
    void acceptsNewHouseholdAndSpecialCodes() {
        assertEquals(List.of("MULTICULTURAL"),
                PolicyCodes.normalize(List.of("MULTICULTURAL"), PolicyCodes.HOUSEHOLDS, "가구 형태"));
        List<String> specials = List.of("BASIC_LIVING", "NEAR_POVERTY", "CARE_LEAVER", "NORTH_DEFECTOR",
                "PREGNANT", "SOLDIER", "FARMER", "DISABLED", "VETERAN", "OTHER");
        assertEquals(specials.size(), PolicyCodes.normalize(specials, PolicyCodes.SPECIALS, "특수조건").size());
        assertThrows(IllegalArgumentException.class,
                () -> PolicyCodes.normalize(List.of("UNKNOWN"), PolicyCodes.SPECIALS, "특수조건"));
    }
}
