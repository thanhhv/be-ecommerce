import swaggerJSDoc from 'swagger-jsdoc';
import path from 'path';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Ecommerce Cây API',
      version: '1.0.0',
      description: 'REST API for Ecommerce Cây plant store',
    },
    servers: [
      {
        url: 'http://localhost:3001',
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
      schemas: {
        ApiSuccess: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
            message: { type: 'string' },
          },
        },
        ApiError: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
              },
            },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer' },
            limit: { type: 'integer' },
            total: { type: 'integer' },
            totalPages: { type: 'integer' },
          },
        },
      },
    },
    tags: [
      { name: 'Health', description: 'Health check' },
      { name: 'Auth', description: 'Authentication & authorization' },
      { name: 'Users', description: 'User profile management' },
      { name: 'Products', description: 'Product catalog' },
      { name: 'Categories', description: 'Product categories' },
      { name: 'Cart', description: 'Shopping cart' },
      { name: 'Orders', description: 'Order management' },
      { name: 'Admin - Products', description: 'Admin product management' },
      { name: 'Admin - Orders', description: 'Admin order management' },
      { name: 'Admin - Dashboard', description: 'Admin dashboard, inventory, and user management' },
    ],
  },
  apis: [
    path.resolve(__dirname, '../../presentation/routes/**/*.ts'),
    path.resolve(__dirname, '../../presentation/routes/**/*.js'),
  ],
};

export const swaggerSpec = swaggerJSDoc(options);
