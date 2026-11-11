const { Router } = require('express');
const { body, query } = require('express-validator');
const controladorAutenticacion = require('../controladores/controladorAutenticacion');
const { autenticar } = require('../configuracion/passport');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Autenticación
 *   description: Rutas para el inicio y cierre de sesión
 */

/**
 * @swagger
 * /api/autenticacion/iniciarsesion:
 *   post:
 *     summary: Iniciar sesión y obtener un token JWT
 *     tags: [Autenticación]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CredencialesEntrada'
 *     responses:
 *       200:
 *         description: Sesión iniciada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SesionRespuesta'
 *       400:
 *         description: Error en la solicitud (validación fallida)
 *       401:
 *         description: Credenciales incorrectas o usuario inactivo
 */
router.post(
  '/iniciarsesion',
  body('usuario')
    .trim()
    .notEmpty()
    .withMessage('El correo electrónico o nombre de usuario es obligatorio')
    .bail()
    .custom((_, { req }) => {
      const { contrasena, pin } = req.body || {};
      const tieneCredencial = [contrasena, pin].some(
        (valor) => typeof valor === 'string' && valor.length > 0
      );

      if (!tieneCredencial) {
        throw new Error('Debe proporcionar una contraseña o un PIN');
      }

      return true;
    }),
  body('contrasena').optional().isString()
    .withMessage('La contraseña debe ser texto'),
  body('pin').optional().isString()
    .withMessage('El PIN debe ser texto'),
  controladorAutenticacion.iniciarSesion
);

/**
 * @swagger
 * /api/autenticacion/perfil:
 *   get:
 *     summary: Obtener los datos del usuario autenticado
 *     tags: [Autenticación]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Usuario'
 *       401:
 *         description: Token inválido o sesión no activa
 */
router.get('/perfil', autenticar, controladorAutenticacion.obtenerPerfil);

/**
 * @swagger
 * /api/autenticacion/cerrarsesion:
 *   post:
 *     summary: Cerrar la sesión actual o todas las sesiones del usuario
 *     tags: [Autenticación]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: todas
 *         schema:
 *           type: boolean
 *         description: Si es true, revoca todas las sesiones activas del usuario
 *     responses:
 *       200:
 *         description: Sesión cerrada exitosamente
 *       401:
 *         description: Token inválido o sesión no activa
 *       404:
 *         description: No se encontró una sesión activa para cerrar
 */
router.post('/cerrarsesion',
  query('todas').optional().isBoolean().withMessage('El parámetro todas debe ser un valor booleano'),
  autenticar,
  controladorAutenticacion.cerrarSesion
);

/**
 /**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     CredencialesEntrada:
 *       type: object
 *       required:
 *         - usuario
 *       properties:
 *         usuario:
 *           type: string
 *           description: Correo electrónico o nombre de usuario
 *           example: usuario@correo.com
 *         contrasena:
 *           type: string
 *           format: password
 *           description: Envíe contraseña o PIN
 *           example: "123456"
 *         pin:
 *           type: string
 *           description: Envíe contraseña o PIN
 *           example: "1234"
 *     SesionRespuesta:
 *       type: object
 *       properties:
 *         token:
 *           type: string
 *         usuario:
 *           $ref: '#/components/schemas/Usuario'
 */
module.exports = router;