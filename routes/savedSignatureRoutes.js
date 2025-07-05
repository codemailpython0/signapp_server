import express from 'express';
import {
  saveSignatureImage,
  getSavedSignatureImage,
  deleteSavedSignatureImage
} from '../controllers/SavedSignatureController.js';
import { auth } from '../middleware/authMiddleware.js';

const router = express.Router();

// 🖼 Save new signature image
router.post('/save', auth, saveSignatureImage);

// 🔍 Get saved signatures for current user
router.get('/me', auth, getSavedSignatureImage);

// ❌ Delete a signature by index
router.delete('/delete/:index', auth, deleteSavedSignatureImage);

export default router;
