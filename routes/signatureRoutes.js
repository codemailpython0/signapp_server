import express from 'express';
import { saveSignature, getSignaturesForDocument } from '../controllers/SignatureController.js';
import { auth } from '../middleware/authMiddleware.js';

const router = express.Router();

// ✍️ Save new signature position on document
router.post('/', auth, saveSignature);

// 📄 Get all signatures for a specific document
router.get('/:id', auth, getSignaturesForDocument);

export default router;
