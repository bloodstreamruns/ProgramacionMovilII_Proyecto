const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const Calificacion = require('../modelos/calificacion');
const Asignatura = require('../modelos/asignatura');
const Periodo = require('../modelos/periodo');

const incluir = [
  { model: Asignatura, as: 'asignatura', attributes: ['id', 'codigo', 'nombre'] },
  { model: Periodo, as: 'periodo', attributes: ['id', 'periodoquecursa', 'año'] }
];

const validar = (req, res) => {
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    res.status(400).json({ errores: errores.array() });
    return false;
  }
  return true;
};

const listar = async (req, res) => {
  if (!validar(req, res)) return;
  const where = {};
  if (req.query.asignaturaId) where.asignaturaId = req.query.asignaturaId;
  if (req.query.periodoId) where.periodoId = req.query.periodoId;
  if (req.query.tipo) where.tipo = req.query.tipo;
  try {
    const datos = await Calificacion.findAll({ where, include: incluir, order: [['fecha', 'DESC'], ['id', 'DESC']] });
    res.json(datos);
  } catch (e) {
    console.error(e); res.status(500).json({ mensaje: 'No se pudieron obtener las calificaciones' });
  }
};

const obtener = async (req, res) => {
  if (!validar(req, res)) return;
  try {
    const dato = await Calificacion.findByPk(req.params.id, { include: incluir });
    if (!dato) return res.status(404).json({ mensaje: 'Calificación no encontrada' });
    res.json(dato);
  } catch (e) { console.error(e); res.status(500).json({ mensaje: 'Error al obtener la calificación' }); }
};

const guardar = async (req, res) => {
  if (!validar(req, res)) return;
  try {
    if (Number(req.body.nota) > Number(req.body.notaMaxima || 100))
      return res.status(400).json({ mensaje: 'La nota no puede superar la nota máxima' });
    const dato = await Calificacion.create(req.body);
    res.status(201).json(await Calificacion.findByPk(dato.id, { include: incluir }));
  } catch (e) { console.error(e); res.status(500).json({ mensaje: 'No se pudo registrar la calificación' }); }
};

const actualizar = async (req, res) => {
  if (!validar(req, res)) return;
  try {
    const dato = await Calificacion.findByPk(req.params.id);
    if (!dato) return res.status(404).json({ mensaje: 'Calificación no encontrada' });
    const nota = req.body.nota ?? dato.nota;
    const max = req.body.notaMaxima ?? dato.notaMaxima;
    if (Number(nota) > Number(max)) return res.status(400).json({ mensaje: 'La nota no puede superar la nota máxima' });
    await dato.update(req.body);
    res.json(await Calificacion.findByPk(dato.id, { include: incluir }));
  } catch (e) { console.error(e); res.status(500).json({ mensaje: 'No se pudo actualizar la calificación' }); }
};

const eliminar = async (req, res) => {
  try {
    const dato = await Calificacion.findByPk(req.params.id);
    if (!dato) return res.status(404).json({ mensaje: 'Calificación no encontrada' });
    await dato.destroy();
    res.json({ mensaje: 'Calificación eliminada correctamente' });
  } catch (e) { console.error(e); res.status(500).json({ mensaje: 'No se pudo eliminar la calificación' }); }
};

module.exports = { listar, obtener, guardar, actualizar, eliminar };
