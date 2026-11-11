const { validationResult } = require('express-validator');
const Asignatura = require('../modelos/asignatura');
const Carrera = require('../modelos/carreras');

const incluir = [
  { model: Carrera, as: 'carrera', attributes: ['id', 'codigo', 'nombre'] },
];

const listarAsignaturas = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { carreraId } = req.query;
  try {
    const asignaturas = await Asignatura.findAll({
      where: carreraId ? { carreraId } : undefined,
      include: incluir,
      order: [['codigo', 'ASC']],
    });
    res.json(asignaturas);
  } catch (error) {
    console.error('Error al listar las asignaturas:', error);
    res.status(500).json({ error: 'Error al listar las asignaturas' });
  }
};

const obtenerAsignaturaPorId = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.query;
  try {
    const asignatura = await Asignatura.findByPk(id, { include: incluir });
    if (!asignatura) {
      return res.status(404).json({ error: 'Asignatura no encontrada' });
    }
    res.json(asignatura);
  } catch (error) {
    console.error('Error al obtener la asignatura por ID:', error);
    res.status(500).json({ error: 'Error al obtener la asignatura por ID' });
  }
};

const crearAsignatura = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { codigo, nombre, unidadesValorativas, descripcion = null, estado = true, carreraId } = req.body;

  try {
    const nueva = await Asignatura.create({
      codigo, nombre, unidadesValorativas, descripcion, estado, carreraId,
    });
    const creada = await Asignatura.findByPk(nueva.id, { include: incluir });
    res.status(201).json(creada);
  } catch (error) {
    console.error('Error al crear la asignatura:', error);
    res.status(500).json({ error: 'Error al crear la asignatura' });
  }
};

const actualizarAsignatura = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const id = Number(req.query.id);
  const { codigo, nombre, unidadesValorativas, descripcion = null, estado, carreraId } = req.body;

  try {
    const asignatura = await Asignatura.findByPk(id);
    if (!asignatura) {
      return res.status(404).json({ error: 'Asignatura no encontrada' });
    }

    await asignatura.update({
      codigo, nombre, unidadesValorativas, descripcion, estado, carreraId,
    });

    const actualizada = await Asignatura.findByPk(id, { include: incluir });
    res.json(actualizada);
  } catch (error) {
    console.error('Error al actualizar la asignatura:', error);
    res.status(500).json({ error: 'Error al actualizar la asignatura' });
  }
};

const eliminarAsignatura = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.query;
  try {
    const asignatura = await Asignatura.findByPk(id);
    if (!asignatura) {
      return res.status(404).json({ error: 'Asignatura no encontrada' });
    }

    await asignatura.destroy();
    res.json({ message: 'Asignatura eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar la asignatura:', error);
    res.status(500).json({ error: 'Error al eliminar la asignatura' });
  }
};

module.exports = {
  listarAsignaturas,
  obtenerAsignaturaPorId,
  crearAsignatura,
  actualizarAsignatura,
  eliminarAsignatura,
};