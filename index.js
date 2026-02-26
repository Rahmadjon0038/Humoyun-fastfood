const express = require("express");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./src/config/swagger");
const { initializeDatabase } = require("./src/db");
const categoriesRouter = require("./src/routes/categories");
const fastfoodsRouter = require("./src/routes/fastfoods");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());

initializeDatabase();

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "FastFood API ishlayapti",
    docs: "http://localhost:3000/api-docs"
  });
});

app.use("/api/categories", categoriesRouter);
app.use("/api/fastfoods", fastfoodsRouter);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint topilmadi"
  });
});

app.listen(PORT, () => {
  console.log(`Server ishladi: http://localhost:${PORT}`);
  console.log(`Swagger docs: http://localhost:${PORT}/api-docs`);
});
