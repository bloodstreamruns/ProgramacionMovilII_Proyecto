const {validationResult} = require('express');
const Matricula = require('../../../src/modelos/matricula');

const obtenerMatriculas = async (req, res) => {
  try {
    const matriculas = await Matricula.findAll();
    return res.status(200).json(matriculas);
  } catch (error) {
    return res.status(500).json({
      mensaje: 'Error al obtener las matrículas',
      error: error.message,
    });
  }
};

const obtenerMatriculaPorId = async (req, res) => {
  try {
    const { id } = req.query;
    const matricula = await Matricula.findByPk(id);

    if (!matricula) {
      return res.status(404).json({
        mensaje: 'Matrícula no encontrada',
      });
    }

    return res.status(200).json(matricula);
  } catch (error) {
    return res.status(500).json({
      mensaje: 'Error al obtener la matrícula',
      error: error.message,
    });
  }
};

const crearMatricula = async (req, res) => {
  try {
    const { estudiante_id, asignatura_id, periodo, estado } = req.body;

    if (
      estudiante_id == null ||
      asignatura_id == null ||
      !periodo
    ) {
      return res.status(400).json({
        mensaje: 'estudiante_id, asignatura_id y periodo son obligatorios',
      });
    }

    const nuevamatricula = await Matricula.create({
      estudiante_id,
      asignatura_id,
      periodo,
      ...(estado !== undefined && { estado }),
    });

    return res.status(201).json({
      mensaje: 'Matrícula creada correctamente',
      matricula: nuevaMatricula,
    });
  } catch (error) {
    return res.status(500).json({
      mensaje: 'Error al crear la matrícula',
      error: error.message,
    });
  }
};

const actualizarMatricula = async (req, res) => {
  try {
    const { id } = req.query;
    const { estudiante_id, asignatura_id, periodo, estado } = req.body;

    const matricula = await matrícula.findByPk(id);

    if (!matricula) {
      return res.status(404).json({
        mensaje: 'Matricula no encontrada',
      });
    }

    await matricula.update({
      ...(estudiante_id !== undefined && { estudiante_id }),
      ...(asignatura_id !== undefined && { asignatura_id }),
      ...(periodo !== undefined && { periodo }),
      ...(estado !== undefined && { estado }),
    });

    return res.status(200).json({
      mensaje: 'Matricula actualizada correctamente',
      matricula,
    });
  } catch (error) {
    return res.status(500).json({
      mensaje: 'Error al actualizar la matricula',
      error: error.message,
    });
  }
};

const eliminarMatricula = async (req, res) => {
  try {
    const { id } = req.query;
    const matricula = await Matricula.findByPk(id);

    if (!matricula) {
      return res.status(404).json({
        mensaje: 'Matricula no encontrada',
      });
    }

    await matricula.destroy();

    return res.status(200).json({
      mensaje: 'Matricula eliminada correctamente',
    });
  } catch (error) {
    return res.status(500).json({
      mensaje: 'Error al eliminar la matricula',
      error: error.message,
    });
  }
};

module.exports = {
  obtenerMatriculas,
  obtenerMatriculaPorId,
  crearMatricula,
  actualizarMatricula,
  eliminarMatricula,
};