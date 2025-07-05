import jwt from "jsonwebtoken";

export const auth = (req, res, next) => {
  const token =
    req.cookies?.token || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.id; // ✅ fixed here
    next();
  } catch (err) {
    res.status(403).json({ message: "Invalid token" });
  }
};
