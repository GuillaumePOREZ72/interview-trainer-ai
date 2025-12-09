import User, { IUser } from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Request, Response } from "express";

// Generate JWT Token
const generateToken = (userId: string): string => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET!, { expiresIn: "7d" });
};

// Register a new user
const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, profileImageUrl } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
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

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      profileImageUrl: user.profileImageUrl,
      token: generateToken(user._id.toString()),
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

// Login user
const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      res.status(500).json({ message: "Invalid email or password" });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(500).json({ message: "Invalid email or password" });
      return;
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      profileImageUrl: user.profileImageUrl,
      token: generateToken(user._id.toString()),
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

export { registerUser, loginUser, getUserProfile };
