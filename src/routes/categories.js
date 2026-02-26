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
router.get("/", (req, res) => {
  const categories = db
    .prepare("SELECT id, name, image_url FROM categories ORDER BY id DESC")
    .all();

  res.json({
    success: true,
    data: categories
  });
});

module.exports = router;
