import supabase from "../supabaseClient.js";

// 🖊 Save a new signature position
export const saveSignature = async (req, res) => {
  try {
    const { documentId, x, y, page, signStatus } = req.body;
    const userId = req.user;

    const { data, error } = await supabase
      .from("signatures")
      .insert([
        {
          document_id: documentId,
          user_id: userId,
          x,
          y,
          page,
          sign_status: signStatus || "pending"
        }
      ])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ message: "Signature saved", signature: data });
  } catch (error) {
    res.status(500).json({ message: "Failed to save signature", error: error.message });
  }
};

// 📄 Get all signatures for a specific document
export const getSignaturesForDocument = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("signatures")
      .select("*")
      .eq("document_id", id);

    if (error) throw error;

    res.status(200).json({ signatures: data });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch signatures", error: error.message });
  }
};
