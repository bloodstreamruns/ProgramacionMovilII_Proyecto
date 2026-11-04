const { validationResult } = require('express-validator');
const argon2 = require('argon2');
const Usuario = require('../modelos/usuario');
const Sesion = require('../modelos/sesion');
const { getToken } = require('../configuracion/passport');
const { hashToken, obtenerTokenDeRequest } = require('../utilerias/autenticacion');
const { enviarCorreo } = require('../configuracion/correo');

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

    // Verificar contraseña si fue enviada
    if (contrasena && usuarioEncontrado.contrasena) {
      try {
        credencialesValidas = await argon2.verify(usuarioEncontrado.contrasena, contrasena);
      } catch (e) {
        // Fallback si la contraseña estuviera almacenada en texto plano
        credencialesValidas = usuarioEncontrado.contrasena === contrasena;
      }
    }

    // Si no fue válida con contraseña o se envió pin, verificar PIN
    if (!credencialesValidas && pin && usuarioEncontrado.pin) {
      try {
        credencialesValidas = await argon2.verify(usuarioEncontrado.pin, pin);
      } catch (e) {
        credencialesValidas = usuarioEncontrado.pin === pin;
      }
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

    // Registrar sesión en base de datos
    try {
      await Sesion.update(
        { estado: 'cerrada', fechaFin: new Date() },
        { where: { usuarioId: usuarioEncontrado.id, estado: 'activa' } }
      );

      await Sesion.create({
        usuarioId: usuarioEncontrado.id,
        token: hashToken(token),
        ip: req.ip || req.connection?.remoteAddress || '127.0.0.1',
        fechaInicio: new Date(),
        estado: 'activa',
      });
    } catch (sesionError) {
      console.warn('Aviso: No se pudo registrar la sesión en la base de datos:', sesionError.message);
    }

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
    const esTodas = req.query.todas === 'true';
    const where = { usuarioId: req.user.id, estado: 'activa' };
    
    if (!esTodas) {
      where.token = hashToken(obtenerTokenDeRequest(req));
    }

    const [cerradas] = await Sesion.update(
      { estado: esTodas ? 'revocada' : 'cerrada', fechaFin: new Date() },
      { where }
    );

    if (cerradas === 0) {
      return res.status(404).json({ error: 'No se encontró una sesión activa para cerrar' });
    }

    return res.json({
      mensaje: esTodas
        ? `Se cerraron ${cerradas} sesión(es) correctamente`
        : 'Sesión cerrada correctamente',
    });
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
    return res.status(500).json({ error: 'Error interno al cerrar la sesión' });
  }
};

// Generar un token de prueba (útil para pruebas en Swagger y Postman)
const generarTokenPrueba = async (req, res) => {
  const { id = 1, nombre = 'UsuarioPrueba', rol = 'administrador' } = req.body || {};
  try {
    const payload = { id, nombre, rol };
    const token = getToken(payload);
    res.json({
      mensaje: 'Token de prueba generado correctamente',
      token,
      datos: payload,
      instrucciones: 'Use este token en la cabecera: Authorization: Bearer ' + token,
    });
  } catch (error) {
    console.error('Error al generar token de prueba:', error);
    res.status(500).json({ error: 'Error al generar token de prueba' });
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

// Enviar un PIN temporal al usuario
const enviarPin = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { usuario: identificador } = req.body;

  try {
    const usuarioEncontrado = await Usuario.findOne({
      where: identificador.includes('@')
        ? { correoElectronico: identificador }
        : { nombre: identificador },
    });

    if (!usuarioEncontrado) {
      return res.status(404).json({
        error: 'Usuario no encontrado',
        codigo: 'USUARIO_NO_ENCONTRADO',
      });
    }

    // Generar PIN temporal de 6 dígitos
    const pinTemporal = Math.floor(100000 + Math.random() * 900000).toString();

    // Guardar el hash del PIN temporal en la base de datos
    usuarioEncontrado.pin = await argon2.hash(pinTemporal);
    await usuarioEncontrado.save();

    // Enviar el PIN por correo electrónico esperando la promesa
    await enviarCorreo(
      usuarioEncontrado.correoElectronico,
      'Su PIN temporal de autenticación',
      `Hola ${usuarioEncontrado.nombre},\n\nSu PIN temporal es: ${pinTemporal}\n\nEste PIN le permitirá iniciar sesión o restablecer su clave.`
    );

    return res.json({
      mensaje: 'PIN temporal enviado correctamente',
      instrucciones: 'Revise su correo electrónico para obtener el PIN',
    });
  } catch (error) {
    console.error('Error al enviar PIN:', error);
    return res.status(500).json({ error: 'Error al enviar el PIN por correo electrónico' });
  }
};

// Actualizar la contraseña del usuario autenticado
const actualizarContrasena = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { usuario: identificador, nuevaContrasena, pin } = req.body;

  try {
    // req.user proviene del middleware de autenticación (passport)
    const usuarioEncontrado = await Usuario.findOne({
      where: { login: identificador, correoElectronico: identificador },
    });

    if (!usuarioEncontrado) {
      return res.status(404).json({
        error: 'Usuario no encontrado',
        codigo: 'USUARIO_NO_ENCONTRADO',
      });
    }

    // Verificar la contraseña actual con argon2
    let pinValido = false;
    try {
      pinValido = await argon2.verify(usuarioEncontrado.pin, pin);
    } catch (e) {
      pinValido = usuarioEncontrado.pin === pin;
    }

    if (!pinValido) {
      return res.status(400).json({
        error: 'El PIN es incorrecto',
        codigo: 'PIN_INCORRECTO',
      });
    }

    // Actualizar con la nueva contraseña encriptada
    usuarioEncontrado.contrasena = await argon2.hash(nuevaContrasena);
    await usuarioEncontrado.save();

    return res.json({
      mensaje: 'Contraseña actualizada correctamente',
    });
  } catch (error) {
    console.error('Error al actualizar contraseña:', error);
    return res.status(500).json({ error: 'Error al actualizar la contraseña' });
  }
};

module.exports = {
  iniciarSesion,
  cerrarSesion,
  generarTokenPrueba,
  obtenerPerfil,
  enviarPin,
  actualizarContrasena,
};