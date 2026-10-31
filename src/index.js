const { Router } = require('express');
const router = Router();

router.use('/asignaturas', require('./rutasAsignaturas'));
router.use('/eventos', require('./rutasEventos'));
router.use('/recordatorios', require('./rutasRecordatorios'));
router.use('/horarios', require('./rutasHorarios'));
router.use('/periodos', require('./rutasPeriodos'));

module.exports = router;