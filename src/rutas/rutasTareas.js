 const {Router} = require('express');
    const controladorHorario = require('../controladores/controladorTareas');
    const { body, query } = require('express-validator');
    const router = Router();

router.post('/tareas', [
    body('fechaEntrega').notEmpty().withMessage('El campo fechaEntrega es obligatorio'),
    body('prioridad').notEmpty().withMessage('El campo prioridad es obligatorio'),
    body('descripcion').notEmpty().withMessage('El campo descripcion es obligatorio'),
    body('estado').notEmpty().withMessage('El campo estado es obligatorio'),
], controladorHorario.crearTarea);

router.get('/tareas', controladorHorario.obtenerTareas);

router.get('/tareas/:id', controladorHorario.listarTareasPorId);

router.put('/tareas/:id', [
    body('fechaEntrega').notEmpty().withMessage('El campo fechaEntrega es obligatorio'),
    body('prioridad').notEmpty().withMessage('El campo prioridad es obligatorio'),
    body('descripcion').notEmpty().withMessage('El campo descripcion es obligatorio'),
    body('estado').notEmpty().withMessage('El campo estado es obligatorio'),
], controladorHorario.actualizarTarea);

router.delete('/tareas/:id', controladorHorario.eliminarTarea);

module.exports = router;