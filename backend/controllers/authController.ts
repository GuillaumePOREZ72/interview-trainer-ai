import User, { IUser } from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Request, Response } from "express";
import { logger } from "../config/logger.js";

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
    const { name, email, password, profileImageUrl } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      logger.warn(`Registration attempt with existing email: ${email}`);
      res.status(400).json({ message: "User already exists" });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      profileImageUrl,
    });

    const accessToken = generateToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());

    logger.info(`✅ New user registered: ${email}`);

    res.status(201).json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        profileImageUrl: user.profileImageUrl,
      },
      token: accessToken,
      refreshToken,
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
    const { email, password } = req.body;

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

    res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        profileImageUrl: user.profileImageUrl,
      },
      token: accessToken,
      refreshToken,
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
  res: Response
): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(401).json({ message: "Refresh token is required" });
      return;
    }

    // Verify the refresh token
    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET!
    ) as {
      id: string;
    };

    // Check if user still exists
    const user = await User.findById(decoded.id);
    if (!user) {
      logger.warn(`Refresh token attempt for non-existent user: ${decoded.id}`);
      res.status(401).json({ message: "User not found" });
      return;
    }

    // Generate new access token
    const newAccessToken = generateToken(user._id.toString());

    logger.info(`🔄 Access token refreshed for user: ${user.email}`);

    res.json({
      token: newAccessToken,
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
    res.json(user);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Server error";
    res.status(500).json({
      message: "Server error",
      error: errorMessage,
    });
  }
};

export { registerUser, loginUser, getUserProfile, refreshAccessToken };
