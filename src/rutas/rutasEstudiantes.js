const { Router } = require('express');
const { body, query } = require('express-validator');
const { Op } = require('sequelize');
const controladorEstudiantes = require('../controladores/controladorEstudiantes');
const Estudiante = require('../modelos/estudiante');
const Carrera = require('../modelos/carreras');
const router = Router();

const campoUnico = (campo, mensaje) => async (value, { req }) => {
  const where = { [campo]: value };
  if (req.query.id) where.id = { [Op.ne]: Number(req.query.id) };
  const existente = await Estudiante.findOne({ where });
  if (existente) {
    throw new Error(mensaje);
  }
  return true;
};

const validarCarreraExistente = async (value) => {
  const carrera = await Carrera.findByPk(value);
  if (!carrera) {
    throw new Error('La carrera con el ID proporcionado no existe');
  }
  return true;
};

const validarId = query('id').notEmpty().withMessage('El ID del estudiante es obligatorio')
  .isInt().withMessage('El ID del estudiante debe ser un número entero');

const validacionesCuerpo = [
  body('identidad').notEmpty().withMessage('La identidad del estudiante es obligatoria')
    .isLength({ min: 13, max: 13 }).withMessage('La identidad del estudiante debe tener 13 caracteres')
    .isNumeric({ no_symbols: true }).withMessage('La identidad del estudiante debe contener solo dígitos')
    .custom(campoUnico('identidad', 'La identidad del estudiante ya está registrada')),
  body('cuenta').notEmpty().withMessage('La cuenta del estudiante es obligatoria')
    .isLength({ min: 1, max: 20 }).withMessage('La cuenta del estudiante debe tener entre 1 y 20 caracteres')
    .custom(campoUnico('cuenta', 'La cuenta del estudiante ya está registrada')),
  body('primerNombre').notEmpty().withMessage('El primer nombre del estudiante es obligatorio')
    .isLength({ min: 2, max: 50 }).withMessage('El primer nombre debe tener entre 2 y 50 caracteres'),
  body('segundoNombre').optional({ nullable: true })
    .isLength({ min: 2, max: 50 }).withMessage('El segundo nombre debe tener entre 2 y 50 caracteres'),
  body('primerApellido').notEmpty().withMessage('El primer apellido del estudiante es obligatorio')
    .isLength({ min: 2, max: 50 }).withMessage('El primer apellido debe tener entre 2 y 50 caracteres'),
  body('segundoApellido').optional({ nullable: true })
    .isLength({ min: 2, max: 50 }).withMessage('El segundo apellido debe tener entre 2 y 50 caracteres'),
  body('correoElectronico').notEmpty().withMessage('El correo electrónico del estudiante es obligatorio')
    .isEmail().withMessage('El correo electrónico debe ser un correo válido')
    .isLength({ max: 100 }).withMessage('El correo electrónico debe tener un máximo de 100 caracteres')
    .custom(campoUnico('correoElectronico', 'El correo electrónico del estudiante ya está en uso')),
  body('carreraId').notEmpty().withMessage('El ID de la carrera es obligatorio')
    .isInt().withMessage('El ID de la carrera debe ser un número entero')
    .custom(validarCarreraExistente),
];

/**
 * @swagger
 * tags:
 *   name: Estudiantes
 *   description: Rutas para la gestión de estudiantes
 */

/**
 * @swagger
 * /api/estudiantes:
 *   get:
 *     summary: Obtener estudiantes con filtros opcionales
 *     tags: [Estudiantes]
 *     parameters:
 *       - in: query
 *         name: carreraId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: estado
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Lista de estudiantes obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Estudiante'
 */
router.get('/',
  query('carreraId').optional().isInt().withMessage('El ID de la carrera debe ser un número entero'),
  query('estado').optional().isBoolean().withMessage('El estado debe ser un valor booleano'),
  controladorEstudiantes.listarEstudiantes
);

/**
 * @swagger
 * /api/estudiantes/buscarid:
 *   get:
 *     summary: Obtener un estudiante por su ID
 *     tags: [Estudiantes]
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: Estudiante encontrado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Estudiante'
 *       404:
 *         description: Estudiante no encontrado
 */
router.get('/buscarid', validarId, controladorEstudiantes.obtenerEstudiantePorId);

