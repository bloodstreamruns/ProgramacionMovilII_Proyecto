const { Router } = require('express');
const router = Router();

router.use('/carreras', require('./rutas/rutasCarreras'));
router.use('/estudiantes', require('./rutas/rutasEstudiantes'));
router.use('/asignaturas', require('./rutas/rutasAsignaturas'));
router.use('/eventos', require('./rutas/rutasEventos'));
router.use('/recordatorios', require('./rutas/rutasRecordatorios'));

module.exports = router;