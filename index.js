const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./src/config/swagger");
const { initializeDatabase } = require("./src/db");
const categoriesRouter = require("./src/routes/categories");
const fastfoodsRouter = require("./src/routes/fastfoods");

const app = express();
const PORT = process.env.PORT || 4000;
const corsOptions = {
  origin: true,
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "FastFood API ishlayapti",
    docs: `http://localhost:${PORT}/api-docs`
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

async function startServer() {
  try {
    await initializeDatabase();

    app.listen(PORT, () => {
      console.log(`Server ishladi: http://localhost:${PORT}`);
      console.log(`Swagger docs: http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error("Database ishga tushmadi:", error);
    process.exit(1);
  }
}

startServer();
