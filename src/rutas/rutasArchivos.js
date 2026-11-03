const { Router } = require('express');
const controladorArchivos = require('../controladores/controladorArchivos');
const Asignatura = require('../modelos/asignatura');
const { body, query } = require('express-validator');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const router = Router();

const carpetaArchivos = path.join(
  process.cwd(),
  'uploads',
  'archivos-estudio'
);

fs.mkdirSync(carpetaArchivos, { recursive: true });

const almacenamiento = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, carpetaArchivos);
  },
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname);
    const nombreUnico = `${Date.now()}-${Math.round(Math.random() * 1E9)}${extension}`;

    cb(null, nombreUnico);
  },
});

const subirArchivo = multer({
  storage: almacenamiento,
  limits: {
    fileSize: 15 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const extensionesPermitidas = [
      '.pdf',
      '.ppt',
      '.pptx',
      '.doc',
      '.docx',
    ];

    const extension = path.extname(file.originalname).toLowerCase();

    if (!extensionesPermitidas.includes(extension)) {
      return cb(new Error('Solo se permiten archivos PDF, PowerPoint y Word'));
    }

    cb(null, true);
  },
});

/**
 * @swagger
 * tags:
 *   name: Archivos
 *   description: Organización y descarga de materiales de estudio
 */

// Validar asignatura existente
const validarAsignatura = async (value) => {
  const asignatura = await Asignatura.findByPk(value);

  if (!asignatura) {
    throw new Error('La asignatura indicada no existe');
  }

  return true;
};

const validacionesCuerpo = [
  body('nombre')
    .notEmpty().withMessage('El nombre del archivo es obligatorio')
    .isLength({ min: 1, max: 150 })
    .withMessage('El nombre debe tener entre 1 y 150 caracteres'),

  body('tipoDocumento')
    .notEmpty().withMessage('El tipo de documento es obligatorio')
    .isIn(['PDF', 'Presentación', 'Guía', 'Word', 'Otro'])
    .withMessage('El tipo de documento no es válido'),

  body('asignaturaId')
    .notEmpty().withMessage('El ID de la asignatura es obligatorio')
    .isInt({ min: 1 }).withMessage('El ID debe ser un entero válido')
    .bail()
    .custom(validarAsignatura),
];

// Listar archivos
/**
 * @swagger
 * /api/archivos:
 *   get:
 *     summary: Listar archivos, opcionalmente filtrados por asignatura
 *     tags: [Archivos]
 *     parameters:
 *       - in: query
 *         name: asignaturaId
 *         schema:
 *           type: integer
 *         required: false
 *     responses:
 *       200:
 *         description: Lista de archivos
 */
router.get('/',
  query('asignaturaId').optional().isInt({ min: 1 })
    .withMessage('El ID de la asignatura debe ser un entero válido'),
  controladorArchivos.listarArchivos
);

// Consultar archivo por ID
/**
 * @swagger
 * /api/archivos/buscarid:
 *   get:
 *     summary: Obtener los datos de un archivo por ID
 *     tags: [Archivos]
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Archivo encontrado
 *       404:
 *         description: Archivo no encontrado
 */
router.get('/buscarid',
  query('id').notEmpty().withMessage('El ID del archivo es obligatorio')
    .isInt({ min: 1 }).withMessage('El ID debe ser un entero válido'),
  controladorArchivos.obtenerArchivoPorId
);

// Descargar archivo
/**
 * @swagger
 * /api/archivos/descargar:
 *   get:
 *     summary: Descargar un archivo de estudio
 *     tags: [Archivos]
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Archivo descargado
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Archivo o documento no encontrado
 */
router.get('/descargar',
  query('id').notEmpty().withMessage('El ID del archivo es obligatorio')
    .isInt({ min: 1 }).withMessage('El ID debe ser un entero válido'),
  controladorArchivos.descargarArchivo
);

// Subir archivo
/**
 * @swagger
 * /api/archivos/guardar:
 *   post:
 *     summary: Subir un archivo de estudio
 *     tags: [Archivos]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/ArchivoEntrada'
 *     responses:
 *       201:
 *         description: Archivo subido correctamente
 *       400:
 *         description: Datos inválidos o archivo no seleccionado
 *       404:
 *         description: Asignatura no encontrada
 */
router.post('/guardar',
  subirArchivo.single('archivo'),
  ...validacionesCuerpo,
  controladorArchivos.crearArchivo
);

// Reemplazar archivo o actualizar sus datos
/**
 * @swagger
 * /api/archivos/actualizar:
 *   put:
 *     summary: Actualizar datos o reemplazar un archivo
 *     tags: [Archivos]
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/ArchivoActualizacion'
 *     responses:
 *       200:
 *         description: Archivo actualizado
 *       404:
 *         description: Archivo o asignatura no encontrada
 */
router.put('/actualizar',
  subirArchivo.single('archivo'),
  query('id').notEmpty().withMessage('El ID del archivo es obligatorio')
    .isInt({ min: 1 }).withMessage('El ID debe ser un entero válido'),
  body('nombre').optional().notEmpty()
    .isLength({ min: 1, max: 150 }),
  body('tipoDocumento').optional()
    .isIn(['PDF', 'Presentación', 'Guía', 'Word', 'Otro']),
  body('asignaturaId').optional()
    .isInt({ min: 1 }).bail().custom(validarAsignatura),
  controladorArchivos.actualizarArchivo
);

// Eliminar archivo
/**
 * @swagger
 * /api/archivos/eliminar:
 *   delete:
 *     summary: Eliminar un archivo y su documento almacenado
 *     tags: [Archivos]
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Archivo eliminado
 *       404:
 *         description: Archivo no encontrado
 */
router.delete('/eliminar',
  query('id').notEmpty().withMessage('El ID del archivo es obligatorio')
    .isInt({ min: 1 }).withMessage('El ID debe ser un entero válido'),
  controladorArchivos.eliminarArchivo
);

/**
 * @swagger
 * components:
 *   schemas:
 *     ArchivoEntrada:
 *       type: object
 *       required: [archivo, nombre, tipoDocumento, asignaturaId]
 *       properties:
 *         archivo:
 *           type: string
 *           format: binary
 *         nombre:
 *           type: string
 *         tipoDocumento:
 *           type: string
 *           enum: [PDF, Presentación, Guía, Word, Otro]
 *         asignaturaId:
 *           type: integer
 *     ArchivoActualizacion:
 *       type: object
 *       properties:
 *         archivo:
 *           type: string
 *           format: binary
 *         nombre:
 *           type: string
 *         tipoDocumento:
 *           type: string
 *           enum: [PDF, Presentación, Guía, Word, Otro]
 *         asignaturaId:
 *           type: integer
 */
module.exports = router;
