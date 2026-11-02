const { Router } = require('express');
const { body, param, query } = require('express-validator');
const controlador = require('../controladores/controladorCalificaciones');
const Asignatura = require('../modelos/asignatura');
const Periodo = require('../modelos/periodo');
const router = Router();

const validaciones = [
  body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio').isLength({ max: 120 }),
  body('tipo').isIn(['Tarea', 'Examen', 'Prueba', 'Proyecto', 'Practica', 'Exposicion', 'Participacion', 'Otro']),
  body('nota').isFloat({ min: 0 }).withMessage('La nota debe ser un número igual o mayor a cero'),
  body('notaMaxima').optional().isFloat({ min: 0.01 }),
  body('fecha').optional({ nullable: true }).isISO8601(),
  body('observacion').optional({ nullable: true }).isString(),
  body('asignaturaId').isInt({ min: 1 }).bail().custom(async id => {
    if (!await Asignatura.findByPk(id)) throw new Error('La asignatura no existe');
  }),
  body('periodoId').isInt({ min: 1 }).bail().custom(async id => {
    if (!await Periodo.findByPk(id)) throw new Error('El período no existe');
  })
];

router.get('/', query('asignaturaId').optional().isInt(), query('periodoId').optional().isInt(), controlador.listar);
router.get('/:id', param('id').isInt(), controlador.obtener);
router.post('/', ...validaciones, controlador.guardar);
router.put('/:id', param('id').isInt(), ...validaciones, controlador.actualizar);
router.delete('/:id', param('id').isInt(), controlador.eliminar);

module.exports = router;
