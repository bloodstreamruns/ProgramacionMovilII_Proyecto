    const {Router} = require('express');
    const controladorHorario = require('../controladores/controladorHorario');
    const { body, query } = require('express-validator');
    const router = Router();

/**
 * @swagger
 * tags:
 *   name: Horarios
 *   description: Administración de los horarios de clase
 */

/**
 * @swagger
 * /api/horarios/horario:
 *   post:
 *     summary: Crear un horario de clase
 *     tags: [Horarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/HorarioEntrada'
 *     responses:
 *       201:
 *         description: Horario creado
 *       400:
 *         description: Datos inválidos
 */
router.post('/horario', [
    body('dias').notEmpty().withMessage('El campo dias es obligatorio'),
    body('horas').notEmpty().withMessage('El campo horas es obligatorio'),
    body('aulas').notEmpty().withMessage('El campo aulas es obligatorio'),
    body('asignatura').notEmpty().withMessage('El campo asignatura es obligatorio'),
], controladorHorario.crearHorario);

/**
 * @swagger
 * /api/horarios/horarios:
 *   get:
 *     summary: Listar horarios de clase
 *     tags: [Horarios]
 *     responses:
 *       200:
 *         description: Lista de horarios
 */
router.get('/horarios', controladorHorario.obtenerHorarios);

/**
 * @swagger
 * /api/horarios/horario/{id}:
 *   get:
 *     summary: Obtener un horario por ID
 *     tags: [Horarios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Horario encontrado
 *       404:
 *         description: Horario no encontrado
 */
router.get('/horario/:id', controladorHorario.listarHorarioPorId);

/**
 * @swagger
 * /api/horarios/horario/{id}:
 *   put:
 *     summary: Actualizar un horario
 *     tags: [Horarios]
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
 *             $ref: '#/components/schemas/HorarioEntrada'
 *     responses:
 *       200:
 *         description: Horario actualizado
 *       404:
 *         description: Horario no encontrado
 */
router.put('/horario/:id', [
    body('dias').notEmpty().withMessage('El campo dias es obligatorio'),
    body('horas').notEmpty().withMessage('El campo horas es obligatorio'),
    body('aulas').notEmpty().withMessage('El campo aulas es obligatorio'),
    body('asignatura').notEmpty().withMessage('El campo asignatura es obligatorio'),
], controladorHorario.actualizarHorario);

/**
 * @swagger
 * /api/horarios/horario/{id}:
 *   delete:
 *     summary: Eliminar un horario
 *     tags: [Horarios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Horario eliminado
 *       404:
 *         description: Horario no encontrado
 */
router.delete('/horario/:id', controladorHorario.eliminarHorario);

/**
 * @swagger
 * components:
 *   schemas:
 *     HorarioEntrada:
 *       type: object
 *       required: [dias, horas, aulas, asignatura]
 *       properties:
 *         dias:
 *           type: string
 *         horas:
 *           type: string
 *         aulas:
 *           type: string
 *         asignatura:
 *           type: string
 */
module.exports = router;