const swaggerJSDoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "FastFood API",
      version: "1.0.0",
      description: "FastFood sayt backend API hujjati"
    },
    servers: [
      {
        url: "http://localhost:4000",
        description: "Local server"
      }
    ]
  },
  apis: ["./src/routes/*.js"]
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
