import { Request, Response } from "express";
import { validationResult } from "express-validator";
import validator from "validator";
import { logger } from "../config/logger";
import AuthService from "../services/AuthService";
import User from "../models/User";

// Cookie helper
const setAuthCookies = (
  res: Response,
  accessToken: string,
  refreshToken: string,
) => {
  res.cookie("token", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 10 * 60 * 1000, // 10 minutes
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

// Register a new user
const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res
        .status(400)
        .json({ message: "Validation errors", errors: errors.array() });
      return;
    }

    const { name, email, password } = req.body;

    if (!validator.isEmail(email)) {
      res.status(400).json({ message: "Invalid email format" });
      return;
    }

    // Password strength
    if (
      password.length < 8 ||
      !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)
    ) {
      res.status(400).json({
        message:
          "Password must be at least 8 characters long and contain uppercase, lowercase, and number",
      });
      return;
    }

    const user = await AuthService.registerUser({ name, email, password });

    const accessToken = AuthService.generateToken(user._id.toString());
    const refreshToken = AuthService.generateRefreshToken(user._id.toString());

    logger.info(`✅ New user registered: ${email}`);
    setAuthCookies(res, accessToken, refreshToken);

    res.status(201).json({
      user: { _id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Server error";
    logger.error(`Registration error: ${errorMessage}`);
    res
      .status(
        error instanceof Error && error.message === "User already exists"
          ? 400
          : 500,
      )
      .json({
        message: errorMessage,
      });
  }
};

// Login user
const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res
        .status(400)
        .json({ message: "Validation errors", errors: errors.array() });
      return;
    }

    const { email, password } = req.body;

    const user = await AuthService.loginUser(email, password);

    const accessToken = AuthService.generateToken(user._id.toString());
    const refreshToken = AuthService.generateRefreshToken(user._id.toString());

    logger.info(`✅ User logged in: ${email}`);
    setAuthCookies(res, accessToken, refreshToken);

    res.json({
      user: { _id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Server error";
    logger.error(`Login error: ${errorMessage}`);
    res.status(401).json({ message: errorMessage });
  }
};

// Refresh access token
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

    const { accessToken, newRefreshToken, userEmail } =
      await AuthService.refreshAccessToken(refreshToken);

    logger.info(`🔄 Access token refreshed for user: ${userEmail}`);
    setAuthCookies(res, accessToken, newRefreshToken);

    res.json({ message: "Token refreshed" });
  } catch (error) {
    const originalError =
      error instanceof Error ? error.message : "Invalid refresh token";
    logger.error(`Refresh token error: ${originalError}`);
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
    res.json({ _id: user._id, name: user.name, email: user.email });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Forgot Password
const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res
        .status(400)
        .json({ message: "Validation errors", errors: errors.array() });
      return;
    }

    const { email } = req.body;
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

    await AuthService.initiatePasswordReset(email, clientUrl);
    res.status(200).json({ success: true, data: "Email sent" });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Server error";
    res
      .status(errorMessage === "User not found" ? 404 : 500)
      .json({ message: errorMessage });
  }
};

// Reset Password
const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res
        .status(400)
        .json({ message: "Validation errors", errors: errors.array() });
      return;
    }

    const { password } = req.body;
    const { resetToken } = req.params;

    const user = await AuthService.resetPassword(resetToken, password);

    const accessToken = AuthService.generateToken(user._id.toString());
    const refreshToken = AuthService.generateRefreshToken(user._id.toString());

    setAuthCookies(res, accessToken, refreshToken);
    res
      .status(200)
      .json({ success: true, data: "Password updated successfully" });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Server error";
    res.status(400).json({ message: errorMessage });
  }
};

// Logout User
const logoutUser = (req: Request, res: Response): void => {
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };
  res.clearCookie("token", options);
  res.clearCookie("refreshToken", options);
  res.status(200).json({ ok: true });
};

export {
  registerUser,
  loginUser,
  getUserProfile,
  refreshAccessToken,
  forgotPassword,
  resetPassword,
  logoutUser,
};
