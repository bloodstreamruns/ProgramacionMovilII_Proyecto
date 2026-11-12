const {Router} = require('express');
const controladorPeriodo = require('../controladores/controladorPeriodo');
const { body, query } = require('express-validator');
const router = Router();

/**
 * @swagger
 * tags:
 *   name: Períodos
 *   description: Administración de períodos académicos
 */

/**
 * @swagger
 * /api/periodos/periodo:
 *   post:
 *     summary: Crear un período académico
 *     tags: [Períodos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PeriodoEntrada'
 *     responses:
 *       201:
 *         description: Período creado
 *       400:
 *         description: Datos inválidos
 */
router.post('/periodo', [
    body('periodoquecursa').notEmpty().withMessage('El campo periodoquecursa es obligatorio')
        .isLength({ max: 50 }).withMessage('El campo periodoquecursa no debe superar 50 caracteres'),
    body('año').notEmpty().withMessage('El campo año es obligatorio'),
    body('fechainicio').optional().isDate().withMessage('El campo fechainicio debe ser una fecha válida'),
    body('fechafin').optional().isDate().withMessage('El campo fechafin debe ser una fecha válida'),
    body('estado').optional()
        .isString().withMessage('El campo estado debe ser texto')
        .isLength({ min: 1, max: 20 }).withMessage('El campo estado debe tener entre 1 y 20 caracteres'),
], controladorPeriodo.crearPeriodo);

/**
 * @swagger
 * /api/periodos/periodos:
 *   get:
 *     summary: Listar períodos académicos
 *     tags: [Períodos]
 *     responses:
 *       200:
 *         description: Lista de períodos
 */
router.get('/periodos', controladorPeriodo.obtenerPeriodos);

/**
 * @swagger
 * /api/periodos/periodo/{id}:
 *   get:
 *     summary: Obtener un período por ID
 *     tags: [Períodos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Período encontrado
 *       404:
 *         description: Período no encontrado
 */
router.get('/periodo/:id', controladorPeriodo.listarPeriodoPorId);

/**
 * @swagger
 * /api/periodos/periodo/{id}:
 *   put:
 *     summary: Actualizar un período académico
 *     tags: [Períodos]
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
 *             $ref: '#/components/schemas/PeriodoEntrada'
 *     responses:
 *       200:
 *         description: Período actualizado
 *       404:
 *         description: Período no encontrado
 */
router.put('/periodo/:id', [
    body('periodoquecursa').notEmpty().withMessage('El campo periodoquecursa es obligatorio')
        .isLength({ max: 50 }).withMessage('El campo periodoquecursa no debe superar 50 caracteres'),
    body('año').notEmpty().withMessage('El campo año es obligatorio'),
    body('fechainicio').optional().isDate().withMessage('El campo fechainicio debe ser una fecha válida'),
    body('fechafin').optional().isDate().withMessage('El campo fechafin debe ser una fecha válida'),
    body('estado').optional()
        .isString().withMessage('El campo estado debe ser texto')
        .isLength({ min: 1, max: 20 }).withMessage('El campo estado debe tener entre 1 y 20 caracteres'),
], controladorPeriodo.actualizarPeriodo);

/**
 * @swagger
 * /api/periodos/periodo/{id}:
 *   delete:
 *     summary: Eliminar un período académico
 *     tags: [Períodos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Período eliminado
 *       404:
 *         description: Período no encontrado
 */
router.delete('/periodo/:id', controladorPeriodo.eliminarPeriodo);

/**
 * @swagger
 * components:
 *   schemas:
 *     PeriodoEntrada:
 *       type: object
 *       required: [periodoquecursa, año]
 *       properties:
 *         periodoquecursa:
 *           type: string
 *           maxLength: 50
 *         año:
 *           type: string
 *         fechainicio:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         fechafin:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         estado:
 *           type: string
 *           description: Estado del período. Si se omite al crear, se asigna Activo.
 *           example: Activo
 */
module.exports = router;
