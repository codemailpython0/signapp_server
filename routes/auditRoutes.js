// routes/auditRoutes.js
import express from "express";
import { auth } from "../middleware/authMiddleware.js";
import supabase from "../supabaseClient.js";

const router = express.Router();

// GET /api/audit/:fileId - Fetch audit logs for a document
router.get("/:fileId", auth, async (req, res) => {
  try {
    const { fileId } = req.params;

    const { data: logs, error } = await supabase
      .from("audit_logs")
      .select("*")
      .eq("document_id", fileId)
      .order("timestamp", { ascending: false });

    if (error) {
      console.error("Error fetching logs:", error);
      return res.status(500).json({ message: "Failed to fetch audit logs" });
    }

    res.status(200).json({ logs });
  } catch (err) {
    console.error("Unexpected error:", err);
    res.status(500).json({ message: "Server error fetching audit logs" });
  }
});

export default router;
