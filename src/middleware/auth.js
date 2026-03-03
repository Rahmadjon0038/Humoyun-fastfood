const { db } = require("../db");
const { verifyAccessToken } = require("../utils/auth");

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({
        success: false,
        message: "Bearer token yuboring"
      });
    }

    const payload = verifyAccessToken(token);
    const user = await db.get(
      "SELECT id, first_name, last_name, phone, role, created_at FROM users WHERE id = ?",
      [payload.sub]
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Foydalanuvchi topilmadi"
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Token yaroqsiz yoki muddati tugagan"
    });
  }
}

module.exports = {
  authenticate
};
