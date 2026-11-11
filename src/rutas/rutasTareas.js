 const {Router} = require('express');
 const controladorTareas = require('../controladores/controladorTareas');
 const { body } = require('express-validator');
    const router = Router();

/**
 * @swagger
 * tags:
 *   name: Tareas
 *   description: Creación y seguimiento de tareas académicas
 */

/**
 * @swagger
 * /api/tareas/tareas:
 *   post:
 *     summary: Crear una tarea
 *     tags: [Tareas]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TareaEntrada'
 *     responses:
 *       201:
 *         description: Tarea creada
 *       400:
 *         description: Datos inválidos
 */
router.post('/tareas', [
    body('fechaEntrega').notEmpty().withMessage('El campo fechaEntrega es obligatorio')
        .isISO8601().withMessage('El campo fechaEntrega debe ser una fecha válida'),
    body('prioridad').notEmpty().withMessage('El campo prioridad es obligatorio'),
    body('descripcion').notEmpty().withMessage('El campo descripcion es obligatorio')
        .isString().withMessage('El campo descripcion debe ser texto'),
], controladorTareas.crearTarea);

/**
 * @swagger
 * /api/tareas/tareas:
 *   get:
 *     summary: Listar tareas
 *     tags: [Tareas]
 *     responses:
 *       200:
 *         description: Lista de tareas
 */
router.get('/tareas', controladorTareas.obtenerTareas);

/**
 * @swagger
 * /api/tareas/tareas/{id}:
 *   get:
 *     summary: Obtener una tarea por ID
 *     tags: [Tareas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Tarea encontrada
 *       404:
 *         description: Tarea no encontrada
 */
router.get('/tareas/:id', controladorTareas.listarTareasPorId);

/**
 * @swagger
 * /api/tareas/tareas/{id}:
 *   put:
 *     summary: Actualizar una tarea
 *     tags: [Tareas]
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
 *             $ref: '#/components/schemas/TareaEntrada'
 *     responses:
 *       200:
 *         description: Tarea actualizada
 *       404:
 *         description: Tarea no encontrada
 */
router.put('/tareas/:id', [
    body('fechaEntrega').notEmpty().withMessage('El campo fechaEntrega es obligatorio')
        .isISO8601().withMessage('El campo fechaEntrega debe ser una fecha válida'),
    body('prioridad').notEmpty().withMessage('El campo prioridad es obligatorio'),
    body('descripcion').notEmpty().withMessage('El campo descripcion es obligatorio')
        .isString().withMessage('El campo descripcion debe ser texto'),
], controladorTareas.actualizarTarea);

/**
 * @swagger
 * /api/tareas/tareas/{id}:
 *   delete:
 *     summary: Eliminar una tarea
 *     tags: [Tareas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Tarea eliminada
 *       404:
 *         description: Tarea no encontrada
 */
router.delete('/tareas/:id', controladorTareas.eliminarTarea);

/**
 * @swagger
 * components:
 *   schemas:
 *     TareaEntrada:
 *       type: object
 *       required: [fechaEntrega, prioridad, descripcion]
 *       properties:
 *         fechaEntrega:
 *           type: string
 *           format: date-time
 *         prioridad:
 *           type: string
 *         descripcion:
 *           type: string
 */
module.exports = router;