const { Router } = require('express');
const { body, query } = require('express-validator');
const { Op } = require('sequelize');
const controladorUsuarios = require('../controladores/controladorUsuarios');
const Usuario = require('../modelos/usuario');
const { autenticar, autorizar } = require('../configuraciones/passport');
const router = Router();

const ROLES = ['administrador', 'estudiante'];

const campoUnico = (campo, mensaje) => async (value, { req }) => {
  const where = { [campo]: value };
  if (req.query.id) where.id = { [Op.ne]: Number(req.query.id) };
  const existente = await Usuario.findOne({ where });
  if (existente) {
    throw new Error(mensaje);
  }
  return true;
};

const validarId = query('id').notEmpty().withMessage('El ID del usuario es obligatorio')
  .isInt().withMessage('El ID del usuario debe ser un número entero');

const validacionesCuerpo = [
  body('nombre').notEmpty().withMessage('El nombre del usuario es obligatorio')
    .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres')
    .custom(campoUnico('nombre', 'El nombre del usuario ya está en uso')),
  body('correoElectronico').notEmpty().withMessage('El correo electrónico del usuario es obligatorio')
    .isEmail().withMessage('El correo electrónico debe ser un correo válido')
    .isLength({ max: 100 }).withMessage('El correo electrónico debe tener un máximo de 100 caracteres')
    .custom(campoUnico('correoElectronico', 'El correo electrónico del usuario ya está en uso')),
  body('pin').optional({ nullable: true })
    .isNumeric({ no_symbols: true }).withMessage('El PIN debe contener solo dígitos')
    .isLength({ min: 4, max: 6 }).withMessage('El PIN debe tener entre 4 y 6 dígitos'),
  body('rol').notEmpty().withMessage('El rol del usuario es obligatorio')
    .isIn(ROLES).withMessage(`El rol debe ser uno de: ${ROLES.join(', ')}`),
];

const validarContrasena = (obligatoria) => {
  const campo = body('contrasena');
  const base = obligatoria
    ? campo.notEmpty().withMessage('La contraseña del usuario es obligatoria')
    : campo.optional();
  return base.isLength({ min: 8, max: 100 }).withMessage('La contraseña debe tener entre 8 y 100 caracteres');
};

router.use(autenticar, autorizar('administrador'));

/**
 * @swagger
 * tags:
 *   name: Usuarios
 *   description: Rutas para la gestión de usuarios (solo administradores)
 */

/**
 * @swagger
 * /api/usuarios:
 *   get:
 *     summary: Obtener usuarios con filtros opcionales
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: rol
 *         schema:
 *           type: string
 *           enum: [administrador, estudiante]
 *       - in: query
 *         name: estado
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Lista de usuarios obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Usuario'
 *       403:
 *         description: Sin permisos para realizar esta acción
 */
router.get('/',
  query('rol').optional().isIn(ROLES).withMessage(`El rol debe ser uno de: ${ROLES.join(', ')}`),
  query('estado').optional().isBoolean().withMessage('El estado debe ser un valor booleano'),
  controladorUsuarios.listarUsuarios
);

/**
 * @swagger
 * /api/usuarios/buscarid:
 *   get:
 *     summary: Obtener un usuario por su ID
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: Usuario encontrado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Usuario'
 *       404:
 *         description: Usuario no encontrado
 */
router.get('/buscarid', validarId, controladorUsuarios.obtenerUsuarioPorId);

/**
 * @swagger
 * /api/usuarios/guardar:
 *   post:
 *     summary: Crear un nuevo usuario
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UsuarioEntrada'
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Usuario'
 *       400:
 *         description: Error en la solicitud (validación fallida)
 */
router.post('/guardar',
  ...validacionesCuerpo,
  validarContrasena(true),
  body('estado').optional().isBoolean().withMessage('El estado del usuario debe ser un valor booleano'),
  controladorUsuarios.crearUsuario
);

/**
 * @swagger
 * /api/usuarios/actualizar:
 *   put:
 *     summary: Actualizar un usuario existente
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UsuarioEntrada'
 *     responses:
 *       200:
 *         description: Usuario actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Usuario'
 *       400:
 *         description: Error en la solicitud (validación fallida)
 *       404:
 *         description: Usuario no encontrado
 */
router.put('/actualizar',
  validarId,
  ...validacionesCuerpo,
  validarContrasena(false),
  body('estado').notEmpty().withMessage('El estado del usuario es obligatorio')
    .isBoolean().withMessage('El estado del usuario debe ser un valor booleano'),
  controladorUsuarios.actualizarUsuario
);

/**
 * @swagger
 * /api/usuarios/eliminar:
 *   delete:
 *     summary: Eliminar un usuario junto con sus sesiones
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: Usuario eliminado exitosamente
 *       404:
 *         description: Usuario no encontrado
 */
router.delete('/eliminar', validarId, controladorUsuarios.eliminarUsuario);

/**
 * @swagger
 * components:
 *   schemas:
 *     UsuarioEntrada:
 *       type: object
 *       required:
 *         - nombre
 *         - correoElectronico
 *         - rol
 *       properties:
 *         nombre:
 *           type: string
 *         correoElectronico:
 *           type: string
 *         contrasena:
 *           type: string
 *           minLength: 8
 *           description: Obligatoria al crear. Si se omite al actualizar, se conserva la actual
 *         pin:
 *           type: string
 *           nullable: true
 *           description: Entre 4 y 6 dígitos
 *         rol:
 *           type: string
 *           enum: [administrador, estudiante]
 *         estado:
 *           type: boolean
 *           description: Obligatorio al actualizar
 *     Usuario:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         nombre:
 *           type: string
 *         correoElectronico:
 *           type: string
 *         rol:
 *           type: string
 *         estado:
 *           type: boolean
 */
module.exports = router;