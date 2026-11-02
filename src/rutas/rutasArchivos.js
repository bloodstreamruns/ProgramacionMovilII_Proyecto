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
router.get('/',
  query('asignaturaId').optional().isInt({ min: 1 })
    .withMessage('El ID de la asignatura debe ser un entero válido'),
  controladorArchivos.listarArchivos
);

// Consultar archivo por ID
router.get('/buscarid',
  query('id').notEmpty().withMessage('El ID del archivo es obligatorio')
    .isInt({ min: 1 }).withMessage('El ID debe ser un entero válido'),
  controladorArchivos.obtenerArchivoPorId
);

// Descargar archivo
router.get('/descargar',
  query('id').notEmpty().withMessage('El ID del archivo es obligatorio')
    .isInt({ min: 1 }).withMessage('El ID debe ser un entero válido'),
  controladorArchivos.descargarArchivo
);

// Subir archivo
router.post('/guardar',
  subirArchivo.single('archivo'),
  ...validacionesCuerpo,
  controladorArchivos.crearArchivo
);

// Reemplazar archivo o actualizar sus datos
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
router.delete('/eliminar',
  query('id').notEmpty().withMessage('El ID del archivo es obligatorio')
    .isInt({ min: 1 }).withMessage('El ID debe ser un entero válido'),
  controladorArchivos.eliminarArchivo
);

module.exports = router;
