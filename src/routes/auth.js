const express = require("express");
const { db } = require("../db");
const { authenticate } = require("../middleware/auth");
const {
  generateRefreshToken,
  hashPassword,
  hashToken,
  normalizePhone,
  signAccessToken,
  verifyPassword
} = require("../utils/auth");

const router = express.Router();

function formatUser(user) {
  return {
    id: user.id,
    first_name: user.first_name,
    last_name: user.last_name,
    phone: user.phone,
    role: user.role,
    created_at: user.created_at
  };
}

async function issueTokens(userId, role) {
  const accessToken = signAccessToken({ sub: userId, role });
  const refreshToken = generateRefreshToken();

  await db.run(
    "INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)",
    [userId, refreshToken.tokenHash, refreshToken.expiresAt]
  );

  return {
    accessToken,
    refreshToken
  };
}

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Login va register endpointlari
 */

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Yangi foydalanuvchi ro'yxatdan o'tkazish
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [first_name, last_name, phone, password]
 *             properties:
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               phone:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Foydalanuvchi yaratildi
 */
router.post("/register", async (req, res) => {
  try {
    const firstName = String(req.body.first_name || "").trim();
    const lastName = String(req.body.last_name || "").trim();
    const phone = normalizePhone(req.body.phone);
    const password = String(req.body.password || "");

    if (!firstName || !lastName || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: "first_name, last_name, phone va password majburiy"
      });
    }

    if (password.length < 4) {
      return res.status(400).json({
        success: false,
        message: "Parol kamida 4 ta belgidan iborat bo'lishi kerak"
      });
    }

    const existingUser = await db.get("SELECT id FROM users WHERE phone = ?", [phone]);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Bu telefon raqam allaqachon ro'yxatdan o'tgan"
      });
    }

    const result = await db.run(
      `INSERT INTO users (first_name, last_name, phone, password_hash, role)
       VALUES (?, ?, ?, ?, 'user')`,
      [firstName, lastName, phone, hashPassword(password)]
    );

    const user = await db.get(
      "SELECT id, first_name, last_name, phone, role, created_at FROM users WHERE id = ?",
      [result.lastID]
    );
    const tokens = await issueTokens(user.id, user.role);

    res.status(201).json({
      success: true,
      message: "Ro'yxatdan o'tish muvaffaqiyatli",
      data: {
        user: formatUser(user),
        role: user.role,
        access_token: tokens.accessToken.token,
        refresh_token: tokens.refreshToken.token,
        access_token_expires_at: tokens.accessToken.expiresAt,
        refresh_token_expires_at: tokens.refreshToken.expiresAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Ro'yxatdan o'tishda xatolik yuz berdi"
    });
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Telefon raqam va parol bilan login qilish
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone, password]
 *             properties:
 *               phone:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Tizimga muvaffaqiyatli kirildi
 */
router.post("/login", async (req, res) => {
  try {
    const phone = normalizePhone(req.body.phone);
    const password = String(req.body.password || "");

    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        message: "phone va password majburiy"
      });
    }

    const user = await db.get("SELECT * FROM users WHERE phone = ?", [phone]);
    if (!user || !verifyPassword(password, user.password_hash)) {
      return res.status(401).json({
        success: false,
        message: "Telefon raqam yoki parol noto'g'ri"
      });
    }

    const tokens = await issueTokens(user.id, user.role);

    res.json({
      success: true,
      message: "Tizimga kirish muvaffaqiyatli",
      data: {
        user: formatUser(user),
        role: user.role,
        access_token: tokens.accessToken.token,
        refresh_token: tokens.refreshToken.token,
        access_token_expires_at: tokens.accessToken.expiresAt,
        refresh_token_expires_at: tokens.refreshToken.expiresAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Login qilishda xatolik yuz berdi"
    });
  }
});

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh token orqali yangi access token olish
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refresh_token]
 *             properties:
 *               refresh_token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Tokenlar yangilandi
 */
router.post("/refresh", async (req, res) => {
  try {
    const refreshToken = String(req.body.refresh_token || "").trim();
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: "refresh_token majburiy"
      });
    }

    const tokenHash = hashToken(refreshToken);
    const savedToken = await db.get(
      `SELECT rt.id, rt.user_id, rt.expires_at, u.role
       FROM refresh_tokens rt
       JOIN users u ON u.id = rt.user_id
       WHERE rt.token_hash = ?`,
      [tokenHash]
    );

    if (!savedToken || new Date(savedToken.expires_at).getTime() < Date.now()) {
      return res.status(401).json({
        success: false,
        message: "Refresh token yaroqsiz yoki muddati tugagan"
      });
    }

    await db.run("DELETE FROM refresh_tokens WHERE id = ?", [savedToken.id]);
    const tokens = await issueTokens(savedToken.user_id, savedToken.role);

    res.json({
      success: true,
      message: "Tokenlar yangilandi",
      data: {
        role: savedToken.role,
        access_token: tokens.accessToken.token,
        refresh_token: tokens.refreshToken.token,
        access_token_expires_at: tokens.accessToken.expiresAt,
        refresh_token_expires_at: tokens.refreshToken.expiresAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Tokenni yangilashda xatolik yuz berdi"
    });
  }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Login qilgan foydalanuvchi profilini olish
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Foydalanuvchi profili
 */
router.get("/me", authenticate, async (req, res) => {
  res.json({
    success: true,
    data: req.user
  });
});

module.exports = router;
