import supabase from "../supabaseClient.js";

// 🧾 Get saved signature images for a user
export const getSavedSignatureImage = async (req, res) => {
  try {
    const userId = req.user;

    const { data: record, error } = await supabase
      .from("saved_signatures")
      .select("images")
      .eq("user_id", userId)
      .single();

    if (error || !record || !record.images || record.images.length === 0) {
      return res.status(404).json({ message: "No saved signatures found" });
    }

    res.status(200).json({ signatureImages: record.images });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch signatures", error: err.message });
  }
};

// 💾 Save a new signature image
export const saveSignatureImage = async (req, res) => {
  try {
    const userId = req.user;
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ message: "No image provided" });
    }

    // Check if a record exists
    const { data: existing, error: fetchErr } = await supabase
      .from("saved_signatures")
      .select("images")
      .eq("user_id", userId)
      .single();

    let updatedImages = [];

    if (existing) {
      updatedImages = [...existing.images, image];
      await supabase
        .from("saved_signatures")
        .update({ images: updatedImages })
        .eq("user_id", userId);
    } else {
      updatedImages = [image];
      await supabase
        .from("saved_signatures")
        .insert([{ user_id: userId, images: updatedImages }]);
    }

    res.status(200).json({ message: "Signature saved", signatureImage: image });
  } catch (err) {
    res.status(500).json({ message: "Failed to save signature", error: err.message });
  }
};

// ❌ Delete a signature image by index
export const deleteSavedSignatureImage = async (req, res) => {
  try {
    const userId = req.user;
    const index = parseInt(req.params.index, 10);

    const { data: record, error: fetchErr } = await supabase
      .from("saved_signatures")
      .select("images")
      .eq("user_id", userId)
      .single();

    if (!record || !record.images || index < 0 || index >= record.images.length) {
      return res.status(404).json({ message: "Signature not found" });
    }

    const updatedImages = [...record.images];
    updatedImages.splice(index, 1);

    const { error: updateErr } = await supabase
      .from("saved_signatures")
      .update({ images: updatedImages })
      .eq("user_id", userId);

    if (updateErr) throw updateErr;

    res.status(200).json({ message: "Signature deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete signature", error: err.message });
  }
};
