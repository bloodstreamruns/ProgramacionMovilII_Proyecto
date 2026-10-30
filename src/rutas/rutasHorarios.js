    const {Router} = require('express');
    const controladorHorario = require('../controladores/controladorHorario');
    const { body, query } = require('express-validator');
    const router = Router();

router.post('/horario', [
    body('dias').notEmpty().withMessage('El campo dias es obligatorio'),
    body('horas').notEmpty().withMessage('El campo horas es obligatorio'),
    body('aulas').notEmpty().withMessage('El campo aulas es obligatorio'),
    body('asignatura').notEmpty().withMessage('El campo asignatura es obligatorio'),
], controladorHorario.crearHorario);

router.get('/horarios', controladorHorario.obtenerHorarios);

router.get('/horario/:id', controladorHorario.listarHorarioPorId);

router.put('/horario/:id', [
    body('dias').notEmpty().withMessage('El campo dias es obligatorio'),
    body('horas').notEmpty().withMessage('El campo horas es obligatorio'),
    body('aulas').notEmpty().withMessage('El campo aulas es obligatorio'),
    body('asignatura').notEmpty().withMessage('El campo asignatura es obligatorio'),
], controladorHorario.actualizarHorario);

router.delete('/horario/:id', controladorHorario.eliminarHorario);

module.exports = router;