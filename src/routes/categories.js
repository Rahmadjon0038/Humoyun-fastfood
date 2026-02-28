const express = require("express");
const { db } = require("../db");

const router = express.Router();

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Barcha kategoriyalarni olish
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: Kategoriyalar ro'yxati
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       image_url:
 *                         type: string
 */
router.get("/", async (req, res) => {
  try {
    const categories = await db.all(
      "SELECT id, name, image_url FROM categories ORDER BY id DESC"
    );

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Kategoriyalarni olishda xatolik yuz berdi"
    });
  }
});

module.exports = router;
