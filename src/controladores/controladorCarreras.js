const { validationResult } = require('express-validator');
const Carrera = require('../modelos/carreras');
const Estudiante = require('../modelos/estudiante');

const CAMPOS_EDITABLES = ['codigo', 'nombre', 'descripcion', 'grado'];

const noEncontrada = (res) => res.status(404).json({
  error: 'Carrera no encontrada',
  codigo: 'CARRERA_NO_ENCONTRADA',
});

// Toma del cuerpo solo los campos permitidos que realmente llegaron
const extraerCampos = (body) => {
  const datos = {};
  CAMPOS_EDITABLES.forEach((campo) => {
    if (body[campo] !== undefined) datos[campo] = body[campo];
  });
  if (body.estado !== undefined) datos.estado = body.estado === true || body.estado === 'true';
  return datos;
};

// Listar carreras con filtros opcionales: ?grado=Licenciatura&estado=true
const listarCarreras = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const where = {};
    if (req.query.grado) where.grado = req.query.grado;
    if (req.query.estado !== undefined) where.estado = req.query.estado === 'true';

    const carreras = await Carrera.findAll({ where, order: [['nombre', 'ASC']] });
    return res.json(carreras);
  } catch (error) {
    console.error('Error al listar carreras:', error);
    return res.status(500).json({ error: 'Error interno al listar las carreras' });
  }
};

// Obtener una carrera por ID: ?id=1
const obtenerCarreraPorId = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const carrera = await Carrera.findByPk(Number(req.query.id));
    if (!carrera) return noEncontrada(res);

    return res.json(carrera);
  } catch (error) {
    console.error('Error al obtener la carrera por ID:', error);
    return res.status(500).json({ error: 'Error interno al obtener la carrera' });
  }
};

// Obtener una carrera por código: ?codigo=ISC
const obtenerCarreraPorCodigo = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const carrera = await Carrera.findOne({ where: { codigo: req.query.codigo } });
    if (!carrera) return noEncontrada(res);

    return res.json(carrera);
  } catch (error) {
    console.error('Error al obtener la carrera por código:', error);
    return res.status(500).json({ error: 'Error interno al obtener la carrera' });
  }
};

// Crear una carrera
const crearCarrera = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const carrera = await Carrera.create(extraerCampos(req.body));
    return res.status(201).json(carrera);
  } catch (error) {
    // Cubre la carrera en que dos peticiones pasan la validación a la vez
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        error: 'El código o el nombre de la carrera ya está registrado',
        codigo: 'CARRERA_DUPLICADA',
      });
    }
    console.error('Error al crear la carrera:', error);
    return res.status(500).json({ error: 'Error interno al crear la carrera' });
  }
};

// Actualizar una carrera: ?id=1
const actualizarCarrera = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const carrera = await Carrera.findByPk(Number(req.query.id));
    if (!carrera) return noEncontrada(res);

    await carrera.update(extraerCampos(req.body));
    return res.json(carrera);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        error: 'El código o el nombre de la carrera ya está registrado',
        codigo: 'CARRERA_DUPLICADA',
      });
    }
    console.error('Error al actualizar la carrera:', error);
    return res.status(500).json({ error: 'Error interno al actualizar la carrera' });
  }
};

// Eliminar una carrera: ?id=1 (se rechaza si tiene estudiantes asociados)
const eliminarCarrera = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const carrera = await Carrera.findByPk(Number(req.query.id));
    if (!carrera) return noEncontrada(res);

    const estudiantes = await Estudiante.count({ where: { carreraId: carrera.id } });
    if (estudiantes > 0) {
      return res.status(409).json({
        error: `No se puede eliminar la carrera porque tiene ${estudiantes} estudiante(s) asociado(s)`,
        codigo: 'CARRERA_CON_ESTUDIANTES',
      });
    }

    await carrera.destroy();
    return res.json({ mensaje: 'Carrera eliminada correctamente' });
  } catch (error) {
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(409).json({
        error: 'No se puede eliminar la carrera porque tiene registros asociados',
        codigo: 'CARRERA_CON_REGISTROS',
      });
    }
    console.error('Error al eliminar la carrera:', error);
    return res.status(500).json({ error: 'Error interno al eliminar la carrera' });
  }
};

module.exports = {
  listarCarreras,
  obtenerCarreraPorId,
  obtenerCarreraPorCodigo,
  crearCarrera,
  actualizarCarrera,
  eliminarCarrera,
};