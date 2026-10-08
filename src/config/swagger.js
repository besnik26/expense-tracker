const swaggerJsdoc = require('swagger-jsdoc');

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Expense Tracker API',
      version: '1.0.0',
      description: 'Backend API for the expense tracker application.',
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Local development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js'],
};

module.exports = swaggerJsdoc(swaggerOptions);
