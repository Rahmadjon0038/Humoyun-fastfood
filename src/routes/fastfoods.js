const express = require("express");
const { db } = require("../db");

const router = express.Router();

/**
 * @swagger
 * /api/fastfoods:
 *   get:
 *     summary: Barcha fastfoodlarni olish
 *     tags: [Fastfoods]
 *     responses:
 *       200:
 *         description: Fastfoodlar ro'yxati
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
 *                       price:
 *                         type: number
 *                       discount_price:
 *                         type: number
 *                         nullable: true
 *                       image_url:
 *                         type: string
 *                       category_id:
 *                         type: integer
 *                         nullable: true
 */
router.get("/", async (req, res) => {
  try {
    const fastfoods = await db.all(
      `SELECT id, name, price, discount_price, image_url, category_id
       FROM fastfoods
       ORDER BY id DESC`
    );

    res.json({
      success: true,
      data: fastfoods
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Fastfoodlarni olishda xatolik yuz berdi"
    });
  }
});

module.exports = router;
