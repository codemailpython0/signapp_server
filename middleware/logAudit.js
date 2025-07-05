// middleware/logAudit.js
import AuditLog from "../models/AuditLog.js";

export const logAudit = async (req, res, next) => {
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;

  try {
    await AuditLog.create({
      documentId: req.body.documentId,
      userId: req.user || null,
      signerEmail: req.body.email || null,
      ip,
    });
  } catch (err) {
    console.error("Failed to log audit trail:", err.message);
  }

  next();
};
