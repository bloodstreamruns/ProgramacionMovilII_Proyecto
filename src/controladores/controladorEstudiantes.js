const { validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs');
const Estudiante = require('../modelos/estudiante');
const Carrera = require('../modelos/carreras');
const { uploadImagen } = require('../configuraciones/archivos');
const Usuario = require('../modelos/usuario');

const DIRECTORIO_IMAGENES = path.join(__dirname, '../../public/img');

const incluir = [
  { model: Carrera, as: 'carrera', attributes: ['id', 'codigo', 'nombre'] },
  { model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'correoElectronico', 'rol', 'estado'] },
];

const borrarImagen = (nombre) => {
  if (!nombre) return;
  const ruta = path.join(DIRECTORIO_IMAGENES, path.basename(nombre));
  fs.promises.unlink(ruta).catch((error) => {
    if (error.code !== 'ENOENT') {
      console.error('Error al eliminar la imagen:', error);
    }
  });
};

const listarEstudiantes = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { carreraId, estado } = req.query;
  const where = {};
  if (carreraId) where.carreraId = carreraId;
  if (estado !== undefined) where.estado = ['true', '1'].includes(estado);

  try {
    const estudiantes = await Estudiante.findAll({
      where,
      include: incluir,
      order: [['primerApellido', 'ASC'], ['primerNombre', 'ASC']],
    });
    res.json(estudiantes);
  } catch (error) {
    console.error('Error al listar los estudiantes:', error);
    res.status(500).json({ error: 'Error al listar los estudiantes' });
  }
};

const obtenerEstudiantePorId = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.query;
  try {
    const estudiante = await Estudiante.findByPk(id, { include: incluir });
    if (!estudiante) {
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }
    res.json(estudiante);
  } catch (error) {
    console.error('Error al obtener el estudiante por ID:', error);
    res.status(500).json({ error: 'Error al obtener el estudiante por ID' });
  }
};

const obtenerEstudiantePorIdentidad = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { identidad } = req.query;
  try {
    const estudiante = await Estudiante.findOne({ where: { identidad }, include: incluir });
    if (!estudiante) {
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }
    res.json(estudiante);
  } catch (error) {
    console.error('Error al obtener el estudiante por identidad:', error);
    res.status(500).json({ error: 'Error al obtener el estudiante por identidad' });
  }
};

const crearEstudiante = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    identidad, cuenta, primerNombre, segundoNombre = null, primerApellido,
    segundoApellido = null, correoElectronico, estado = true, carreraId,
  } = req.body;

  try {
    const nuevo = await Estudiante.create({
      identidad, cuenta, primerNombre, segundoNombre, primerApellido,
      segundoApellido, correoElectronico, estado, carreraId,
    });
    const creado = await Estudiante.findByPk(nuevo.id, { include: incluir });
    res.status(201).json(creado);
  } catch (error) {
    console.error('Error al crear el estudiante:', error);
    res.status(500).json({ error: 'Error al crear el estudiante' });
  }
};

const actualizarEstudiante = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.query;
  const {
    identidad, cuenta, primerNombre, segundoNombre = null, primerApellido,
    segundoApellido = null, correoElectronico, estado, carreraId,
  } = req.body;

  try {
    const estudiante = await Estudiante.findByPk(id);
    if (!estudiante) {
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }

    await estudiante.update({
      identidad, cuenta, primerNombre, segundoNombre, primerApellido,
      segundoApellido, correoElectronico, estado, carreraId,
    });
    const actualizado = await Estudiante.findByPk(id, { include: incluir });
    res.json(actualizado);
  } catch (error) {
    console.error('Error al actualizar el estudiante:', error);
    res.status(500).json({ error: 'Error al actualizar el estudiante' });
  }
};

const eliminarEstudiante = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.query;
  try {
    const estudiante = await Estudiante.findByPk(id);
    if (!estudiante) {
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }

    const { imagen } = estudiante;
    await estudiante.destroy();
    borrarImagen(imagen);
    res.json({ message: 'Estudiante eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar el estudiante:', error);
    res.status(500).json({ error: 'Error al eliminar el estudiante' });
  }
};

const validarImagenEstudiante = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  uploadImagen.single('imagen')(req, res, (err) => {
    if (err) {
      const mensaje = err.code === 'LIMIT_FILE_SIZE'
        ? 'La imagen supera el tamaño máximo de 5 MB'
        : err.message;
      return res.status(400).json({ error: mensaje });
    }
    next();
  });
};

const actualizarImagenEstudiante = async (req, res) => {
  const { id } = req.query;
  const imagenNueva = req.file ? req.file.filename : null;

  try {
    const estudiante = await Estudiante.findByPk(id);
    if (!estudiante) {
      borrarImagen(imagenNueva);
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }
    if (!imagenNueva) {
      return res.status(400).json({ error: 'Debe enviar una imagen en el campo "imagen"' });
    }

    const imagenAnterior = estudiante.imagen;
    await estudiante.update({ imagen: imagenNueva });
    borrarImagen(imagenAnterior);

    res.json({ message: 'Imagen del estudiante actualizada correctamente', estudiante });
  } catch (error) {
    borrarImagen(imagenNueva);
    console.error('Error al actualizar la imagen del estudiante:', error);
    res.status(500).json({ error: 'Error al actualizar la imagen del estudiante' });
  }
};

module.exports = {
  listarEstudiantes,
  obtenerEstudiantePorId,
  obtenerEstudiantePorIdentidad,
  crearEstudiante,
  actualizarEstudiante,
  eliminarEstudiante,
  validarImagenEstudiante,
  actualizarImagenEstudiante,
};