const { Router } = require('express');
const controladorMetas = require('../controladores/controladorMetas');
const Meta = require('../modelos/meta');
const Estudiante = require('../modelos/estudiante');
const Asignatura = require('../modelos/asignatura');
const { body, query } = require('express-validator');
const router = Router();

const FORMATO_FECHA = { format: 'YYYY-MM-DD', strictMode: true };

const validarId = query('id').notEmpty().withMessage('El ID de la meta es obligatorio')
  .isInt().withMessage('El ID de la meta debe ser un número entero');

const validacionesBase = [
  body('titulo').notEmpty().withMessage('El título de la meta es obligatorio')
    .isLength({ min: 3, max: 150 }).withMessage('El título de la meta debe tener entre 3 y 150 caracteres'),
  body('descripcion').optional({ nullable: true }).isString().withMessage('La descripción debe ser una cadena de texto'),
  body('fechaLimite').notEmpty().withMessage('La fecha límite es obligatoria')
    .isDate(FORMATO_FECHA).withMessage('La fecha límite debe tener formato YYYY-MM-DD')
    .custom((value, { req }) => {
      if (req.body.fechaInicio && value < req.body.fechaInicio) {
        throw new Error('La fecha límite no puede ser anterior a la fecha de inicio');
      }
      return true;
    }),
  body('valorObjetivo').notEmpty().withMessage('El valor objetivo es obligatorio')
    .isInt({ min: 1 }).withMessage('El valor objetivo debe ser un entero mayor o igual a 1'),
  body('asignaturaId').optional({ nullable: true })
    .isInt().withMessage('El ID de la asignatura debe ser un número entero')
    .custom(async (value) => {
      const asignatura = await Asignatura.findByPk(value);
      if (!asignatura) {
        throw new Error('La asignatura con el ID proporcionado no existe');
      }
      return true;
    }),
];

/**
 * @swagger
 * /api/metas:
 *   get:
 *     summary: Obtener metas académicas con filtros opcionales
 *     tags: [Metas]
 *     parameters:
 *       - in: query
 *         name: estudianteId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: asignaturaId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [Pendiente, En progreso, Cumplida, Cancelada]
 *       - in: query
 *         name: vencidas
 *         schema:
 *           type: boolean
 *         description: Si es true, devuelve las metas activas con fecha límite vencida e ignora el filtro de estado
 *     responses:
 *       200:
 *         description: Lista de metas obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Meta'
 */
router.get('/',
  query('estudianteId').optional().isInt().withMessage('El ID del estudiante debe ser un número entero'),
  query('asignaturaId').optional().isInt().withMessage('El ID de la asignatura debe ser un número entero'),
  query('estado').optional().isIn(Meta.ESTADOS).withMessage('El estado de la meta no es válido'),
  query('vencidas').optional().isBoolean().withMessage('El parámetro vencidas debe ser un valor booleano'),
  controladorMetas.listarMetas
);

/**
 * @swagger
 * /api/metas/buscarid:
 *   get:
 *     summary: Obtener una meta por su ID
 *     tags: [Metas]
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: Meta encontrada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Meta'
 *       404:
 *         description: Meta no encontrada
 */
router.get('/buscarid', validarId, controladorMetas.obtenerMetaPorId);

/**
 * @swagger
 * /api/metas/guardar:
 *   post:
 *     summary: Crear una nueva meta académica
 *     tags: [Metas]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MetaEntrada'
 *     responses:
 *       201:
 *         description: Meta creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Meta'
 *       400:
 *         description: Error en la solicitud (validación fallida)
 */
router.post('/guardar',
  ...validacionesBase,
  body('fechaInicio').optional().isDate(FORMATO_FECHA).withMessage('La fecha de inicio debe tener formato YYYY-MM-DD'),
  body('unidad').optional().isLength({ min: 1, max: 50 }).withMessage('La unidad debe tener entre 1 y 50 caracteres'),
  body('valorActual').optional().isInt({ min: 0 }).withMessage('El progreso inicial debe ser un entero mayor o igual a 0'),
  body('estudianteId').notEmpty().withMessage('El ID del estudiante es obligatorio')
    .isInt().withMessage('El ID del estudiante debe ser un número entero')
    .custom(async (value) => {
      const estudiante = await Estudiante.findByPk(value);
      if (!estudiante) {
        throw new Error('El estudiante con el ID proporcionado no existe');
      }
      return true;
    }),
  controladorMetas.crearMeta
);

