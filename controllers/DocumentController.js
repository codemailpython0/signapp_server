// controllers/DocumentController.js
import supabase from '../supabaseClient.js';
import { readFileSync, unlinkSync } from 'fs';
import path from 'path';

// 📥 Upload PDF to Supabase Storage
export const uploadDocument = async (req, res) => {
  try {
    const file = req.file;
    const userId = req.user;

    if (!file) return res.status(400).json({ message: 'No file uploaded' });

    const buffer = readFileSync(file.path);
    const fileExt = path.extname(file.originalname);
    const filename = `${Date.now()}-${file.originalname}`;
    const storagePath = `user_${userId}/${filename}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(storagePath, buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    // Delete local temp file
    unlinkSync(file.path);

    if (uploadError) {
      console.error("📦 Storage upload error:", uploadError);
      return res.status(500).json({ message: 'Storage upload failed' });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(storagePath);

    const publicUrl = urlData.publicUrl;

    // Save metadata to DB
    const { data: insertedDoc, error: dbError } = await supabase
      .from('documents')
      .insert([
        {
          filename: file.originalname,
          filepath: publicUrl,
          uploaded_by: userId,
        }
      ])
      .select()
      .single();

    if (dbError) {
      console.error("🛑 DB insert error:", dbError);
      return res.status(500).json({ message: 'Upload failed' });
    }

    res.status(201).json({
      message: 'File uploaded successfully',
      document: insertedDoc,
    });
  } catch (error) {
    console.error("🔥 Upload failed:", error);
    res.status(500).json({ message: 'Upload failed', error: error.message });
  }
};

// 📄 Get all user documents
export const getUserDocuments = async (req, res) => {
  try {
    const userId = req.user;

    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { data: documents, error } = await supabase
      .from('documents')
      .select('*')
      .eq('uploaded_by', userId)
      .order('uploaded_at', { ascending: false });

    if (error) throw error;

    res.status(200).json({ documents });
  } catch (error) {
    console.error("🔥 Fetch documents failed:", error);
    res.status(500).json({ message: 'Failed to fetch documents', error: error.message });
  }
};

// ❌ Delete a document
export const deleteDocument = async (req, res) => {
  try {
    const userId = req.user;
    const { id } = req.params;

    // Fetch document
    const { data: doc, error: fetchError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .eq('uploaded_by', userId)
      .single();

    if (fetchError || !doc) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Parse file path to extract storage key
    const url = new URL(doc.filepath);
    const pathname = decodeURIComponent(url.pathname.split("/documents/")[1]);

    // Delete file from Supabase Storage
    await supabase.storage.from('documents').remove([pathname]);

    // Delete from DB
    await supabase.from('documents').delete().eq('id', id);

    res.status(200).json({ message: 'Document deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete document', error: error.message });
  }
};
