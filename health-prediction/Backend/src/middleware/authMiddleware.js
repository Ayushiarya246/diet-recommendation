import jwt from "jsonwebtoken";

export default function authMiddleware(req, res, next) {
  try {
    // ✅ Check if token exists in Authorization Header
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided ❌" });
    }

    // ✅ Verify Access Token
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: "Invalid or expired token ❌" });
      }

      req.user = decoded; // ✅ attach user info to request (id + email)
      next();
    });

  } catch (err) {
    return res.status(500).json({ message: "Auth failed ❌", error: err.message });
  }
}

