"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const sessionController_js_1 = require("../controllers/sessionController.js");
const authMiddleware_js_1 = require("../middlewares/authMiddleware.js");
const router = express_1.default.Router();
router.post("/create", authMiddleware_js_1.protect, sessionController_js_1.createSession);
router.get("/my-sessions", authMiddleware_js_1.protect, sessionController_js_1.getMySessions);
router.get("/:id", authMiddleware_js_1.protect, sessionController_js_1.getSessionById);
router.delete("/:id", authMiddleware_js_1.protect, sessionController_js_1.deleteSession);
exports.default = router;
