import express from "express";
import {
  sendPublicSignatureLink,
  getDocumentByToken,
  confirmPublicSignature
} from "../controllers/publicSignatureController.js";
import { auth } from "../middleware/authMiddleware.js";

const router = express.Router();

// 🔗 Request a public signature link (authenticated)
router.post("/request", auth, sendPublicSignatureLink);

// 📄 View document using public token
router.get("/view/:token", getDocumentByToken);

// ✍️ Confirm signature using token (log it)
router.post("/confirm/:token", confirmPublicSignature);

export default router;
