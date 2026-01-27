import User, { IUser } from "../models/User";
import RevokedToken from "../models/RevokedToken";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Request, Response } from "express";
import { body, validationResult } from "express-validator";
import validator from "validator";
import { logger } from "../config/logger";
import crypto from "crypto";
import sendEmail from "../utils/sendEmail";

// Generate JWT Access Token (short-lived)
const generateToken = (userId: string): string => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET!, {
    expiresIn: "10m",
  });
};

// Generate Refresh Token (long-lived)
const generateRefreshToken = (userId: string): string => {
  return jwt.sign({ id: userId }, process.env.REFRESH_TOKEN_SECRET!, {
    expiresIn: "7d",
  });
};

// Register a new user
const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ message: "Validation errors", errors: errors.array() });
      return;
    }

    const { name, email, password } = req.body;

    if (!validator.isEmail(email)) {
      res.status(400).json({ message: "Invalid email format" });
      return;
    }

    // Password strength: at least 8 chars, mix of letters and numbers
    if (password.length < 8 || !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      res.status(400).json({ message: "Password must be at least 8 characters long and contain uppercase, lowercase, and number" });
      return;
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      logger.warn(`Registration attempt with existing email: ${email}`);
      res.status(400).json({ message: "User already exists" });
      return;
    }

    logger.info("🆕 Registration attempt:", { name, email });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    const accessToken = generateToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());

    logger.info(`✅ New user registered: ${email}`);

    // Send tokens in HttpOnly cookies
    res.cookie('token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 10 * 60 * 1000, // 10 minutes
    });
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Server error";
    logger.error(`Registration error: ${errorMessage}`);
    res.status(500).json({
      message: "Server error",
      error: errorMessage,
    });
  }
};

// Login user
const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ message: "Validation errors", errors: errors.array() });
      return;
    }

    const { email, password } = req.body;

    if (!validator.isEmail(email)) {
      res.status(400).json({ message: "Invalid email format" });
      return;
    }

    const user = await User.findOne({ email });
    if (!user) {
      logger.warn(`Login attempt with invalid email: ${email}`);
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      logger.warn(`Login attempt with incorrect password for email: ${email}`);
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    const accessToken = generateToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());

    logger.info(`✅ User logged in: ${email}`);

    // Send tokens in HttpOnly cookies
    res.cookie('token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 10 * 60 * 1000, // 10 minutes
    });
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Server error";
    logger.error(`Login error: ${errorMessage}`);
    res.status(500).json({
      message: "Server error",
      error: errorMessage,
    });
  }
};

// Refresh access token using refresh token
const refreshAccessToken = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      res.status(401).json({ message: "Refresh token is required" });
      return;
    }

    // Check if refresh token is revoked
    const revoked = await RevokedToken.findOne({ token: refreshToken });
    if (revoked) {
      logger.warn(`Attempt to use revoked refresh token`);
      res.status(401).json({ message: "Invalid refresh token" });
      return;
    }

    // Verify the refresh token
    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET!,
    ) as {
      id: string;
      exp: number;
    };

    // Check if user still exists
    const user = await User.findById(decoded.id);
    if (!user) {
      logger.warn(`Refresh token attempt for non-existent user: ${decoded.id}`);
      res.status(401).json({ message: "User not found" });
      return;
    }

    // Revoke the old refresh token
    await RevokedToken.create({
      token: refreshToken,
      expiry: new Date(decoded.exp * 1000),
    });

    // Generate new access token and new refresh token
    const newAccessToken = generateToken(user._id.toString());
    const newRefreshToken = generateRefreshToken(user._id.toString());

    logger.info(`🔄 Access token refreshed for user: ${user.email}`);

    // Send new tokens in HttpOnly cookies
    res.cookie('token', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 10 * 60 * 1000,
    });
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      message: "Token refreshed",
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Invalid refresh token";
    logger.error(`Refresh token error: ${errorMessage}`);
    res.status(401).json({ message: "Invalid or expired refresh token" });
  }
};

// Get user profile
const getUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?._id).select("-password");
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Server error";
    res.status(500).json({
      message: "Server error",
      error: errorMessage,
    });
  }
};

// Forgot Password
const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ message: "Validation errors", errors: errors.array() });
      return;
    }

    const { email } = req.body;

    if (!validator.isEmail(email)) {
      res.status(400).json({ message: "Invalid email format" });
      return;
    }

    const user = await User.findOne({ email });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Get reset token
    const resetToken = crypto.randomBytes(20).toString("hex");

    // Hash token and set to resetPasswordToken field
    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Set expire (10 minutes)
    user.resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000);

    await user.save();

    const resetUrl = `${
      process.env.CLIENT_URL || "http://localhost:5173"
    }/reset-password/${resetToken}`;

    const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;

    try {
      await sendEmail({
        email: user.email,
        subject: "Password Reset Token",
        message,
      });

      res.status(200).json({ success: true, data: "Email sent" });
    } catch (err) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;

      await user.save();
      logger.error("Email send error", err);
      res.status(500).json({ message: "Email could not be sent" });
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Server error";
    res.status(500).json({ message: "Server error", error: errorMessage });
  }
};

// Reset Password
const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ message: "Validation errors", errors: errors.array() });
      return;
    }

    const { password } = req.body;
    const { resetToken } = req.params;

    if (!resetToken) {
      res.status(400).json({ message: "Invalid token" });
      return;
    }

    // Password strength
    if (password.length < 8 || !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      res.status(400).json({ message: "Password must be at least 8 characters long and contain uppercase, lowercase, and number" });
      return;
    }

    // Get hashed token
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      res.status(400).json({ message: "Invalid token" });
      return;
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    // Auto login: generate tokens
    const accessToken = generateToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());

    // Send tokens in cookies
    res.cookie('token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 10 * 60 * 1000,
    });
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      data: "Password updated successfully",
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Server error";
    res.status(500).json({ message: "Server error", error: errorMessage });
  }
};

export {
  registerUser,
  loginUser,
  getUserProfile,
  refreshAccessToken,
  forgotPassword,
  resetPassword,
};
