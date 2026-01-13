"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const questionController_js_1 = require("../controllers/questionController.js");
const authMiddleware_js_1 = require("../middlewares/authMiddleware.js");
const router = express_1.default.Router();
router.post("/add", authMiddleware_js_1.protect, questionController_js_1.addQuestionsToSession);
router.post("/:id/pin", authMiddleware_js_1.protect, questionController_js_1.togglePinQuestion);
router.post("/:id/note", authMiddleware_js_1.protect, questionController_js_1.updateQuestionNote);
exports.default = router;
