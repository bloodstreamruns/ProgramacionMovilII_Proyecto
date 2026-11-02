const Archivo = require('../modelos/archivo');
const Asignatura = require('../modelos/asignatura');
const { validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');

// Consultar todos los archivos
const listarArchivos = async (req, res) => {
  try {
    const archivos = await Archivo.findAll({
      where: req.query.asignaturaId
        ? { asignaturaId: req.query.asignaturaId }
        : {},
    });

    return res.status(200).json(archivos);
  } catch (error) {
    return res.status(500).json({
      mensaje: 'Error al consultar los archivos',
      error: error.message,
    });
  }
};

// Consultar un archivo por ID
const obtenerArchivoPorId = async (req, res) => {
  try {
    const errores = validationResult(req);

    if (!errores.isEmpty()) {
      return res.status(400).json({ errores: errores.array() });
    }

    const archivo = await Archivo.findByPk(req.query.id);

    if (!archivo) {
      return res.status(404).json({
        mensaje: 'Archivo no encontrado',
      });
    }

    return res.status(200).json(archivo);
  } catch (error) {
    return res.status(500).json({
      mensaje: 'Error al consultar el archivo',
      error: error.message,
    });
  }
};

// Descargar o consultar el documento
const descargarArchivo = async (req, res) => {
  try {
    const archivo = await Archivo.findByPk(req.query.id);

    if (!archivo) {
      return res.status(404).json({
        mensaje: 'Archivo no encontrado',
      });
    }

    const rutaArchivo = path.resolve(archivo.ruta);

    if (!fs.existsSync(rutaArchivo)) {
      return res.status(404).json({
        mensaje: 'El documento no se encuentra almacenado',
      });
    }

    return res.download(rutaArchivo, archivo.nombreArchivo);
  } catch (error) {
    return res.status(500).json({
      mensaje: 'Error al descargar el archivo',
      error: error.message,
    });
  }
};

// Subir un archivo
const crearArchivo = async (req, res) => {
  try {
    const errores = validationResult(req);

    if (!errores.isEmpty()) {
      if (req.file) await fs.promises.unlink(req.file.path);

      return res.status(400).json({ errores: errores.array() });
    }

    if (!req.file) {
      return res.status(400).json({
        mensaje: 'Debe seleccionar un archivo para subir',
      });
    }

    const { nombre, tipoDocumento, asignaturaId } = req.body;

    const asignatura = await Asignatura.findByPk(asignaturaId);

    if (!asignatura) {
      await fs.promises.unlink(req.file.path);

      return res.status(404).json({
        mensaje: 'La asignatura indicada no existe',
      });
    }

    const nuevoArchivo = await Archivo.create({
      nombre,
      nombreArchivo: req.file.originalname,
      ruta: req.file.path,
      tipoDocumento,
      asignaturaId,
    });

    return res.status(201).json({
      mensaje: 'Archivo subido correctamente',
      archivo: nuevoArchivo,
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      await fs.promises.unlink(req.file.path);
    }

    return res.status(500).json({
      mensaje: 'Error al subir el archivo',
      error: error.message,
    });
  }
};

// Reemplazar un archivo
const actualizarArchivo = async (req, res) => {
  try {
    const errores = validationResult(req);

    if (!errores.isEmpty()) {
      if (req.file) await fs.promises.unlink(req.file.path);

      return res.status(400).json({ errores: errores.array() });
    }

    const archivo = await Archivo.findByPk(req.query.id);

    if (!archivo) {
      if (req.file) await fs.promises.unlink(req.file.path);

      return res.status(404).json({
        mensaje: 'Archivo no encontrado',
      });
    }

    const { nombre, tipoDocumento, asignaturaId } = req.body;

    if (asignaturaId) {
      const asignatura = await Asignatura.findByPk(asignaturaId);

      if (!asignatura) {
        if (req.file) await fs.promises.unlink(req.file.path);

        return res.status(404).json({
          mensaje: 'La asignatura indicada no existe',
        });
      }
    }

    const rutaAnterior = archivo.ruta;

    await archivo.update({
      ...(nombre !== undefined && { nombre }),
      ...(tipoDocumento !== undefined && { tipoDocumento }),
      ...(asignaturaId !== undefined && { asignaturaId }),
      ...(req.file && {
        nombreArchivo: req.file.originalname,
        ruta: req.file.path,
      }),
    });

    // Eliminar el documento anterior después de reemplazarlo
    if (req.file && fs.existsSync(rutaAnterior)) {
      await fs.promises.unlink(rutaAnterior);
    }

    return res.status(200).json({
      mensaje: 'Archivo actualizado correctamente',
      archivo,
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      await fs.promises.unlink(req.file.path);
    }

    return res.status(500).json({
      mensaje: 'Error al actualizar el archivo',
      error: error.message,
    });
  }
};

// Eliminar un archivo
const eliminarArchivo = async (req, res) => {
  try {
    const errores = validationResult(req);

    if (!errores.isEmpty()) {
      return res.status(400).json({ errores: errores.array() });
    }

    const archivo = await Archivo.findByPk(req.query.id);

    if (!archivo) {
      return res.status(404).json({
        mensaje: 'Archivo no encontrado',
      });
    }

    const rutaArchivo = archivo.ruta;

    await archivo.destroy();

    if (fs.existsSync(rutaArchivo)) {
      await fs.promises.unlink(rutaArchivo);
    }

    return res.status(200).json({
      mensaje: 'Archivo eliminado correctamente',
    });
  } catch (error) {
    return res.status(500).json({
      mensaje: 'Error al eliminar el archivo',
      error: error.message,
    });
  }
};

module.exports = {
  listarArchivos,
  obtenerArchivoPorId,
  descargarArchivo,
  crearArchivo,
  actualizarArchivo,
  eliminarArchivo,
};
