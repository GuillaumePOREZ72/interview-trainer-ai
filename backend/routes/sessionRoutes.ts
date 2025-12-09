import express, { Router } from "express";
import {
  createSession,
  getSessionById,
  getMySessions,
  deleteSession,
} from "../controllers/sessionController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router: Router = express.Router();

router.post("/create", protect, createSession);
router.get("/my-sessions", protect, getMySessions);
router.get("/:id", protect, getSessionById);
router.delete("/:id", protect, deleteSession);

export default router;
