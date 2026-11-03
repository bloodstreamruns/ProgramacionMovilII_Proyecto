const { validationResult } = require('express-validator');
const argon2 = require('argon2');
const db = require('../configuracion/db');
const Usuario = require('../modelos/usuario');
const Sesion = require('../modelos/sesion');
const { getToken } = require('../configuracion/passport');
const { hashToken, obtenerTokenDeRequest } = require('../utilerias/autenticacion');

// Iniciar sesión con correo/nombre y contraseña o pin
const iniciarSesion = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { usuario: identificador, contrasena, pin } = req.body;

  try {
    // Buscar usuario por correo electrónico o por nombre
    const usuarioEncontrado = await Usuario.findOne({
      where: identificador.includes('@')
        ? { correoElectronico: identificador }
        : { nombre: identificador },
    });

    if (!usuarioEncontrado) {
      return res.status(401).json({
        error: 'Credenciales inválidas',
        codigo: 'CREDENCIALES_INVALIDAS',
      });
    }

    // Verificar si el usuario está activo
    if (usuarioEncontrado.estado === false || usuarioEncontrado.estado === 0) {
      return res.status(403).json({
        error: 'El usuario se encuentra inactivo o deshabilitado',
        codigo: 'USUARIO_INACTIVO',
      });
    }

    let credencialesValidas = false;

    // Verificar contraseña si fue enviada (solo Argon2)
    if (contrasena && usuarioEncontrado.contrasena) {
      credencialesValidas = await argon2.verify(usuarioEncontrado.contrasena, contrasena);
    }

    // Si no fue válida con contraseña o se envió pin, verificar PIN (solo Argon2)
    if (!credencialesValidas && pin && usuarioEncontrado.pin) {
      credencialesValidas = await argon2.verify(usuarioEncontrado.pin, pin);
    }

    if (!credencialesValidas) {
      // Incrementar intentos fallidos
      usuarioEncontrado.intentosFallidos = (usuarioEncontrado.intentosFallidos || 0) + 1;
      await usuarioEncontrado.save();

      return res.status(401).json({
        error: 'Credenciales inválidas',
        codigo: 'CREDENCIALES_INVALIDAS',
      });
    }

    // Reiniciar intentos fallidos al tener éxito
    if (usuarioEncontrado.intentosFallidos > 0) {
      usuarioEncontrado.intentosFallidos = 0;
      await usuarioEncontrado.save();
    }

    // Generar token JWT con Passport/jsonwebtoken
    const payload = {
      id: usuarioEncontrado.id,
      nombre: usuarioEncontrado.nombre,
      correoElectronico: usuarioEncontrado.correoElectronico,
      rol: usuarioEncontrado.rol,
    };

    const token = getToken(payload);

    // Registrar la sesión: cierra las anteriores y crea la nueva en una sola transacción
    await db.transaction(async (t) => {
      await Sesion.update(
        { estado: 'cerrada', fechaFin: new Date() },
        { where: { usuarioId: usuarioEncontrado.id, estado: 'activa' }, transaction: t }
      );
      await Sesion.create({
        usuarioId: usuarioEncontrado.id,
        token: hashToken(token),
        ip: req.ip || req.connection?.remoteAddress || '127.0.0.1',
        fechaInicio: new Date(),
        estado: 'activa',
      }, { transaction: t });
    });

    return res.json({
      mensaje: 'Inicio de sesión exitoso',
      token,
      usuario: payload,
    });
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    return res.status(500).json({ error: 'Error interno al procesar el inicio de sesión' });
  }
};

// Cerrar sesión: invalida el token actual (o todas las sesiones del usuario con ?todas=true)
const cerrarSesion = async (req, res) => {
  try {
    const where = { usuarioId: req.user.id, estado: 'activa' };
    if (req.query.todas !== 'true') {
      where.token = hashToken(obtenerTokenDeRequest(req));
    }

    const [cerradas] = await Sesion.update(
      { estado: req.query.todas === 'true' ? 'revocada' : 'cerrada', fechaFin: new Date() },
      { where }
    );

    if (cerradas === 0) {
      return res.status(404).json({ error: 'No se encontró una sesión activa para cerrar' });
    }

    return res.json({
      mensaje: req.query.todas === 'true'
        ? `Se cerraron ${cerradas} sesión(es)`
        : 'Sesión cerrada correctamente',
    });
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
    return res.status(500).json({ error: 'Error interno al cerrar la sesión' });
  }
};

// Obtener perfil del usuario actualmente autenticado
const obtenerPerfil = async (req, res) => {
  try {
    res.json({
      mensaje: 'Usuario autenticado correctamente con Passport',
      usuario: req.user,
    });
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
};

// Cambiar la contraseña del usuario autenticado y revocar todas sus sesiones activas
const cambiarContrasena = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { contrasenaActual, contrasenaNueva } = req.body;

  try {
    // req.user no incluye la contraseña (Passport la excluye), por eso se consulta de nuevo
    const usuario = await Usuario.findByPk(req.user.id);
    const actualValida = usuario?.contrasena
      && await argon2.verify(usuario.contrasena, contrasenaActual).catch(() => false);

    if (!actualValida) {
      return res.status(400).json({
        error: 'La contraseña actual es incorrecta',
        codigo: 'CONTRASENA_INCORRECTA',
      });
    }

    await db.transaction(async (t) => {
      usuario.contrasena = contrasenaNueva; // el hook beforeSave la hashea
      await usuario.save({ transaction: t });
      await Sesion.update(
        { estado: 'revocada', fechaFin: new Date() },
        { where: { usuarioId: usuario.id, estado: 'activa' }, transaction: t }
      );
    });

    return res.json({ mensaje: 'Contraseña actualizada. Inicie sesión nuevamente' });
  } catch (error) {
    console.error('Error al cambiar la contraseña:', error);
    return res.status(500).json({ error: 'Error interno al cambiar la contraseña' });
  }
};

module.exports = {
  iniciarSesion,
  obtenerPerfil,
  cerrarSesion,
  cambiarContrasena,
};