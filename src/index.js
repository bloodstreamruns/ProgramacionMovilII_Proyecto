const { Router } = require('express');
const { autenticar, autorizar } = require('./configuracion/passport');
const router = Router();

router.use('/autenticacion', require('./rutas/rutasAutenticacion'));
router.use('/usuarios', autenticar, autorizar('administrador'), require('./rutas/rutasUsuarios'));
router.use('/carreras', autenticar, require('./rutas/rutasCarreras'));
router.use('/estudiantes', autenticar, require('./rutas/rutasEstudiantes'));
router.use('/asignaturas', autenticar, require('./rutas/rutasAsignaturas'));
router.use('/periodos', autenticar, require('./rutas/rutasPeriodo'));
router.use('/matriculas', autenticar, require('./rutas/rutasMatricula'));
router.use('/horarios', autenticar, require('./rutas/rutasHorarios'));
router.use('/eventos', autenticar, require('./rutas/rutasEventos'));
router.use('/recordatorios', autenticar, require('./rutas/rutasRecordatorios'));
router.use('/metas', autenticar, require('./rutas/rutasMetas'));
router.use('/tareas', autenticar, require('./rutas/rutasTareas'));
router.use('/apuntes', autenticar, require('./rutas/rutasApunte'));
router.use('/archivos', autenticar, require('./rutas/rutasArchivos'));
router.use('/calificaciones', autenticar, require('./rutas/rutasCalificaciones'));
router.use('/evaluaciones', autenticar, require('./rutas/rutasEvaluaciones'));

module.exports = router;