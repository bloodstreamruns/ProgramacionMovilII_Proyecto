const path = require('path');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API de Programación Móvil II',
      version: '1.0.0',
      description: 'Documentación de la API del proyecto.\n\nFlujo de uso: solicita un PIN por correo, inicia sesión con usuario, contraseña y PIN, copia el token JWT real de la respuesta en Authorize y luego utiliza las rutas protegidas. Swagger puede aceptar cualquier texto en Authorize, pero el servidor rechaza valores que no sean un JWT emitido y una sesión activa. Al terminar, cierra la sesión.'
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Servidor local'
      }
    ],
    security: [
      {
        bearerAuth: []
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: [
    path.resolve(__dirname, '../rutas/*.js').replace(/\\/g, '/')
  ]
};

const swaggerSpec = swaggerJsDoc(options);

module.exports = (app) => {
  const ordenAutenticacion = [
    '/api/autenticacion/solicitarpin',
    '/api/autenticacion/iniciarsesion',
    '/api/autenticacion/perfil',
    '/api/autenticacion/cerrarsesion',
  ];

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    tagsSorter: 'alpha',
    operationsSorter: (a, b) => {
      const pathA = a.get('path');
      const pathB = b.get('path');
      const ordenA = ordenAutenticacion.indexOf(pathA);
      const ordenB = ordenAutenticacion.indexOf(pathB);

      if (ordenA !== -1 || ordenB !== -1) {
        if (ordenA === -1) return 1;
        if (ordenB === -1) return -1;
        return ordenA - ordenB;
      }

      return pathA.localeCompare(pathB)
        || a.get('method').localeCompare(b.get('method'));
    },
  }));
  app.get('/api-docs-json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
};