/**
 * @swagger
 * /api/estudiantes/buscaridentidad:
 *   get:
 *     summary: Obtener un estudiante por su identidad
 *     tags: [Estudiantes]
 *     parameters:
 *       - in: query
 *         name: identidad
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Estudiante encontrado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Estudiante'
 *       404:
 *         description: Estudiante no encontrado
 */
router.get('/buscaridentidad',
  query('identidad').notEmpty().withMessage('La identidad del estudiante es obligatoria')
    .isLength({ min: 13, max: 13 }).withMessage('La identidad del estudiante debe tener 13 caracteres'),
  controladorEstudiantes.obtenerEstudiantePorIdentidad
);

/**
 * @swagger
 * /api/estudiantes/guardar:
 *   post:
 *     summary: Crear un nuevo estudiante
 *     tags: [Estudiantes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EstudianteEntrada'
 *     responses:
 *       201:
 *         description: Estudiante creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Estudiante'
 *       400:
 *         description: Error en la solicitud (validación fallida)
 */
router.post('/guardar',
  ...validacionesCuerpo,
  body('estado').optional().isBoolean().withMessage('El estado del estudiante debe ser un valor booleano'),
  controladorEstudiantes.crearEstudiante
);

/**
 * @swagger
 * /api/estudiantes/actualizar:
 *   put:
 *     summary: Actualizar un estudiante existente
 *     tags: [Estudiantes]
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
 *             $ref: '#/components/schemas/EstudianteEntrada'
 *     responses:
 *       200:
 *         description: Estudiante actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Estudiante'
 *       400:
 *         description: Error en la solicitud (validación fallida)
 *       404:
 *         description: Estudiante no encontrado
 */
router.put('/actualizar',
  validarId,
  ...validacionesCuerpo,
  body('estado').notEmpty().withMessage('El estado del estudiante es obligatorio')
    .isBoolean().withMessage('El estado del estudiante debe ser un valor booleano'),
  controladorEstudiantes.actualizarEstudiante
);

/**
 * @swagger
 * /api/estudiantes/eliminar:
 *   delete:
 *     summary: Eliminar un estudiante junto con sus eventos y metas
 *     tags: [Estudiantes]
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: Estudiante eliminado exitosamente
 *       404:
 *         description: Estudiante no encontrado
 */
router.delete('/eliminar', validarId, controladorEstudiantes.eliminarEstudiante);

/**
 * @swagger
 * /api/estudiantes/imagen:
 *   put:
 *     summary: Actualizar la imagen de un estudiante
 *     tags: [Estudiantes]
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - imagen
 *             properties:
 *               imagen:
 *                 type: string
 *                 format: binary
 *                 description: Imagen JPEG, PNG o JPG de hasta 5 MB
 *     responses:
 *       200:
 *         description: Imagen actualizada exitosamente
 *       400:
 *         description: Validación fallida, archivo inválido o ausente
 *       404:
 *         description: Estudiante no encontrado
 */
router.put('/imagen',
  validarId,
  controladorEstudiantes.validarImagenEstudiante,
  controladorEstudiantes.actualizarImagenEstudiante
);

/**
 * @swagger
 * components:
 *   schemas:
 *     EstudianteEntrada:
 *       type: object
 *       required:
 *         - identidad
 *         - cuenta
 *         - primerNombre
 *         - primerApellido
 *         - correoElectronico
 *         - carreraId
 *       properties:
 *         identidad:
 *           type: string
 *           description: Identidad de 13 dígitos
 *         cuenta:
 *           type: string
 *         primerNombre:
 *           type: string
 *         segundoNombre:
 *           type: string
 *         primerApellido:
 *           type: string
 *         segundoApellido:
 *           type: string
 *         correoElectronico:
 *           type: string
 *         estado:
 *           type: boolean
 *           description: Obligatorio al actualizar
 *         carreraId:
 *           type: integer
 *     Estudiante:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         identidad:
 *           type: string
 *         cuenta:
 *           type: string
 *         primerNombre:
 *           type: string
 *         segundoNombre:
 *           type: string
 *         primerApellido:
 *           type: string
 *         segundoApellido:
 *           type: string
 *         correoElectronico:
 *           type: string
 *         estado:
 *           type: boolean
 *         imagen:
 *           type: string
 *         imagenUrl:
 *           type: string
 *         carreraId:
 *           type: integer
 *         carrera:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *             codigo:
 *               type: string
 *             nombre:
 *               type: string
 */
module.exports = router;