const { Router } = require('express');
const controladorEventos = require('../controladores/controladorEventos');
const Evento = require('../modelos/evento');
const Estudiante = require('../modelos/estudiante');
const Asignatura = require('../modelos/asignatura');
const { body, query } = require('express-validator');
const router = Router();

const validacionesBase = [
  body('titulo').notEmpty().withMessage('El título del evento es obligatorio')
    .isLength({ min: 3, max: 150 }).withMessage('El título del evento debe tener entre 3 y 150 caracteres'),
  body('descripcion').optional({ nullable: true }).isString().withMessage('La descripción debe ser una cadena de texto'),
  body('tipo').notEmpty().withMessage('El tipo de evento es obligatorio')
    .isIn(Evento.TIPOS).withMessage(`El tipo de evento debe ser uno de: ${Evento.TIPOS.join(', ')}`),
  body('fechaInicio').notEmpty().withMessage('La fecha de inicio es obligatoria')
    .isISO8601().withMessage('La fecha de inicio debe tener formato ISO 8601'),
  body('fechaFin').optional({ nullable: true })
    .isISO8601().withMessage('La fecha de fin debe tener formato ISO 8601')
    .custom((value, { req }) => {
      if (new Date(value) < new Date(req.body.fechaInicio)) {
        throw new Error('La fecha de fin no puede ser anterior a la fecha de inicio');
      }
      return true;
    }),
  body('lugar').optional({ nullable: true })
    .isLength({ max: 150 }).withMessage('El lugar debe tener un máximo de 150 caracteres'),
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
 * /api/eventos:
 *   get:
 *     summary: Obtener eventos con filtros opcionales
 *     tags: [Eventos]
 *     parameters:
 *       - in: query
 *         name: estudianteId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *           enum: [Aviso personal, Reunión académica, Tutoría, Fecha importante]
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [Pendiente, Completado, Cancelado]
 *       - in: query
 *         name: desde
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Fecha de inicio mínima
 *       - in: query
 *         name: hasta
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Fecha de inicio máxima
 *     responses:
 *       200:
 *         description: Lista de eventos obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Evento'
 */
router.get('/',
  query('estudianteId').optional().isInt().withMessage('El ID del estudiante debe ser un número entero'),
  query('tipo').optional().isIn(Evento.TIPOS).withMessage('El tipo de evento no es válido'),
  query('estado').optional().isIn(Evento.ESTADOS).withMessage('El estado del evento no es válido'),
  query('desde').optional().isISO8601().withMessage('El parámetro desde debe tener formato ISO 8601'),
  query('hasta').optional().isISO8601().withMessage('El parámetro hasta debe tener formato ISO 8601'),
  controladorEventos.listarEventos
);

/**
 * @swagger
 * /api/eventos/buscarid:
 *   get:
 *     summary: Obtener un evento por su ID
 *     tags: [Eventos]
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: Evento encontrado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Evento'
 *       404:
 *         description: Evento no encontrado
 */
router.get('/buscarid',
  query('id').notEmpty().withMessage('El ID del evento es obligatorio')
    .isInt().withMessage('El ID del evento debe ser un número entero'),
  controladorEventos.obtenerEventoPorId
);

/**
 * @swagger
 * /api/eventos/guardar:
 *   post:
 *     summary: Crear un nuevo evento
 *     tags: [Eventos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EventoEntrada'
 *     responses:
 *       201:
 *         description: Evento creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Evento'
 *       400:
 *         description: Error en la solicitud (validación fallida)
 */
router.post('/guardar',
  ...validacionesBase,
  body('estado').optional().isIn(Evento.ESTADOS).withMessage(`El estado debe ser uno de: ${Evento.ESTADOS.join(', ')}`),
  body('estudianteId').notEmpty().withMessage('El ID del estudiante es obligatorio')
    .isInt().withMessage('El ID del estudiante debe ser un número entero')
    .custom(async (value) => {
      const estudiante = await Estudiante.findByPk(value);
      if (!estudiante) {
        throw new Error('El estudiante con el ID proporcionado no existe');
      }
      return true;
    }),
  controladorEventos.crearEvento
);

/**
 * @swagger
 * /api/eventos/actualizar:
 *   put:
 *     summary: Actualizar un evento (recalcula los recordatorios si cambia la fecha de inicio)
 *     tags: [Eventos]
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
 *             $ref: '#/components/schemas/EventoEntrada'
 *     responses:
 *       200:
 *         description: Evento actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Evento'
 *       400:
 *         description: Error en la solicitud (validación fallida)
 *       404:
 *         description: Evento no encontrado
 */
router.put('/actualizar',
  query('id').notEmpty().withMessage('El ID del evento es obligatorio')
    .isInt().withMessage('El ID del evento debe ser un número entero'),
  ...validacionesBase,
  body('estado').notEmpty().withMessage('El estado del evento es obligatorio')
    .isIn(Evento.ESTADOS).withMessage(`El estado debe ser uno de: ${Evento.ESTADOS.join(', ')}`),
  controladorEventos.actualizarEvento
);

/**
 * @swagger
 * /api/eventos/eliminar:
 *   delete:
 *     summary: Eliminar un evento junto con sus recordatorios
 *     tags: [Eventos]
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: Evento eliminado exitosamente
 *       404:
 *         description: Evento no encontrado
 */
router.delete('/eliminar',
  query('id').notEmpty().withMessage('El ID del evento es obligatorio')
    .isInt().withMessage('El ID del evento debe ser un número entero'),
  controladorEventos.eliminarEvento
);

/**
 * @swagger
 * components:
 *   schemas:
 *     EventoEntrada:
 *       type: object
 *       required:
 *         - titulo
 *         - tipo
 *         - fechaInicio
 *         - estudianteId
 *       properties:
 *         titulo:
 *           type: string
 *         descripcion:
 *           type: string
 *         tipo:
 *           type: string
 *           enum: [Aviso personal, Reunión académica, Tutoría, Fecha importante]
 *         fechaInicio:
 *           type: string
 *           format: date-time
 *           description: Inicio del evento; en fechas importantes actúa como fecha límite
 *         fechaFin:
 *           type: string
 *           format: date-time
 *         lugar:
 *           type: string
 *         estado:
 *           type: string
 *           enum: [Pendiente, Completado, Cancelado]
 *         estudianteId:
 *           type: integer
 *           description: Solo se envía al crear; no es modificable
 *         asignaturaId:
 *           type: integer
 *           description: Asignatura asociada (opcional)
 *     Evento:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         titulo:
 *           type: string
 *         descripcion:
 *           type: string
 *         tipo:
 *           type: string
 *         fechaInicio:
 *           type: string
 *           format: date-time
 *         fechaFin:
 *           type: string
 *           format: date-time
 *         lugar:
 *           type: string
 *         estado:
 *           type: string
 *         estudianteId:
 *           type: integer
 *         asignaturaId:
 *           type: integer
 *         recordatorios:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Recordatorio'
 */
module.exports = router;