// server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';

// Load environment variables
dotenv.config();

// Route imports
import authRoutes from './routes/authRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import signatureRoutes from './routes/signatureRoutes.js';
import savedSignatureRoutes from './routes/savedSignatureRoutes.js';
import publicSignatureRoutes from './routes/publicSignatureRoutes.js';
import auditRoutes from './routes/auditRoutes.js';

// Initialize express app
const app = express();

// Middleware
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/docs', documentRoutes);
app.use('/uploads', express.static('uploads')); // Only needed if you still serve files locally
app.use('/api/signatures', signatureRoutes);
app.use('/api/saved-signature', savedSignatureRoutes);
app.use('/api/public-signature', publicSignatureRoutes);
app.use('/api/audit', auditRoutes);

// Health check route
app.get('/', (req, res) => {
  res.send('Document Signature App Backend (Supabase Enabled)');
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on Port ${PORT}`);
});
