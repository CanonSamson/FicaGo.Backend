import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'FicaGo Backend API',
      version: '1.0.0',
      description: 'API documentation for FicaGo Backend',
    },
    servers: [
      {
        url: '/v1/api',
        description: 'Development server',
      },
    ],    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/routes/**/*.ts', './src/docs/swagger/**/*.yaml'], // Path to the API docs
};

export const specs = swaggerJsdoc(options);
