
const { Router } = require('express');
const controladorApuntes = require('../controladores/controladorApuntes');
const Asignatura = require('../modelos/asignatura');
const { body, query } = require('express-validator');
//hola/*hola
const router = Router();

// Validar que la asignatura exista
const validarAsignatura = async (value) => {
  const asignatura = await Asignatura.findByPk(value);

  if (!asignatura) {
    throw new Error('La asignatura indicada no existe');
  }

  return true;
};

// Validaciones del cuerpo
const validacionesCuerpo = [
  body('titulo')
    .notEmpty().withMessage('El título del apunte es obligatorio')
    .isLength({ min: 3, max: 150 })
    .withMessage('El título debe tener entre 3 y 150 caracteres'),

  body('contenido')
    .notEmpty().withMessage('El contenido del apunte es obligatorio')
    .isString().withMessage('El contenido debe ser texto'),

  body('fecha')
    .notEmpty().withMessage('La fecha del apunte es obligatoria')
    .isISO8601().withMessage('La fecha debe tener un formato válido (YYYY-MM-DD)'),

  body('asignaturaId')
    .notEmpty().withMessage('El ID de la asignatura es obligatorio')
    .isInt({ min: 1 }).withMessage('El ID debe ser un número entero válido')
    .bail()
    .custom(validarAsignatura),
];

/**
 * @swagger
 * /api/apuntes:
 *   get:
 *     summary: Obtener todos los apuntes, opcionalmente filtrados por asignatura
 *     tags: [Apuntes]
 *     parameters:
 *       - in: query
 *         name: asignaturaId
 *         schema:
 *           type: integer
 *         required: false
 *         description: ID de la asignatura
 *     responses:
 *       200:
 *         description: Lista de apuntes obtenida exitosamente
 */
router.get('/',
  query('asignaturaId').optional().isInt({ min: 1 })
    .withMessage('El ID de la asignatura debe ser un entero válido'),
  controladorApuntes.listarApuntes
);

/**
 * @swagger
 * /api/apuntes/buscarid:
 *   get:
 *     summary: Obtener un apunte por su ID
 *     tags: [Apuntes]
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: Apunte encontrado exitosamente
 *       404:
 *         description: Apunte no encontrado
 */
router.get('/buscarid',
  query('id').notEmpty().withMessage('El ID del apunte es obligatorio')
    .isInt({ min: 1 }).withMessage('El ID debe ser un entero válido'),
  controladorApuntes.obtenerApuntePorId
);

/**
 * @swagger
 * /api/apuntes/guardar:
 *   post:
 *     summary: Crear un nuevo apunte
 *     tags: [Apuntes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ApunteEntrada'
 *     responses:
 *       201:
 *         description: Apunte creado exitosamente
 *       400:
 *         description: Error de validación
 */
router.post('/guardar',
  ...validacionesCuerpo,
  controladorApuntes.crearApunte
);

/**
 * @swagger
 * /api/apuntes/actualizar:
 *   put:
 *     summary: Actualizar un apunte
 *     tags: [Apuntes]
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: Apunte actualizado exitosamente
 *       404:
 *         description: Apunte no encontrado
 */
router.put('/actualizar',
  query('id').notEmpty().withMessage('El ID del apunte es obligatorio')
    .isInt({ min: 1 }).withMessage('El ID debe ser un entero válido'),
  ...validacionesCuerpo,
  controladorApuntes.actualizarApunte
);

/**
 * @swagger
 * /api/apuntes/eliminar:
 *   delete:
 *     summary: Eliminar un apunte
 *     tags: [Apuntes]
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: Apunte eliminado exitosamente
 *       404:
 *         description: Apunte no encontrado
 */
router.delete('/eliminar',
  query('id').notEmpty().withMessage('El ID del apunte es obligatorio')
    .isInt({ min: 1 }).withMessage('El ID debe ser un entero válido'),
  controladorApuntes.eliminarApunte
);

/**
 * @swagger
 * components:
 *   schemas:
 *     ApunteEntrada:
 *       type: object
 *       required:
 *         - titulo
 *         - contenido
 *         - fecha
 *         - asignaturaId
 *       properties:
 *         titulo:
 *           type: string
 *         contenido:
 *           type: string
 *         fecha:
 *           type: string
 *           format: date
 *         asignaturaId:
 *           type: integer
 *     Apunte:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         titulo:
 *           type: string
 *         contenido:
 *           type: string
 *         fecha:
 *           type: string
 *           format: date
 *         asignaturaId:
 *           type: integer
 */
module.exports = router;
