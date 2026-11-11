const { validationResult } = require('express-validator');
const argon2 = require('argon2');
const { Op } = require('sequelize');
const db = require('../configuracion/db');
const Usuario = require('../modelos/usuario');
const Sesion = require('../modelos/sesion');
const Estudiante = require('../modelos/estudiante');

const ATRIBUTOS = { exclude: ['contrasena', 'pin'] };

const incluir = [
  {
    model: Estudiante,
    as: 'estudiante',
    attributes: ['id', 'cuenta', 'primerNombre', 'primerApellido'],
    required: false,
  },
];

const esUltimoAdministrador = async (usuario) => {
  if (usuario.rol !== 'administrador' || !usuario.estado) return false;
  const otros = await Usuario.count({
    where: { rol: 'administrador', estado: true, id: { [Op.ne]: usuario.id } },
  });
  return otros === 0;
};

const listarUsuarios = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { rol, estado } = req.query;
  const where = {};
  if (rol) where.rol = rol;
  if (estado !== undefined) where.estado = ['true', '1'].includes(estado);

  try {
    const usuarios = await Usuario.findAll({
      where,
      attributes: ATRIBUTOS,
      include: incluir,
      order: [['nombre', 'ASC']],
    });
    res.json(usuarios);
  } catch (error) {
    console.error('Error al listar los usuarios:', error);
    res.status(500).json({ error: 'Error al listar los usuarios' });
  }
};

const obtenerUsuarioPorId = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.query;
  try {
    const usuario = await Usuario.findByPk(id, { attributes: ATRIBUTOS, include: incluir });
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(usuario);
  } catch (error) {
    console.error('Error al obtener el usuario por ID:', error);
    res.status(500).json({ error: 'Error al obtener el usuario por ID' });
  }
};

const crearUsuario = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { nombre, correoElectronico, contrasena, rol, estado = true } = req.body;

  try {
    const nuevo = await Usuario.create({
      nombre,
      correoElectronico,
      contrasena,
      rol,
      estado,
    });
    const creado = await Usuario.findByPk(nuevo.id, { attributes: ATRIBUTOS, include: incluir });
    res.status(201).json(creado);
  } catch (error) {
    console.error('Error al crear el usuario:', error);
    res.status(500).json({ error: 'Error al crear el usuario' });
  }
};

const actualizarUsuario = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const id = Number(req.query.id);
  const { nombre, correoElectronico, contrasena, pin, rol, estado } = req.body;

  try {
    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const dejaDeSerAdministrador = rol !== 'administrador' || estado === false;
    if (dejaDeSerAdministrador && await esUltimoAdministrador(usuario)) {
      return res.status(409).json({
        error: 'No se puede desactivar ni cambiar el rol del único administrador activo',
      });
    }

    if (usuario.rol === 'estudiante' && rol !== 'estudiante'
      && await Estudiante.count({ where: { usuarioId: id } }) > 0) {
      return res.status(409).json({
        error: 'El usuario está vinculado a un estudiante; desvincúlelo antes de cambiar su rol',
      });
    }

    const cambios = { nombre, correoElectronico, rol, estado };
    const credencialesNuevas = Boolean(contrasena || pin);
    if (contrasena) cambios.contrasena = await argon2.hash(contrasena);
    if (pin) cambios.pin = await argon2.hash(pin);
    if (credencialesNuevas) cambios.intentosFallidos = 0;

    const invalidarSesiones = credencialesNuevas || (usuario.estado && estado === false);

    await db.transaction(async (t) => {
      await usuario.update(cambios, { transaction: t });
      if (invalidarSesiones) {
        await Sesion.update(
          { estado: 'revocada', fechaFin: new Date() },
          { where: { usuarioId: id, estado: 'activa' }, transaction: t }
        );
      }
    });

    const actualizado = await Usuario.findByPk(id, { attributes: ATRIBUTOS, include: incluir });
    res.json(actualizado);
  } catch (error) {
    console.error('Error al actualizar el usuario:', error);
    res.status(500).json({ error: 'Error al actualizar el usuario' });
  }
};

const eliminarUsuario = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const id = Number(req.query.id);
  try {
    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    if (id === req.user.id) {
      return res.status(409).json({ error: 'No se puede eliminar el usuario con el que se inició sesión' });
    }
    if (await Estudiante.count({ where: { usuarioId: id } }) > 0) {
      return res.status(409).json({
        error: 'El usuario está vinculado a un estudiante; desvincúlelo o desactive el usuario',
      });
    }
    if (await esUltimoAdministrador(usuario)) {
      return res.status(409).json({ error: 'No se puede eliminar al único administrador activo' });
    }

    await db.transaction(async (t) => {
      await Sesion.destroy({ where: { usuarioId: id }, transaction: t });
      await usuario.destroy({ transaction: t });
    });
    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar el usuario:', error);
    res.status(500).json({ error: 'Error al eliminar el usuario' });
  }
};

module.exports = {
  listarUsuarios,
  obtenerUsuarioPorId,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario,
};