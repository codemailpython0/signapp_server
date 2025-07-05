import crypto from "crypto";
import nodemailer from "nodemailer";
import supabase from "../supabaseClient.js";

// 📤 Send public signature link
export const sendPublicSignatureLink = async (req, res) => {
  try {
    const { documentId, email } = req.body;

    // Ensure document exists
    const { data: document, error: docErr } = await supabase
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .single();

    if (docErr || !document) {
      return res.status(404).json({ message: "Document not found" });
    }

    const token = crypto.randomBytes(20).toString("hex");

    // Save token + email in Supabase
    const { error: insertErr } = await supabase
      .from("public_signatures")
      .insert([{ document_id: documentId, email, token }]);

    if (insertErr) throw insertErr;

    const publicLink = `${process.env.CLIENT_URL}/sign/${token}`;

    // Send mail
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"Doc Signature App" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Document Signature Request",
      html: `
        <p>You have been requested to sign a document.</p>
        <p>Click the link below to view and sign:</p>
        <a href="${publicLink}">${publicLink}</a>
        <p>This link is secure and unique.</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Signature request sent successfully", token });
  } catch (err) {
    console.error("❌ Email send failed:", err);
    res.status(500).json({ message: "Failed to send email", error: err.message });
  }
};

// 📄 Get document by token
export const getDocumentByToken = async (req, res) => {
  try {
    const { token } = req.params;

    const { data: request, error: reqErr } = await supabase
      .from("public_signatures")
      .select("*")
      .eq("token", token)
      .single();

    if (reqErr || !request) {
      return res.status(404).json({ message: "Link expired or invalid" });
    }

    const { data: document, error: docErr } = await supabase
      .from("documents")
      .select("*")
      .eq("id", request.document_id)
      .single();

    if (docErr || !document) {
      return res.status(404).json({ message: "Document not found" });
    }

    res.status(200).json({ document });
  } catch (err) {
    console.error("🔐 Token fetch error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// 📝 Confirm public signature and log it
export const confirmPublicSignature = async (req, res) => {
  try {
    const { token } = req.params;

    const { data: request, error: reqErr } = await supabase
      .from("public_signatures")
      .select("*")
      .eq("token", token)
      .single();

    if (reqErr || !request) {
      return res.status(404).json({ message: "Invalid or expired token" });
    }

    const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;

    const { error: logErr } = await supabase
      .from("audit_logs")
      .insert([
        {
          document_id: request.document_id,
          signer_email: request.email,
          ip,
        },
      ]);

    if (logErr) throw logErr;

    res.status(200).json({ message: "Audit log saved" });
  } catch (err) {
    console.error("🛑 Signature confirm failed:", err);
    res.status(500).json({ message: "Failed to confirm signature", error: err.message });
  }
};
