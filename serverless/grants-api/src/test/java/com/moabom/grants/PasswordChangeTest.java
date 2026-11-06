package com.moabom.grants;

import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PasswordChangeTest {
    private static final ObjectMapper MAPPER = new ObjectMapper();

    private AccessTokens tokens;
    private SignupHandler signup;
    private LoginHandler login;
    private MeHandler me;

    @BeforeEach
    void setUp() {
        tokens = new AccessTokens("unit-test-secret-not-for-deployment", new InMemoryTokenRevocationRepository());
        AuthService auth = new AuthService(new InMemoryAccountRepository(), tokens, new PasswordHashes(4));
        signup = new SignupHandler(auth);
        login = new LoginHandler(auth);
        me = new MeHandler(auth, tokens);
    }

    @Test
    void changesPasswordAfterCheckingCurrentOne() throws Exception {
        String token = signupToken();

        var wrongCurrent = me.handleRequest(patchPassword(token, "wrong-pass-9", "New-pass-22"), null);
        assertEquals(400, wrongCurrent.getStatusCode());
        assertTrue(wrongCurrent.getBody().contains("현재 비밀번호"));

        var tooShort = me.handleRequest(patchPassword(token, "Moabom-pass-1", "short1"), null);
        assertEquals(400, tooShort.getStatusCode());

        var same = me.handleRequest(patchPassword(token, "Moabom-pass-1", "Moabom-pass-1"), null);
        assertEquals(400, same.getStatusCode());

        var changed = me.handleRequest(patchPassword(token, "Moabom-pass-1", "New-pass-22"), null);
        assertEquals(200, changed.getStatusCode());
        assertTrue(MAPPER.readTree(changed.getBody()).get("changed").asBoolean());

        assertEquals(401, login.handleRequest(loginEvent("Moabom-pass-1"), null).getStatusCode());
        assertEquals(200, login.handleRequest(loginEvent("New-pass-22"), null).getStatusCode());
        // 바꾼 뒤에도 지금 로그인은 유지된다.
        assertEquals(200, me.handleRequest(bearer("GET", token).withPath("/auth/me"), null).getStatusCode());
    }

    @Test
    void requiresLogin() {
        var event = new APIGatewayProxyRequestEvent().withHttpMethod("PATCH").withPath("/auth/password")
                .withBody("{\"currentPassword\":\"Moabom-pass-1\",\"newPassword\":\"New-pass-22\"}");
        assertEquals(401, me.handleRequest(event, null).getStatusCode());
    }

    @Test
    void patchMeStillUpdatesProfileFields() throws Exception {
        String token = signupToken();
        var updated = me.handleRequest(bearer("PATCH", token).withPath("/auth/me").withBody("{\"name\":\"새이름\"}"), null);
        assertEquals(200, updated.getStatusCode());
        assertEquals("새이름", MAPPER.readTree(updated.getBody()).get("user").get("name").asText());
    }

    private String signupToken() throws Exception {
        var created = signup.handleRequest(new APIGatewayProxyRequestEvent().withHttpMethod("POST").withPath("/auth/signup")
                .withBody("{\"name\":\"회원\",\"loginId\":\"pwuser1\",\"password\":\"Moabom-pass-1\",\"dateOfBirth\":\"20020304\",\"email\":\"pw@example.com\"}"), null);
        assertEquals(201, created.getStatusCode());
        return MAPPER.readTree(created.getBody()).get("token").asText();
    }

    private static APIGatewayProxyRequestEvent loginEvent(String password) {
        return new APIGatewayProxyRequestEvent().withHttpMethod("POST").withPath("/auth/login")
                .withBody("{\"loginId\":\"pwuser1\",\"password\":\"" + password + "\"}");
    }

    private static APIGatewayProxyRequestEvent patchPassword(String token, String current, String next) {
        return bearer("PATCH", token).withPath("/auth/password").withResource("/auth/password")
                .withBody("{\"currentPassword\":\"" + current + "\",\"newPassword\":\"" + next + "\"}");
    }

    private static APIGatewayProxyRequestEvent bearer(String method, String token) {
        return new APIGatewayProxyRequestEvent()
                .withHttpMethod(method)
                .withHeaders(Map.of("Authorization", "Bearer " + token));
    }
}
