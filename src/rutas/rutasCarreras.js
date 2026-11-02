const { Router } = require('express');
const { body, query } = require('express-validator');
const { Op } = require('sequelize');
const controladorCarreras = require('../controladores/controladorCarreras');
const Carrera = require('../modelos/carreras');
const { autenticar, autorizar } = require('../configuracion/passport');
const router = Router();

const GRADOS = ['Licenciatura', 'Maestría', 'Doctorado'];

const campoUnico = (campo, mensaje) => async (value, { req }) => {
  const where = { [campo]: value };
  if (req.query.id) where.id = { [Op.ne]: Number(req.query.id) };
  const existente = await Carrera.findOne({ where });
  if (existente) {
    throw new Error(mensaje);
  }
  return true;
};

const validarId = query('id').notEmpty().withMessage('El ID de la carrera es obligatorio')
  .isInt().withMessage('El ID de la carrera debe ser un número entero');

const validacionesCuerpo = [
  body('codigo').notEmpty().withMessage('El código de la carrera es obligatorio')
    .isLength({ min: 1, max: 10 }).withMessage('El código de la carrera debe tener entre 1 y 10 caracteres')
    .custom(campoUnico('codigo', 'El código de la carrera ya está registrado')),
  body('nombre').notEmpty().withMessage('El nombre de la carrera es obligatorio')
    .isLength({ min: 2, max: 100 }).withMessage('El nombre de la carrera debe tener entre 2 y 100 caracteres')
    .custom(campoUnico('nombre', 'El nombre de la carrera ya está registrado')),
  body('descripcion').optional({ nullable: true })
    .isString().withMessage('La descripción debe ser texto'),
  body('grado').notEmpty().withMessage('El grado de la carrera es obligatorio')
    .isIn(GRADOS).withMessage(`El grado debe ser uno de: ${GRADOS.join(', ')}`),
];

router.use(autenticar);

/**
 * @swagger
 * tags:
 *   name: Carreras
 *   description: Rutas para la gestión de carreras
 */

/**
 * @swagger
 * /api/carreras:
 *   get:
 *     summary: Obtener carreras con filtros opcionales
 *     tags: [Carreras]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: grado
 *         schema:
 *           type: string
 *           enum: [Licenciatura, Maestría, Doctorado]
 *       - in: query
 *         name: estado
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Lista de carreras obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Carrera'
 *       401:
 *         description: Token inválido o sesión no activa
 */
router.get('/',
  query('grado').optional().isIn(GRADOS).withMessage(`El grado debe ser uno de: ${GRADOS.join(', ')}`),
  query('estado').optional().isBoolean().withMessage('El estado debe ser un valor booleano'),
  controladorCarreras.listarCarreras
);

/**
 * @swagger
 * /api/carreras/buscarid:
 *   get:
 *     summary: Obtener una carrera por su ID
 *     tags: [Carreras]
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
 *         description: Carrera encontrada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Carrera'
 *       404:
 *         description: Carrera no encontrada
 */
router.get('/buscarid', validarId, controladorCarreras.obtenerCarreraPorId);

/**
 * @swagger
 * /api/carreras/buscarcodigo:
 *   get:
 *     summary: Obtener una carrera por su código
 *     tags: [Carreras]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: codigo
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Carrera encontrada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Carrera'
 *       404:
 *         description: Carrera no encontrada
 */
router.get('/buscarcodigo',
  query('codigo').notEmpty().withMessage('El código de la carrera es obligatorio')
    .isLength({ max: 10 }).withMessage('El código de la carrera debe tener un máximo de 10 caracteres'),
  controladorCarreras.obtenerCarreraPorCodigo
);

/**
 * @swagger
 * /api/carreras/guardar:
 *   post:
 *     summary: Crear una nueva carrera (solo administradores)
 *     tags: [Carreras]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CarreraEntrada'
 *     responses:
 *       201:
 *         description: Carrera creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Carrera'
 *       400:
 *         description: Error en la solicitud (validación fallida)
 *       403:
 *         description: Sin permisos para realizar esta acción
 */
router.post('/guardar',
  autorizar('administrador'),
  ...validacionesCuerpo,
  body('estado').optional().isBoolean().withMessage('El estado de la carrera debe ser un valor booleano'),
  controladorCarreras.crearCarrera
);

/**
 * @swagger
 * /api/carreras/actualizar:
 *   put:
 *     summary: Actualizar una carrera existente (solo administradores)
 *     tags: [Carreras]
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
 *             $ref: '#/components/schemas/CarreraEntrada'
 *     responses:
 *       200:
 *         description: Carrera actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Carrera'
 *       400:
 *         description: Error en la solicitud (validación fallida)
 *       403:
 *         description: Sin permisos para realizar esta acción
 *       404:
 *         description: Carrera no encontrada
 */
router.put('/actualizar',
  autorizar('administrador'),
  validarId,
  ...validacionesCuerpo,
  body('estado').notEmpty().withMessage('El estado de la carrera es obligatorio')
    .isBoolean().withMessage('El estado de la carrera debe ser un valor booleano'),
  controladorCarreras.actualizarCarrera
);

/**
 * @swagger
 * /api/carreras/eliminar:
 *   delete:
 *     summary: Eliminar una carrera (solo administradores)
 *     tags: [Carreras]
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
 *         description: Carrera eliminada exitosamente
 *       403:
 *         description: Sin permisos para realizar esta acción
 *       404:
 *         description: Carrera no encontrada
 *       409:
 *         description: La carrera tiene estudiantes asociados
 */
router.delete('/eliminar',
  autorizar('administrador'),
  validarId,
  controladorCarreras.eliminarCarrera
);

/**
 * @swagger
 * components:
 *   schemas:
 *     CarreraEntrada:
 *       type: object
 *       required:
 *         - codigo
 *         - nombre
 *         - grado
 *       properties:
 *         codigo:
 *           type: string
 *           maxLength: 10
 *         nombre:
 *           type: string
 *           maxLength: 100
 *         descripcion:
 *           type: string
 *           nullable: true
 *         grado:
 *           type: string
 *           enum: [Licenciatura, Maestría, Doctorado]
 *         estado:
 *           type: boolean
 *           description: Obligatorio al actualizar
 *     Carrera:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         codigo:
 *           type: string
 *         nombre:
 *           type: string
 *         descripcion:
 *           type: string
 *           nullable: true
 *         grado:
 *           type: string
 *         estado:
 *           type: boolean
 */
module.exports = router;