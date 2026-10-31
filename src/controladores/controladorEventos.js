const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const db = require('../configuracion/db');
const Evento = require('../modelos/evento');
const Recordatorio = require('../modelos/recordatorio');
const Asignatura = require('../modelos/asignatura');

const incluir = [
  {
    model: Recordatorio,
    as: 'recordatorios',
    attributes: ['id', 'minutosAntes', 'fechaAviso', 'notificado'],
  },
  { model: Asignatura, as: 'asignatura', attributes: ['id', 'codigo', 'nombre'] },
];

const listarEventos = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { estudianteId, tipo, estado, desde, hasta } = req.query;
  const where = {};
  if (estudianteId) where.estudianteId = estudianteId;
  if (tipo) where.tipo = tipo;
  if (estado) where.estado = estado;
  if (desde || hasta) {
    where.fechaInicio = {};
    if (desde) where.fechaInicio[Op.gte] = new Date(desde);
    if (hasta) where.fechaInicio[Op.lte] = new Date(hasta);
  }

  try {
    const eventos = await Evento.findAll({
      where,
      include: incluir,
      order: [['fechaInicio', 'ASC']],
    });
    res.json(eventos);
  } catch (error) {
    console.error('Error al listar los eventos:', error);
    res.status(500).json({ error: 'Error al listar los eventos' });
  }
};

const obtenerEventoPorId = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.query;
  try {
    const evento = await Evento.findByPk(id, { include: incluir });
    if (!evento) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }
    res.json(evento);
  } catch (error) {
    console.error('Error al obtener el evento por ID:', error);
    res.status(500).json({ error: 'Error al obtener el evento por ID' });
  }
};

const crearEvento = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    titulo, descripcion = null, tipo, fechaInicio, fechaFin = null,
    lugar = null, estado = 'Pendiente', estudianteId, asignaturaId = null,
  } = req.body;

  try {
    const nuevo = await Evento.create({
      titulo, descripcion, tipo, fechaInicio, fechaFin, lugar, estado, estudianteId, asignaturaId,
    });
    const creado = await Evento.findByPk(nuevo.id, { include: incluir });
    res.status(201).json(creado);
  } catch (error) {
    console.error('Error al crear el evento:', error);
    res.status(500).json({ error: 'Error al crear el evento' });
  }
};

const actualizarEvento = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.query;
  const {
    titulo, descripcion = null, tipo, fechaInicio, fechaFin = null,
    lugar = null, estado, asignaturaId = null,
  } = req.body;

  try {
    const evento = await Evento.findByPk(id);
    if (!evento) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }

    const cambioFecha = new Date(fechaInicio).getTime() !== new Date(evento.fechaInicio).getTime();

    await db.transaction(async (t) => {
      await evento.update(
        { titulo, descripcion, tipo, fechaInicio, fechaFin, lugar, estado, asignaturaId },
        { transaction: t }
      );

      if (cambioFecha) {
        const recordatorios = await Recordatorio.findAll({
          where: { eventoId: evento.id },
          transaction: t,
        });
        for (const recordatorio of recordatorios) {
          await recordatorio.update(
            {
              fechaAviso: Recordatorio.calcularAviso(evento.fechaInicio, recordatorio.minutosAntes),
              notificado: false,
            },
            { transaction: t }
          );
        }
      }
    });

    const actualizado = await Evento.findByPk(id, { include: incluir });
    res.json(actualizado);
  } catch (error) {
    console.error('Error al actualizar el evento:', error);
    res.status(500).json({ error: 'Error al actualizar el evento' });
  }
};

const eliminarEvento = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.query;
  try {
    const evento = await Evento.findByPk(id);
    if (!evento) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }
    await evento.destroy();
    res.json({ message: 'Evento eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar el evento:', error);
    res.status(500).json({ error: 'Error al eliminar el evento' });
  }
};

module.exports = {
  listarEventos,
  obtenerEventoPorId,
  crearEvento,
  actualizarEvento,
  eliminarEvento,
};