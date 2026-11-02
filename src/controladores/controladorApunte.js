const Apunte = require('../modelos/apunte');
const { validationResult } = require('express-validator');

// Listar todos los apuntes
const listarApuntes = async (req, res) => {
  try {
    const apuntes = await Apunte.findAll({
      where: req.query.asignaturaId
        ? { asignaturaId: req.query.asignaturaId }
        : {},
      order: [['fecha', 'DESC']],
    });

    return res.status(200).json(apuntes);
  } catch (error) {
    return res.status(500).json({
      mensaje: 'Error al consultar los apuntes',
      error: error.message,
    });
  }
};

// Obtener un apunte por ID
const obtenerApuntePorId = async (req, res) => {
  try {
    const errores = validationResult(req);

    if (!errores.isEmpty()) {
      return res.status(400).json({ errores: errores.array() });
    }

    const apunte = await Apunte.findByPk(req.query.id);

    if (!apunte) {
      return res.status(404).json({
        mensaje: 'Apunte no encontrado',
      });
    }

    return res.status(200).json(apunte);
  } catch (error) {
    return res.status(500).json({
      mensaje: 'Error al consultar el apunte',
      error: error.message,
    });
  }
};

// Crear un apunte
const crearApunte = async (req, res) => {
  try {
    const errores = validationResult(req);

    if (!errores.isEmpty()) {
      return res.status(400).json({ errores: errores.array() });
    }

    const { titulo, contenido, fecha, asignaturaId } = req.body;

    const nuevoApunte = await Apunte.create({
      titulo,
      contenido,
      fecha,
      asignaturaId,
    });

    return res.status(201).json({
      mensaje: 'Apunte creado correctamente',
      apunte: nuevoApunte,
    });
  } catch (error) {
    return res.status(500).json({
      mensaje: 'Error al crear el apunte',
      error: error.message,
    });
  }
};

// Actualizar un apunte
const actualizarApunte = async (req, res) => {
  try {
    const errores = validationResult(req);

    if (!errores.isEmpty()) {
      return res.status(400).json({ errores: errores.array() });
    }

    const apunte = await Apunte.findByPk(req.query.id);

    if (!apunte) {
      return res.status(404).json({
        mensaje: 'Apunte no encontrado',
      });
    }

    const { titulo, contenido, fecha, asignaturaId } = req.body;

    await apunte.update({
      ...(titulo !== undefined && { titulo }),
      ...(contenido !== undefined && { contenido }),
      ...(fecha !== undefined && { fecha }),
      ...(asignaturaId !== undefined && { asignaturaId }),
    });

    return res.status(200).json({
      mensaje: 'Apunte actualizado correctamente',
      apunte,
    });
  } catch (error) {
    return res.status(500).json({
      mensaje: 'Error al actualizar el apunte',
      error: error.message,
    });
  }
};

// Eliminar un apunte
const eliminarApunte = async (req, res) => {
  try {
    const errores = validationResult(req);

    if (!errores.isEmpty()) {
      return res.status(400).json({ errores: errores.array() });
    }

    const apunte = await Apunte.findByPk(req.query.id);

    if (!apunte) {
      return res.status(404).json({
        mensaje: 'Apunte no encontrado',
      });
    }

    await apunte.destroy();

    return res.status(200).json({
      mensaje: 'Apunte eliminado correctamente',
    });
  } catch (error) {
    return res.status(500).json({
      mensaje: 'Error al eliminar el apunte',
      error: error.message,
    });
  }
};

module.exports = {
  listarApuntes,
  obtenerApuntePorId,
  crearApunte,
  actualizarApunte,
  eliminarApunte,
};
