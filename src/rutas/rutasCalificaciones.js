const { Router } = require('express');
const { body, param, query } = require('express-validator');
const controlador = require('../controladores/controladorCalificaciones');
const Asignatura = require('../modelos/asignatura');
const Periodo = require('../modelos/periodo');
const router = Router();

/**
 * @swagger
 * tags:
 *   name: Calificaciones
 *   description: Registro e historial de calificaciones por asignatura y período
 */

const validaciones = [
  body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio').isLength({ max: 120 }),
  body('tipo').isIn(['Tarea', 'Examen', 'Prueba', 'Proyecto', 'Practica', 'Exposicion', 'Participacion', 'Otro']),
  body('nota').isFloat({ min: 0 }).withMessage('La nota debe ser un número igual o mayor a cero'),
  body('notaMaxima').optional().isFloat({ min: 0.01 }),
  body('fecha').optional({ nullable: true }).isISO8601(),
  body('observacion').optional({ nullable: true }).isString(),
  body('asignaturaId').isInt({ min: 1 }).bail().custom(async id => {
    if (!await Asignatura.findByPk(id)) throw new Error('La asignatura no existe');
  }),
  body('periodoId').isInt({ min: 1 }).bail().custom(async id => {
    if (!await Periodo.findByPk(id)) throw new Error('El período no existe');
  })
];

/**
 * @swagger
 * /api/calificaciones:
 *   get:
 *     summary: Listar calificaciones con filtros opcionales
 *     tags: [Calificaciones]
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
 *           enum: [Tarea, Examen, Prueba, Proyecto, Practica, Exposicion, Participacion, Otro]
 *     responses:
 *       200:
 *         description: Lista de calificaciones
 */
router.get('/', query('asignaturaId').optional().isInt(), query('periodoId').optional().isInt(), controlador.listar);

/**
 * @swagger
 * /api/calificaciones/{id}:
 *   get:
 *     summary: Obtener una calificación por su ID
 *     tags: [Calificaciones]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Calificación encontrada
 *       404:
 *         description: Calificación no encontrada
 */
router.get('/:id', param('id').isInt(), controlador.obtener);

/**
 * @swagger
 * /api/calificaciones:
 *   post:
 *     summary: Registrar una calificación
 *     tags: [Calificaciones]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CalificacionEntrada'
 *     responses:
 *       201:
 *         description: Calificación registrada
 *       400:
 *         description: Datos inválidos o nota superior a la nota máxima
 */
router.post('/', ...validaciones, controlador.guardar);

/**
 * @swagger
 * /api/calificaciones/{id}:
 *   put:
 *     summary: Actualizar una calificación
 *     tags: [Calificaciones]
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
 *             $ref: '#/components/schemas/CalificacionEntrada'
 *     responses:
 *       200:
 *         description: Calificación actualizada
 *       400:
 *         description: Datos inválidos o nota superior a la nota máxima
 *       404:
 *         description: Calificación no encontrada
 */
router.put('/:id', param('id').isInt(), ...validaciones, controlador.actualizar);

/**
 * @swagger
 * /api/calificaciones/{id}:
 *   delete:
 *     summary: Eliminar una calificación
 *     tags: [Calificaciones]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Calificación eliminada
 *       404:
 *         description: Calificación no encontrada
 */
router.delete('/:id', param('id').isInt(), controlador.eliminar);

/**
 * @swagger
 * components:
 *   schemas:
 *     CalificacionEntrada:
 *       type: object
 *       required: [nombre, tipo, nota, asignaturaId, periodoId]
 *       properties:
 *         nombre:
 *           type: string
 *         tipo:
 *           type: string
 *           enum: [Tarea, Examen, Prueba, Proyecto, Practica, Exposicion, Participacion, Otro]
 *         nota:
 *           type: number
 *         notaMaxima:
 *           type: number
 *           default: 100
 *         fecha:
 *           type: string
 *           format: date
 *           nullable: true
 *         observacion:
 *           type: string
 *           nullable: true
 *         asignaturaId:
 *           type: integer
 *         periodoId:
 *           type: integer
 */
module.exports = router;
