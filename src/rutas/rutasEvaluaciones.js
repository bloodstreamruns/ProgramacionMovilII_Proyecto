const { Router } = require('express');
const { body, param, query } = require('express-validator');
const controlador = require('../controladores/controladorEvaluaciones');
const Evaluacion = require('../modelos/evaluacion');
const Asignatura = require('../modelos/asignatura');
const Periodo = require('../modelos/periodo');
const router = Router();

const validaciones = [
  body('titulo').trim().notEmpty().withMessage('El título es obligatorio').isLength({ max: 150 }),
  body('tipo').isIn(Evaluacion.TIPOS).withMessage('Tipo de evaluación no válido'),
  body('fecha').isISO8601().withMessage('La fecha debe ser válida'),
  body('hora').optional({ nullable: true }).matches(/^([01]\d|2[0-3]):[0-5]\d$/).withMessage('La hora debe usar formato HH:MM'),
  body('descripcion').optional({ nullable: true }).isString(),
  body('lugar').optional({ nullable: true }).isLength({ max: 120 }),
  body('valor').optional({ nullable: true }).isFloat({ min: 0 }),
  body('estado').optional().isIn(Evaluacion.ESTADOS),
  body('asignaturaId').isInt({ min: 1 }).bail().custom(async id => {
    if (!await Asignatura.findByPk(id)) throw new Error('La asignatura no existe');
  }),
  body('periodoId').isInt({ min: 1 }).bail().custom(async id => {
    if (!await Periodo.findByPk(id)) throw new Error('El período no existe');
  })
];

router.get('/', query('asignaturaId').optional().isInt(), query('periodoId').optional().isInt(),
  query('tipo').optional().isIn(Evaluacion.TIPOS), query('estado').optional().isIn(Evaluacion.ESTADOS), controlador.listar);
router.get('/:id', param('id').isInt(), controlador.obtener);
router.post('/', ...validaciones, controlador.guardar);
router.put('/:id', param('id').isInt(), ...validaciones, controlador.actualizar);
router.delete('/:id', param('id').isInt(), controlador.eliminar);

module.exports = router;
