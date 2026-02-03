import User, { IUser } from "../models/User";
import RevokedToken from "../models/RevokedToken";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import sendEmail from "../utils/sendEmail";
import { logger } from "../config/logger";

class AuthService {
  // Token Generation
  generateToken(userId: string): string {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET!, {
      expiresIn: "10m",
    });
  }

  generateRefreshToken(userId: string): string {
    return jwt.sign({ id: userId }, process.env.REFRESH_TOKEN_SECRET!, {
      expiresIn: "7d",
    });
  }

  // Business Logic: Registration
  async registerUser(userData: { name: string; email: string; password: any }) {
    const { name, email, password } = userData;

    const userExists = await User.findOne({ email });
    if (userExists) {
      throw new Error("User already exists");
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    return user;
  }

  // Business Logic: Login
  async loginUser(email: string, password: any) {
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error("Invalid email or password");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error("Invalid email or password");
    }

    return user;
  }

  // Business Logic: Refresh Token
  async refreshAccessToken(refreshToken: string) {
    const revoked = await RevokedToken.findOne({ token: refreshToken });
    if (revoked) {
      throw new Error("Invalid refresh token");
    }

    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET!,
    ) as { id: string; exp: number };

    const user = await User.findById(decoded.id);
    if (!user) {
      throw new Error("User not found");
    }

    // Revoke old
    await RevokedToken.create({
      token: refreshToken,
      expiry: new Date(decoded.exp * 1000),
    });

    const accessToken = this.generateToken(user._id.toString());
    const newRefreshToken = this.generateRefreshToken(user._id.toString());

    return { accessToken, newRefreshToken, userEmail: user.email };
  }

  // Business Logic: Forgot Password
  async initiatePasswordReset(email: string, clientUrl: string) {
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error("User not found");
    }

    const resetToken = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    user.resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000);

    await user.save();

    const resetUrl = `${clientUrl}/reset-password/${resetToken}`;
    const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please follow this link: \n\n ${resetUrl}`;

    try {
      await sendEmail({
        email: user.email,
        subject: "Password Reset Token",
        message,
      });
    } catch (err) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      throw new Error("Email could not be sent");
    }
  }

  // Business Logic: Reset Password
  async resetPassword(resetToken: string, password: any) {
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      throw new Error("Invalid token");
    }

    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(password, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();
    return user;
  }
}

export default new AuthService();
