const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const moment = require('moment');
const Meta = require('../modelos/meta');
const Asignatura = require('../modelos/asignatura');

const incluir = [
  { model: Asignatura, as: 'asignatura', attributes: ['id', 'codigo', 'nombre'] },
];

const hoy = () => moment().format('YYYY-MM-DD');

const listarMetas = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { estudianteId, asignaturaId, estado, vencidas } = req.query;
  const where = {};
  if (estudianteId) where.estudianteId = estudianteId;
  if (asignaturaId) where.asignaturaId = asignaturaId;
  if (estado) where.estado = estado;
  if (vencidas === 'true') {
    where.estado = { [Op.in]: Meta.ESTADOS_ACTIVOS };
    where.fechaLimite = { [Op.lt]: hoy() };
  }

  try {
    const metas = await Meta.findAll({
      where,
      include: incluir,
      order: [['fechaLimite', 'ASC']],
    });
    res.json(metas);
  } catch (error) {
    console.error('Error al listar las metas:', error);
    res.status(500).json({ error: 'Error al listar las metas' });
  }
};

const obtenerMetaPorId = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.query;
  try {
    const meta = await Meta.findByPk(id, { include: incluir });
    if (!meta) {
      return res.status(404).json({ error: 'Meta no encontrada' });
    }
    res.json(meta);
  } catch (error) {
    console.error('Error al obtener la meta por ID:', error);
    res.status(500).json({ error: 'Error al obtener la meta por ID' });
  }
};

const crearMeta = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    titulo, descripcion = null, fechaInicio = hoy(), fechaLimite,
    unidad = 'unidades', estudianteId, asignaturaId = null,
  } = req.body;
  const valorObjetivo = Number(req.body.valorObjetivo);
  const valorActual = Number(req.body.valorActual ?? 0);

  if (fechaLimite < hoy()) {
    return res.status(400).json({ error: 'La fecha límite no puede ser anterior a la fecha actual' });
  }
  if (valorActual > valorObjetivo) {
    return res.status(400).json({ error: 'El progreso inicial no puede superar el objetivo' });
  }

  try {
    const nueva = await Meta.create({
      titulo,
      descripcion,
      fechaInicio,
      fechaLimite,
      valorObjetivo,
      valorActual,
      unidad,
      estado: Meta.calcularEstado(valorActual, valorObjetivo),
      estudianteId,
      asignaturaId,
    });
    const creada = await Meta.findByPk(nueva.id, { include: incluir });
    res.status(201).json(creada);
  } catch (error) {
    console.error('Error al crear la meta:', error);
    res.status(500).json({ error: 'Error al crear la meta' });
  }
};

const actualizarMeta = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.query;
  const {
    titulo, descripcion = null, fechaInicio, fechaLimite, unidad, asignaturaId = null,
  } = req.body;
  const valorObjetivo = Number(req.body.valorObjetivo);

  try {
    const meta = await Meta.findByPk(id);
    if (!meta) {
      return res.status(404).json({ error: 'Meta no encontrada' });
    }
    if (meta.valorActual > valorObjetivo) {
      return res.status(400).json({ error: 'El nuevo objetivo no puede ser menor al progreso registrado' });
    }

    await meta.update({
      titulo,
      descripcion,
      fechaInicio,
      fechaLimite,
      valorObjetivo,
      unidad,
      asignaturaId,
      estado: Meta.calcularEstado(meta.valorActual, valorObjetivo, meta.estado),
    });
    const actualizada = await Meta.findByPk(id, { include: incluir });
    res.json(actualizada);
  } catch (error) {
    console.error('Error al actualizar la meta:', error);
    res.status(500).json({ error: 'Error al actualizar la meta' });
  }
};

const registrarProgreso = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.query;
  const valorActual = Number(req.body.valorActual);

  try {
    const meta = await Meta.findByPk(id);
    if (!meta) {
      return res.status(404).json({ error: 'Meta no encontrada' });
    }
    if (meta.estado === 'Cancelada') {
      return res.status(409).json({ error: 'No se puede registrar progreso en una meta cancelada' });
    }
    if (valorActual > meta.valorObjetivo) {
      return res.status(400).json({ error: 'El progreso no puede superar el objetivo' });
    }

    await meta.update({
      valorActual,
      estado: Meta.calcularEstado(valorActual, meta.valorObjetivo),
    });
    res.json(meta);
  } catch (error) {
    console.error('Error al registrar el progreso de la meta:', error);
    res.status(500).json({ error: 'Error al registrar el progreso de la meta' });
  }
};

const cancelarMeta = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.query;
  const { cancelada } = req.body;

  try {
    const meta = await Meta.findByPk(id);
    if (!meta) {
      return res.status(404).json({ error: 'Meta no encontrada' });
    }

    const estado = cancelada
      ? 'Cancelada'
      : Meta.calcularEstado(meta.valorActual, meta.valorObjetivo);
    await meta.update({ estado });
    res.json(meta);
  } catch (error) {
    console.error('Error al cambiar el estado de cancelación de la meta:', error);
    res.status(500).json({ error: 'Error al cambiar el estado de cancelación de la meta' });
  }
};

const eliminarMeta = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.query;
  try {
    const meta = await Meta.findByPk(id);
    if (!meta) {
      return res.status(404).json({ error: 'Meta no encontrada' });
    }
    await meta.destroy();
    res.json({ message: 'Meta eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar la meta:', error);
    res.status(500).json({ error: 'Error al eliminar la meta' });
  }
};

module.exports = {
  listarMetas,
  obtenerMetaPorId,
  crearMeta,
  actualizarMeta,
  registrarProgreso,
  cancelarMeta,
  eliminarMeta,
};