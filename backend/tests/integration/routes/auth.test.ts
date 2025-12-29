/**
 * Auth Routes Integration Tests
 */
import request from "supertest";
import { createApp } from "../../../app.js";
import {
  createTestUser,
  defaultTestUser,
  authenticatedRequest,
  generateExpiredToken,
  generateInvalidToken,
} from "../../helpers/testUtils.js";

const app = createApp();

describe("Auth Routes", () => {
  describe("POST /api/auth/register", () => {
    it("should register a new user successfully", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          name: "New User",
          email: "newuser@example.com",
          password: "SecurePass123!",
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("token");
      expect(response.body).toHaveProperty("refreshToken");
      expect(response.body).toHaveProperty("user");
      expect(response.body.user.email).toBe("newuser@example.com");
      expect(response.body.user.name).toBe("New User");
      expect(response.body.user).not.toHaveProperty("password");
    });

    it("should return 400 if user already exists", async () => {
      // Create user first
      await createTestUser({ email: "existing@example.com" });

      // Try to register with same email
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Another User",
          email: "existing@example.com",
          password: "SecurePass123!",
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("User already exists");
    });
  });

  describe("POST /api/auth/login", () => {
    beforeEach(async () => {
      // Create a test user before each login test
      await createTestUser();
    });

    it("should login successfully with valid credentials", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: defaultTestUser.email,
          password: defaultTestUser.password,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("token");
      expect(response.body).toHaveProperty("refreshToken");
      expect(response.body).toHaveProperty("user");
      expect(response.body.user.email).toBe(defaultTestUser.email);
    });

    it("should return 401 with invalid email", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "nonexistent@example.com",
          password: defaultTestUser.password,
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Invalid email or password");
    });

    it("should return 401 with invalid password", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: defaultTestUser.email,
          password: "wrongpassword",
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Invalid email or password");
    });
  });

  describe("GET /api/auth/profile", () => {
    it("should return user profile with valid token", async () => {
      const { token, user } = await createTestUser();

      const response = await authenticatedRequest(app, token)
        .get("/api/auth/profile");

      expect(response.status).toBe(200);
      expect(response.body.email).toBe(user.email);
      expect(response.body.name).toBe(user.name);
      expect(response.body).not.toHaveProperty("password");
    });

    it("should return 401 without token", async () => {
      const response = await request(app).get("/api/auth/profile");

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Not authorized, no token");
    });

    it("should return 401 with invalid token", async () => {
      const invalidToken = generateInvalidToken();

      const response = await authenticatedRequest(app, invalidToken)
        .get("/api/auth/profile");

      expect(response.status).toBe(401);
    });
  });

  describe("POST /api/auth/refresh-token", () => {
    it("should return new access token with valid refresh token", async () => {
      const { refreshToken } = await createTestUser();

      const response = await request(app)
        .post("/api/auth/refresh-token")
        .send({ refreshToken });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("token");
    });

    it("should return 401 without refresh token", async () => {
      const response = await request(app)
        .post("/api/auth/refresh-token")
        .send({});

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Refresh token is required");
    });

    it("should return 401 with invalid refresh token", async () => {
      const response = await request(app)
        .post("/api/auth/refresh-token")
        .send({ refreshToken: "invalid-refresh-token" });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Invalid or expired refresh token");
    });
  });
});

describe("Health Check", () => {
  it("should return healthy status on GET /", async () => {
    const response = await request(app).get("/");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("healthy");
    expect(response.body.message).toBe("Interview Prep AI Backend is running.");
  });
});

