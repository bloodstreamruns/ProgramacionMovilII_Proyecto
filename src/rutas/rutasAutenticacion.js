const { Router } = require('express');
const { body, query } = require('express-validator');
const { rateLimit } = require('express-rate-limit');
const controladorAutenticacion = require('../controladores/controladorAutenticacion');
const { autenticar } = require('../configuracion/passport');

const router = Router();
const limitarSolicitudesPin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Se alcanzó el límite de solicitudes de PIN. Intente más tarde.' },
});
const limitarIniciosSesion = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Se alcanzó el límite de intentos de inicio de sesión. Intente más tarde.' },
});

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
 *         description: Credenciales incorrectas, PIN incorrecto o PIN vencido
 *       429:
 *         description: Demasiados intentos de inicio de sesión
 */
router.post(
  '/iniciarsesion',
  body('usuario')
    .trim()
    .notEmpty()
    .withMessage('El correo electrónico o nombre de usuario es obligatorio'),
  body('contrasena')
    .isString()
    .withMessage('La contraseña debe ser texto')
    .notEmpty()
    .withMessage('La contraseña es obligatoria'),
  body('pin')
    .isString()
    .withMessage('El PIN debe ser texto')
    .isLength({ min: 6, max: 6 })
    .withMessage('El PIN debe tener exactamente 6 dígitos')
    .isNumeric()
    .withMessage('El PIN debe contener solo números'),
  limitarIniciosSesion,
  controladorAutenticacion.iniciarSesion
);

/**
 * @swagger
 * /api/autenticacion/solicitarpin:
 *   post:
 *     summary: Enviar un PIN por correo para autorizar el acceso a la API
 *     tags: [Autenticación]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SolicitudPinEntrada'
 *     responses:
 *       200:
 *         description: Instrucción genérica para proteger la existencia de las cuentas
 *       400:
 *         description: Usuario o correo no proporcionado
 *       429:
 *         description: Demasiadas solicitudes de PIN
 *       500:
 *         description: No se pudo enviar el correo
 */
router.post(
  '/solicitarpin',
  body('usuario')
    .isString()
    .withMessage('El correo o nombre de usuario debe ser texto')
    .trim()
    .notEmpty()
    .withMessage('El correo o nombre de usuario es obligatorio'),
  limitarSolicitudesPin,
  controladorAutenticacion.enviarPin
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
 * @swagger
 * components:
 *   schemas:
 *     CredencialesEntrada:
 *       type: object
 *       required:
 *         - usuario
 *         - contrasena
 *         - pin
 *       properties:
 *         usuario:
 *           type: string
 *           description: Correo electrónico o nombre de usuario
 *           example: usuario@correo.com
 *         contrasena:
 *           type: string
 *           format: password
 *           example: MiContrasena123
 *         pin:
 *           type: string
 *           description: PIN de 6 dígitos recibido por correo; vence a los 10 minutos
 *           example: "123456"
 *     SolicitudPinEntrada:
 *       type: object
 *       required: [usuario]
 *       properties:
 *         usuario:
 *           type: string
 *           description: Correo registrado o nombre de usuario
 *           example: usuario@correo.com
 *     SesionRespuesta:
 *       type: object
 *       properties:
 *         mensaje:
 *           type: string
 *           example: Inicio de sesión exitoso
 *         token:
 *           type: string
 *           description: Token JWT para autorizar rutas protegidas
 *         usuario:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *             nombre:
 *               type: string
 *             correoElectronico:
 *               type: string
 *             rol:
 *               type: string
 *               enum: [administrador, estudiante]
 */
module.exports = router;