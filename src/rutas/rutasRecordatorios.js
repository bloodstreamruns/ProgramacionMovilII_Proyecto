const { Router } = require('express');
const controladorRecordatorios = require('../controladores/controladorRecordatorios');
const { body, query } = require('express-validator');
const router = Router();

const MAXIMO_MINUTOS = 365 * 24 * 60;

const validarMinutos = body('minutosAntes').notEmpty().withMessage('La anticipación en minutos es obligatoria')
  .isInt({ min: 0, max: MAXIMO_MINUTOS }).withMessage(`La anticipación debe ser un entero entre 0 y ${MAXIMO_MINUTOS} minutos`);

const validarId = query('id').notEmpty().withMessage('El ID del recordatorio es obligatorio')
  .isInt().withMessage('El ID del recordatorio debe ser un número entero');

/**
 * @swagger
 * /api/recordatorios:
 *   get:
 *     summary: Obtener recordatorios con filtros opcionales
 *     tags: [Recordatorios]
 *     parameters:
 *       - in: query
 *         name: eventoId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: estudianteId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: pendientes
 *         schema:
 *           type: boolean
 *         description: Si es true, devuelve los vencidos aún no notificados de eventos pendientes
 *     responses:
 *       200:
 *         description: Lista de recordatorios obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Recordatorio'
 */
router.get('/',
  query('eventoId').optional().isInt().withMessage('El ID del evento debe ser un número entero'),
  query('estudianteId').optional().isInt().withMessage('El ID del estudiante debe ser un número entero'),
  query('pendientes').optional().isBoolean().withMessage('El parámetro pendientes debe ser un valor booleano'),
  controladorRecordatorios.listarRecordatorios
);

/**
 * @swagger
 * /api/recordatorios/buscarid:
 *   get:
 *     summary: Obtener un recordatorio por su ID
 *     tags: [Recordatorios]
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: Recordatorio encontrado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Recordatorio'
 *       404:
 *         description: Recordatorio no encontrado
 */
router.get('/buscarid', validarId, controladorRecordatorios.obtenerRecordatorioPorId);

/**
 * @swagger
 * /api/recordatorios/guardar:
 *   post:
 *     summary: Crear un recordatorio para un evento
 *     tags: [Recordatorios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - eventoId
 *               - minutosAntes
 *             properties:
 *               eventoId:
 *                 type: integer
 *               minutosAntes:
 *                 type: integer
 *                 description: Minutos de anticipación respecto a la fecha de inicio (1440 equivale a un día)
 *     responses:
 *       201:
 *         description: Recordatorio creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Recordatorio'
 *       400:
 *         description: Validación fallida o fecha de aviso ya vencida
 *       404:
 *         description: Evento no encontrado
 *       409:
 *         description: El evento ya tiene un recordatorio con esa anticipación
 */
router.post('/guardar',
  body('eventoId').notEmpty().withMessage('El ID del evento es obligatorio')
    .isInt().withMessage('El ID del evento debe ser un número entero'),
  validarMinutos,
  controladorRecordatorios.crearRecordatorio
);

/**
 * @swagger
 * /api/recordatorios/actualizar:
 *   put:
 *     summary: Cambiar la anticipación de un recordatorio (reinicia su estado de notificación)
 *     tags: [Recordatorios]
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
 *               - minutosAntes
 *             properties:
 *               minutosAntes:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Recordatorio actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Recordatorio'
 *       404:
 *         description: Recordatorio no encontrado
 *       409:
 *         description: El evento ya tiene un recordatorio con esa anticipación
 */
router.put('/actualizar', validarId, validarMinutos, controladorRecordatorios.actualizarRecordatorio);

/**
 * @swagger
 * /api/recordatorios/notificar:
 *   put:
 *     summary: Marcar un recordatorio como notificado
 *     tags: [Recordatorios]
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: Recordatorio marcado como notificado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Recordatorio'
 *       404:
 *         description: Recordatorio no encontrado
 */
router.put('/notificar', validarId, controladorRecordatorios.marcarNotificado);

/**
 * @swagger
 * /api/recordatorios/eliminar:
 *   delete:
 *     summary: Eliminar un recordatorio
 *     tags: [Recordatorios]
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: Recordatorio eliminado exitosamente
 *       404:
 *         description: Recordatorio no encontrado
 */
router.delete('/eliminar', validarId, controladorRecordatorios.eliminarRecordatorio);

/**
 * @swagger
 * components:
 *   schemas:
 *     Recordatorio:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         eventoId:
 *           type: integer
 *         minutosAntes:
 *           type: integer
 *         fechaAviso:
 *           type: string
 *           format: date-time
 *           description: Calculada como fechaInicio menos minutosAntes
 *         notificado:
 *           type: boolean
 */
module.exports = router;