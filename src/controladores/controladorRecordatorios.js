const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const Recordatorio = require('../modelos/recordatorio');
const Evento = require('../modelos/evento');

const listarRecordatorios = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { eventoId, estudianteId, pendientes } = req.query;
  const where = {};
  const whereEvento = {};
  if (eventoId) where.eventoId = eventoId;
  if (estudianteId) whereEvento.estudianteId = estudianteId;
  if (pendientes === 'true') {
    where.notificado = false;
    where.fechaAviso = { [Op.lte]: new Date() };
    whereEvento.estado = 'Pendiente';
  }

  try {
    const recordatorios = await Recordatorio.findAll({
      where,
      include: [{
        model: Evento,
        as: 'evento',
        attributes: ['id', 'titulo', 'tipo', 'fechaInicio', 'estudianteId'],
        ...(Object.keys(whereEvento).length > 0 ? { where: whereEvento } : {}),
      }],
      order: [['fechaAviso', 'ASC']],
    });
    res.json(recordatorios);
  } catch (error) {
    console.error('Error al listar los recordatorios:', error);
    res.status(500).json({ error: 'Error al listar los recordatorios' });
  }
};

const obtenerRecordatorioPorId = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.query;
  try {
    const recordatorio = await Recordatorio.findByPk(id, {
      include: [{ model: Evento, as: 'evento', attributes: ['id', 'titulo', 'tipo', 'fechaInicio'] }],
    });
    if (!recordatorio) {
      return res.status(404).json({ error: 'Recordatorio no encontrado' });
    }
    res.json(recordatorio);
  } catch (error) {
    console.error('Error al obtener el recordatorio por ID:', error);
    res.status(500).json({ error: 'Error al obtener el recordatorio por ID' });
  }
};

const crearRecordatorio = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { eventoId, minutosAntes } = req.body;
  try {
    const evento = await Evento.findByPk(eventoId);
    if (!evento) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }

    const fechaAviso = Recordatorio.calcularAviso(evento.fechaInicio, minutosAntes);
    if (fechaAviso <= new Date()) {
      return res.status(400).json({ error: 'La fecha calculada para el recordatorio ya pasó' });
    }

    const duplicado = await Recordatorio.findOne({ where: { eventoId, minutosAntes } });
    if (duplicado) {
      return res.status(409).json({ error: 'El evento ya tiene un recordatorio con esa anticipación' });
    }

    const nuevo = await Recordatorio.create({ eventoId, minutosAntes, fechaAviso });
    res.status(201).json(nuevo);
  } catch (error) {
    console.error('Error al crear el recordatorio:', error);
    res.status(500).json({ error: 'Error al crear el recordatorio' });
  }
};

const actualizarRecordatorio = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.query;
  const { minutosAntes } = req.body;
  try {
    const recordatorio = await Recordatorio.findByPk(id, {
      include: [{ model: Evento, as: 'evento', attributes: ['id', 'fechaInicio'] }],
    });
    if (!recordatorio) {
      return res.status(404).json({ error: 'Recordatorio no encontrado' });
    }

    const fechaAviso = Recordatorio.calcularAviso(recordatorio.evento.fechaInicio, minutosAntes);
    if (fechaAviso <= new Date()) {
      return res.status(400).json({ error: 'La fecha calculada para el recordatorio ya pasó' });
    }

    const duplicado = await Recordatorio.findOne({
      where: { eventoId: recordatorio.eventoId, minutosAntes, id: { [Op.ne]: recordatorio.id } },
    });
    if (duplicado) {
      return res.status(409).json({ error: 'El evento ya tiene un recordatorio con esa anticipación' });
    }

    await recordatorio.update({ minutosAntes, fechaAviso, notificado: false });
    res.json(recordatorio);
  } catch (error) {
    console.error('Error al actualizar el recordatorio:', error);
    res.status(500).json({ error: 'Error al actualizar el recordatorio' });
  }
};

const marcarNotificado = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.query;
  try {
    const recordatorio = await Recordatorio.findByPk(id);
    if (!recordatorio) {
      return res.status(404).json({ error: 'Recordatorio no encontrado' });
    }
    await recordatorio.update({ notificado: true });
    res.json(recordatorio);
  } catch (error) {
    console.error('Error al marcar el recordatorio como notificado:', error);
    res.status(500).json({ error: 'Error al marcar el recordatorio como notificado' });
  }
};

const eliminarRecordatorio = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.query;
  try {
    const recordatorio = await Recordatorio.findByPk(id);
    if (!recordatorio) {
      return res.status(404).json({ error: 'Recordatorio no encontrado' });
    }
    await recordatorio.destroy();
    res.json({ message: 'Recordatorio eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar el recordatorio:', error);
    res.status(500).json({ error: 'Error al eliminar el recordatorio' });
  }
};

module.exports = {
  listarRecordatorios,
  obtenerRecordatorioPorId,
  crearRecordatorio,
  actualizarRecordatorio,
  marcarNotificado,
  eliminarRecordatorio,
};