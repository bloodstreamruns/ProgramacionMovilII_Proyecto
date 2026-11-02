const { Router } = require('express');
const controladorMatriculas = require('../controladores/controladorMatriculas');
const Matricula = require('../modelos/matricula');
const { body, query } = require('express-validator');
const router = Router();

// Validar que la matrícula exista
const validarMatriculaExistente = async (value) => {
  const matricula = await Matricula.findByPk(value);

  if (!matricula) {
    throw new Error('La matrícula con el ID proporcionado no existe');
  }

  return true;
};

// Validaciones del cuerpo de la solicitud
const validacionesCuerpo = [
  body('estudiante_id')
    .notEmpty().withMessage('El ID del estudiante es obligatorio')
    .isInt({ min: 1 }).withMessage('El ID del estudiante debe ser un número entero válido'),

  body('asignatura_id')
    .notEmpty().withMessage('El ID de la asignatura es obligatorio')
    .isInt({ min: 1 }).withMessage('El ID de la asignatura debe ser un número entero válido'),

  body('periodo')
    .notEmpty().withMessage('El periodo es obligatorio')
    .isLength({ min: 1, max: 30 })
    .withMessage('El periodo debe tener entre 1 y 30 caracteres'),

  body('estado')
    .optional()
    .isIn(['pendiente', 'en curso', 'aprobada', 'reprobada'])
    .withMessage('El estado debe ser pendiente, en curso, aprobada o reprobada'),
];

/**
 * @swagger
 * /api/matriculas:
 *   get:
 *     summary: Obtener todas las matrículas
 *     tags: [Matrículas]
 *     responses:
 *       200:
 *         description: Lista de matrículas obtenida exitosamente
 */
router.get('/',
  controladorMatriculas.obtenerMatriculas
);

/**
 * @swagger
 * /api/matriculas/buscarid:
 *   get:
 *     summary: Obtener una matrícula por su ID
 *     tags: [Matrículas]
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la matrícula
 *     responses:
 *       200:
 *         description: Matrícula encontrada exitosamente
 *       404:
 *         description: Matrícula no encontrada
 */
router.get('/buscarid',
  query('id')
    .notEmpty().withMessage('El ID de la matrícula es obligatorio')
    .isInt({ min: 1 }).withMessage('El ID debe ser un número entero válido'),
  controladorMatriculas.obtenerMatriculaPorId
);

/**
 * @swagger
 * /api/matriculas/guardar:
 *   post:
 *     summary: Registrar una nueva matrícula
 *     tags: [Matrículas]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MatriculaEntrada'
 *     responses:
 *       201:
 *         description: Matrícula creada exitosamente
 *       400:
 *         description: Error en la validación
 */
router.post('/guardar',
  ...validacionesCuerpo,
  controladorMatriculas.crearMatricula
);

/**
 * @swagger
 * /api/matriculas/actualizar:
 *   put:
 *     summary: Actualizar una matrícula existente
 *     tags: [Matrículas]
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la matrícula a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MatriculaEntrada'
 *     responses:
 *       200:
 *         description: Matrícula actualizada exitosamente
 *       404:
 *         description: Matrícula no encontrada
 */
router.put('/actualizar',
  query('id')
    .notEmpty().withMessage('El ID de la matrícula es obligatorio')
    .isInt({ min: 1 }).withMessage('El ID debe ser un número entero válido'),
  ...validacionesCuerpo,
  controladorMatriculas.actualizarMatricula
);

/**
 * @swagger
 * /api/matriculas/eliminar:
 *   delete:
 *     summary: Eliminar una matrícula existente
 *     tags: [Matrículas]
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la matrícula a eliminar
 *     responses:
 *       200:
 *         description: Matrícula eliminada exitosamente
 *       404:
 *         description: Matrícula no encontrada
 */
router.delete('/eliminar',
  query('id')
    .notEmpty().withMessage('El ID de la matrícula es obligatorio')
    .isInt({ min: 1 }).withMessage('El ID debe ser un número entero válido'),
  controladorMatriculas.eliminarMatricula
);

/**
 * @swagger
 * components:
 *   schemas:
 *     MatriculaEntrada:
 *       type: object
 *       required:
 *         - estudiante_id
 *         - asignatura_id
 *         - periodo
 *       properties:
 *         estudiante_id:
 *           type: integer
 *           description: ID del estudiante
 *         asignatura_id:
 *           type: integer
 *           description: ID de la asignatura
 *         periodo:
 *           type: string
 *           description: Periodo académico
 *         estado:
 *           type: string
 *           enum:
 *             - pendiente
 *             - en curso
 *             - aprobada
 *             - reprobada
 *           description: Estado de la matrícula
 *
 *     Matricula:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         estudiante_id:
 *           type: integer
 *         asignatura_id:
 *           type: integer
 *         periodo:
 *           type: string
 *         estado:
 *           type: string
 */
module.exports = router;
