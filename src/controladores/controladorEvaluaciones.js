const { validationResult } = require('express-validator');
const Evaluacion = require('../modelos/evaluacion');
const Asignatura = require('../modelos/asignatura');
const Periodo = require('../modelos/periodo');

const incluir = [
  { model: Asignatura, as: 'asignatura', attributes: ['id', 'codigo', 'nombre'] },
  { model: Periodo, as: 'periodo', attributes: ['id', 'periodoquecursa', 'año'] }
];
const validar = (req, res) => {
  const errores = validationResult(req);
  if (!errores.isEmpty()) { res.status(400).json({ errores: errores.array() }); return false; }
  return true;
};

const listar = async (req, res) => {
  if (!validar(req, res)) return;
  const where = {};
  for (const campo of ['asignaturaId', 'periodoId', 'tipo', 'estado']) if (req.query[campo]) where[campo] = req.query[campo];
  try {
    const datos = await Evaluacion.findAll({ where, include: incluir, order: [['fecha', 'ASC']] });
    res.json(datos);
  } catch (e) { console.error(e); res.status(500).json({ mensaje: 'No se pudieron obtener las evaluaciones' }); }
};
const obtener = async (req, res) => {
  if (!validar(req, res)) return;
  try {
    const dato = await Evaluacion.findByPk(req.params.id, { include: incluir });
    if (!dato) return res.status(404).json({ mensaje: 'Evaluación no encontrada' });
    res.json(dato);
  } catch (e) { console.error(e); res.status(500).json({ mensaje: 'Error al obtener la evaluación' }); }
};
const guardar = async (req, res) => {
  if (!validar(req, res)) return;
  try {
    const dato = await Evaluacion.create(req.body);
    res.status(201).json(await Evaluacion.findByPk(dato.id, { include: incluir }));
  } catch (e) { console.error(e); res.status(500).json({ mensaje: 'No se pudo guardar la evaluación' }); }
};
const actualizar = async (req, res) => {
  if (!validar(req, res)) return;
  try {
    const dato = await Evaluacion.findByPk(req.params.id);
    if (!dato) return res.status(404).json({ mensaje: 'Evaluación no encontrada' });
    await dato.update(req.body);
    res.json(await Evaluacion.findByPk(dato.id, { include: incluir }));
  } catch (e) { console.error(e); res.status(500).json({ mensaje: 'No se pudo actualizar la evaluación' }); }
};
const eliminar = async (req, res) => {
  try {
    const dato = await Evaluacion.findByPk(req.params.id);
    if (!dato) return res.status(404).json({ mensaje: 'Evaluación no encontrada' });
    await dato.destroy();
    res.json({ mensaje: 'Evaluación eliminada correctamente' });
  } catch (e) { console.error(e); res.status(500).json({ mensaje: 'No se pudo eliminar la evaluación' }); }
};
module.exports = { listar, obtener, guardar, actualizar, eliminar };
