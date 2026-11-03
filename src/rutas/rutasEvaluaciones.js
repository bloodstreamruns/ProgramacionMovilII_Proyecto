const { Router } = require('express');
const { body, param, query } = require('express-validator');
const controlador = require('../controladores/controladorEvaluaciones');
const Evaluacion = require('../modelos/evaluacion');
const Asignatura = require('../modelos/asignatura');
const Periodo = require('../modelos/periodo');
const router = Router();

/**
 * @swagger
 * tags:
 *   name: Evaluaciones
 *   description: Organización de exámenes, pruebas y otras evaluaciones
 */

const validaciones = [
  body('titulo').trim().notEmpty().withMessage('El título es obligatorio').isLength({ max: 150 }),
  body('tipo').isIn(Evaluacion.TIPOS).withMessage('Tipo de evaluación no válido'),
  body('fecha').isISO8601().withMessage('La fecha debe ser válida'),
  body('hora').optional({ nullable: true }).matches(/^([01]\d|2[0-3]):[0-5]\d$/).withMessage('La hora debe usar formato HH:MM'),
  body('descripcion').optional({ nullable: true }).isString(),
  body('lugar').optional({ nullable: true }).isLength({ max: 120 }),
  body('valor').optional({ nullable: true }).isFloat({ min: 0 }),
  body('estado').optional().isIn(Evaluacion.ESTADOS),
  body('asignaturaId').isInt({ min: 1 }).bail().custom(async id => {
    if (!await Asignatura.findByPk(id)) throw new Error('La asignatura no existe');
  }),
  body('periodoId').isInt({ min: 1 }).bail().custom(async id => {
    if (!await Periodo.findByPk(id)) throw new Error('El período no existe');
  })
];

/**
 * @swagger
 * /api/evaluaciones:
 *   get:
 *     summary: Listar evaluaciones con filtros opcionales
 *     tags: [Evaluaciones]
 *     parameters:
 *       - in: query
 *         name: asignaturaId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: periodoId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *           enum: [Examen, Prueba, Tarea, Exposicion, Proyecto, Practica, Otro]
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [Pendiente, Realizada, Cancelada]
 *     responses:
 *       200:
 *         description: Lista de evaluaciones
 */
router.get('/', query('asignaturaId').optional().isInt(), query('periodoId').optional().isInt(),
  query('tipo').optional().isIn(Evaluacion.TIPOS), query('estado').optional().isIn(Evaluacion.ESTADOS), controlador.listar);

/**
 * @swagger
 * /api/evaluaciones/{id}:
 *   get:
 *     summary: Obtener una evaluación por su ID
 *     tags: [Evaluaciones]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Evaluación encontrada
 *       404:
 *         description: Evaluación no encontrada
 */
router.get('/:id', param('id').isInt(), controlador.obtener);

/**
 * @swagger
 * /api/evaluaciones:
 *   post:
 *     summary: Crear una evaluación
 *     tags: [Evaluaciones]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EvaluacionEntrada'
 *     responses:
 *       201:
 *         description: Evaluación creada
 *       400:
 *         description: Datos inválidos
 */
router.post('/', ...validaciones, controlador.guardar);

/**
 * @swagger
 * /api/evaluaciones/{id}:
 *   put:
 *     summary: Actualizar una evaluación
 *     tags: [Evaluaciones]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EvaluacionEntrada'
 *     responses:
 *       200:
 *         description: Evaluación actualizada
 *       404:
 *         description: Evaluación no encontrada
 */
router.put('/:id', param('id').isInt(), ...validaciones, controlador.actualizar);

/**
 * @swagger
 * /api/evaluaciones/{id}:
 *   delete:
 *     summary: Eliminar una evaluación
 *     tags: [Evaluaciones]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Evaluación eliminada
 *       404:
 *         description: Evaluación no encontrada
 */
router.delete('/:id', param('id').isInt(), controlador.eliminar);

/**
 * @swagger
 * components:
 *   schemas:
 *     EvaluacionEntrada:
 *       type: object
 *       required: [titulo, tipo, fecha, asignaturaId, periodoId]
 *       properties:
 *         titulo:
 *           type: string
 *         descripcion:
 *           type: string
 *           nullable: true
 *         tipo:
 *           type: string
 *           enum: [Examen, Prueba, Tarea, Exposicion, Proyecto, Practica, Otro]
 *         fecha:
 *           type: string
 *           format: date-time
 *         hora:
 *           type: string
 *           format: time
 *           nullable: true
 *         lugar:
 *           type: string
 *           nullable: true
 *         valor:
 *           type: number
 *           nullable: true
 *         estado:
 *           type: string
 *           enum: [Pendiente, Realizada, Cancelada]
 *         asignaturaId:
 *           type: integer
 *         periodoId:
 *           type: integer
 */
module.exports = router;