/**
 * @swagger
 * /api/metas/actualizar:
 *   put:
 *     summary: Actualizar los datos de una meta (el progreso se registra por separado)
 *     tags: [Metas]
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
 *             $ref: '#/components/schemas/MetaEntrada'
 *     responses:
 *       200:
 *         description: Meta actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Meta'
 *       400:
 *         description: Error en la solicitud (validación fallida)
 *       404:
 *         description: Meta no encontrada
 */
router.put('/actualizar',
  validarId,
  ...validacionesBase,
  body('fechaInicio').notEmpty().withMessage('La fecha de inicio es obligatoria')
    .isDate(FORMATO_FECHA).withMessage('La fecha de inicio debe tener formato YYYY-MM-DD'),
  body('unidad').notEmpty().withMessage('La unidad es obligatoria')
    .isLength({ min: 1, max: 50 }).withMessage('La unidad debe tener entre 1 y 50 caracteres'),
  controladorMetas.actualizarMeta
);

/**
 * @swagger
 * /api/metas/progreso:
 *   put:
 *     summary: Registrar el progreso acumulado de una meta
 *     tags: [Metas]
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
 *             type: object
 *             required:
 *               - valorActual
 *             properties:
 *               valorActual:
 *                 type: integer
 *                 description: Cantidad acumulada lograda, en la unidad de la meta
 *     responses:
 *       200:
 *         description: Progreso registrado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Meta'
 *       400:
 *         description: El progreso supera el objetivo
 *       404:
 *         description: Meta no encontrada
 *       409:
 *         description: La meta está cancelada
 */
router.put('/progreso',
  validarId,
  body('valorActual').notEmpty().withMessage('El progreso es obligatorio')
    .isInt({ min: 0 }).withMessage('El progreso debe ser un entero mayor o igual a 0'),
  controladorMetas.registrarProgreso
);

/**
 * @swagger
 * /api/metas/cancelar:
 *   put:
 *     summary: Cancelar una meta o reactivarla según su progreso
 *     tags: [Metas]
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
 *             type: object
 *             required:
 *               - cancelada
 *             properties:
 *               cancelada:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Estado de la meta actualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Meta'
 *       404:
 *         description: Meta no encontrada
 */
router.put('/cancelar',
  validarId,
  body('cancelada').notEmpty().withMessage('El campo cancelada es obligatorio')
    .isBoolean().withMessage('El campo cancelada debe ser un valor booleano')
    .toBoolean(),
  controladorMetas.cancelarMeta
);

/**
 * @swagger
 * /api/metas/eliminar:
 *   delete:
 *     summary: Eliminar una meta
 *     tags: [Metas]
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: Meta eliminada exitosamente
 *       404:
 *         description: Meta no encontrada
 */
router.delete('/eliminar', validarId, controladorMetas.eliminarMeta);

/**
 * @swagger
 * components:
 *   schemas:
 *     MetaEntrada:
 *       type: object
 *       required:
 *         - titulo
 *         - fechaLimite
 *         - valorObjetivo
 *         - estudianteId
 *       properties:
 *         titulo:
 *           type: string
 *         descripcion:
 *           type: string
 *         fechaInicio:
 *           type: string
 *           format: date
 *           description: Por defecto, la fecha actual (obligatoria al actualizar)
 *         fechaLimite:
 *           type: string
 *           format: date
 *         valorObjetivo:
 *           type: integer
 *           description: Cantidad a alcanzar, en la unidad indicada
 *         unidad:
 *           type: string
 *           description: Unidad de medida del objetivo (módulos, horas, ejercicios)
 *         valorActual:
 *           type: integer
 *           description: Progreso inicial; solo se acepta al crear
 *         estudianteId:
 *           type: integer
 *           description: Solo se envía al crear; no es modificable
 *         asignaturaId:
 *           type: integer
 *           description: Asignatura asociada (opcional)
 *     Meta:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         titulo:
 *           type: string
 *         descripcion:
 *           type: string
 *         fechaInicio:
 *           type: string
 *           format: date
 *         fechaLimite:
 *           type: string
 *           format: date
 *         valorObjetivo:
 *           type: integer
 *         valorActual:
 *           type: integer
 *         unidad:
 *           type: string
 *         estado:
 *           type: string
 *           enum: [Pendiente, En progreso, Cumplida, Cancelada]
 *         porcentaje:
 *           type: integer
 *           description: Avance calculado, de 0 a 100
 *         vencida:
 *           type: boolean
 *           description: Verdadero si la meta sigue activa y su fecha límite ya pasó
 *         estudianteId:
 *           type: integer
 *         asignaturaId:
 *           type: integer
 */
module.exports = router;