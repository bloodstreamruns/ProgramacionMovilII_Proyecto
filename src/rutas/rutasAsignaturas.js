const { Router } = require('express');
const controladorAsignaturas = require('../controladores/controladorAsignaturas');
const Asignatura = require('../modelos/asignatura');
const Carrera = require('../modelos/carreras');
const { body, query } = require('express-validator');
const { Op } = require('sequelize');
const router = Router();

const validarCarreraExistente = async (value) => {
  const carrera = await Carrera.findByPk(value);
  if (!carrera) {
    throw new Error('La carrera con el ID proporcionado no existe');
  }
  return true;
};

const validacionesCuerpo = [
  body('nombre').notEmpty().withMessage('El nombre de la asignatura es obligatorio')
    .isLength({ min: 3, max: 100 }).withMessage('El nombre de la asignatura debe tener entre 3 y 100 caracteres'),
  body('unidadesValorativas').notEmpty().withMessage('Las unidades valorativas son obligatorias')
    .isInt({ min: 1, max: 10 }).withMessage('Las unidades valorativas deben ser un entero entre 1 y 10'),
  body('descripcion').optional({ nullable: true }).isString().withMessage('La descripción debe ser una cadena de texto'),
  body('estado').optional().isBoolean().withMessage('El estado de la asignatura debe ser un valor booleano'),
  body('carreraId').notEmpty().withMessage('El ID de la carrera es obligatorio')
    .isInt().withMessage('El ID de la carrera debe ser un número entero')
    .custom(validarCarreraExistente),
];

/**
 * @swagger
 * /api/asignaturas:
 *   get:
 *     summary: Obtener las asignaturas, opcionalmente filtradas por carrera
 *     tags: [Asignaturas]
 *     parameters:
 *       - in: query
 *         name: carreraId
 *         schema:
 *           type: integer
 *         required: false
 *         description: ID de la carrera cuyo pensum se desea consultar
 *     responses:
 *       200:
 *         description: Lista de asignaturas obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Asignatura'
 *       401:
 *         description: Debe iniciar sesión y enviar un token JWT válido
 */
router.get('/',
  query('carreraId').optional().isInt().withMessage('El ID de la carrera debe ser un número entero'),
  controladorAsignaturas.listarAsignaturas
);

/**
 * @swagger
 * /api/asignaturas/buscarid:
 *   get:
 *     summary: Obtener una asignatura por su ID
 *     tags: [Asignaturas]
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la asignatura a buscar
 *     responses:
 *       200:
 *         description: Asignatura encontrada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Asignatura'
 *       404:
 *         description: Asignatura no encontrada
 *       401:
 *         description: Debe iniciar sesión y enviar un token JWT válido
 */
router.get('/buscarid',
  query('id').notEmpty().withMessage('El ID de la asignatura es obligatorio')
    .isInt().withMessage('El ID de la asignatura debe ser un número entero'),
  controladorAsignaturas.obtenerAsignaturaPorId
);

/**
 * @swagger
 * /api/asignaturas/guardar:
 *   post:
 *     summary: Crear una nueva asignatura
 *     tags: [Asignaturas]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AsignaturaEntrada'
 *     responses:
 *       201:
 *         description: Asignatura creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Asignatura'
 *       400:
 *         description: Error en la solicitud (validación fallida)
 *       401:
 *         description: Debe iniciar sesión y enviar un token JWT válido
 */
router.post('/guardar',
  body('codigo').notEmpty().withMessage('El código de la asignatura es obligatorio')
    .isLength({ min: 1, max: 15 }).withMessage('El código de la asignatura debe tener entre 1 y 15 caracteres')
    .custom(async (value) => {
      const existente = await Asignatura.findOne({ where: { codigo: value } });
      if (existente) {
        throw new Error('El código de la asignatura ya está en uso');
      }
      return true;
    }),
  ...validacionesCuerpo,
  controladorAsignaturas.crearAsignatura
);

/**
 * @swagger
 * /api/asignaturas/actualizar:
 *   put:
 *     summary: Actualizar una asignatura existente
 *     tags: [Asignaturas]
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la asignatura a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AsignaturaEntrada'
 *     responses:
 *       200:
 *         description: Asignatura actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Asignatura'
 *       400:
 *         description: Error en la solicitud (validación fallida)
 *       404:
 *         description: Asignatura no encontrada
 *       401:
 *         description: Debe iniciar sesión y enviar un token JWT válido
 */
router.put('/actualizar',
  query('id').notEmpty().withMessage('El ID de la asignatura es obligatorio')
    .isInt().withMessage('El ID de la asignatura debe ser un número entero'),
  body('codigo').notEmpty().withMessage('El código de la asignatura es obligatorio')
    .isLength({ min: 1, max: 15 }).withMessage('El código de la asignatura debe tener entre 1 y 15 caracteres')
    .custom(async (value, { req }) => {
      const existente = await Asignatura.findOne({
        where: { codigo: value, id: { [Op.ne]: Number(req.query.id) } },
      });
      if (existente) {
        throw new Error('El código de la asignatura ya está en uso');
      }
      return true;
    }),
  ...validacionesCuerpo,
  body('estado').notEmpty().withMessage('El estado de la asignatura es obligatorio')
    .isBoolean().withMessage('El estado de la asignatura debe ser un valor booleano'),
  controladorAsignaturas.actualizarAsignatura
);

/**
 * @swagger
 * /api/asignaturas/eliminar:
 *   delete:
 *     summary: Eliminar una asignatura existente
 *     tags: [Asignaturas]
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la asignatura a eliminar
 *     responses:
 *       200:
 *         description: Asignatura eliminada exitosamente
 *       404:
 *         description: Asignatura no encontrada
 *       401:
 *         description: Debe iniciar sesión y enviar un token JWT válido
 */
router.delete('/eliminar',
  query('id').notEmpty().withMessage('El ID de la asignatura es obligatorio')
    .isInt().withMessage('El ID de la asignatura debe ser un número entero'),
  controladorAsignaturas.eliminarAsignatura
);

/**
 * @swagger
 * components:
 *   schemas:
 *     AsignaturaEntrada:
 *       type: object
 *       required:
 *         - codigo
 *         - nombre
 *         - unidadesValorativas
 *         - carreraId
 *       properties:
 *         codigo:
 *           type: string
 *           description: Código único de la asignatura
 *         nombre:
 *           type: string
 *           description: Nombre de la asignatura
 *         unidadesValorativas:
 *           type: integer
 *           description: Unidades valorativas de la asignatura
 *         descripcion:
 *           type: string
 *           description: Descripción de la asignatura (opcional)
 *         estado:
 *           type: boolean
 *           description: Estado de la asignatura (activa/inactiva)
 *         carreraId:
 *           type: integer
 *           description: ID de la carrera a la que pertenece
 *     Asignatura:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         codigo:
 *           type: string
 *         nombre:
 *           type: string
 *         unidadesValorativas:
 *           type: integer
 *         descripcion:
 *           type: string
 *         estado:
 *           type: boolean
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