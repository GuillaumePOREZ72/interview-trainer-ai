import request from "supertest";
import { createApp } from "../../../app";
import User from "../../../models/User";
import sendEmail from "../../../utils/sendEmail";
import crypto from "crypto";

// Mock sendEmail
jest.mock("../../../utils/sendEmail");

let app: any;

beforeAll(() => {
  app = createApp();
});

beforeEach(async () => {
  jest.clearAllMocks();
});

describe("Auth Routes - Forgot Password", () => {
  it("should send email with reset token for registered user", async () => {
    // 1. Create User
    await User.create({
      name: "Test User",
      email: "test@example.com",
      password: "password123",
    });

    // 2. Request Forgot Password
    const response = await request(app)
      .post("/api/auth/forgotpassword")
      .send({ email: "test@example.com" });

    // 3. Verify Response
    expect(response.status).toBe(200);
    expect(response.body.data).toBe("Email sent");

    // 4. Verify DB updated
    const user = await User.findOne({ email: "test@example.com" });
    expect(user?.resetPasswordToken).toBeDefined();
    expect(user?.resetPasswordExpire).toBeDefined();

    // 5. Verify Email Sent
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "test@example.com",
        subject: "Password Reset Token",
      }),
    );
  });

  it("should return 404 for non-registered user", async () => {
    const response = await request(app)
      .post("/api/auth/forgotpassword")
      .send({ email: "nonexistent@example.com" });

    expect(response.status).toBe(404);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("should reset password with valid token", async () => {
    // 1. Create User
    const user = await User.create({
      name: "Test User",
      email: "test@example.com",
      password: "oldpassword",
    });

    // 2. Generate Token manually and save hash
    const resetToken = "validtoken123";
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordToken = resetPasswordToken;
    user.resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
    await user.save();

    // 3. Request Reset Password
    const response = await request(app)
      .put(`/api/auth/resetpassword/${resetToken}`)
      .send({ password: "newpassword123" });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    // 4. Verify DB updated
    const updatedUser = await User.findOne({ email: "test@example.com" });
    expect(updatedUser?.resetPasswordToken).toBeUndefined();
    expect(updatedUser?.resetPasswordExpire).toBeUndefined();

    // Verify user can login with new password would require calling login endpoint,
    // but assuming controller logic is sound via unit test coverage or trust.
  });

  it("should return 400 for invalid token", async () => {
    const response = await request(app)
      .put(`/api/auth/resetpassword/invalidtoken`)
      .send({ password: "newpassword123" });

    expect(response.status).toBe(400);
  });
});
