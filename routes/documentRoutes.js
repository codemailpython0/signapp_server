import express from 'express';
import { uploadDocument, getUserDocuments, deleteDocument } from '../controllers/DocumentController.js';
import { auth } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/multerConfig.js';

const router = express.Router();

// 📤 Upload PDF (auth + multer + controller)
router.post(
  "/upload",
  auth,
  upload.single("pdf"),
  (req, res, next) => {
    console.log("📄 /upload route hit");
    next();
  },
  uploadDocument
);

// 📑 Fetch all user documents
router.get('/', auth, getUserDocuments);

// 🗑 Delete document
router.delete('/:id', auth, deleteDocument);

export default router;
