require('dotenv').config();

const passport = require('passport');
const jwt = require('jsonwebtoken');
const { Strategy: JwtStrategy } = require('passport-jwt');
const Usuario = require('../modelos/usuario');
const Sesion = require('../modelos/sesion');
const { extraerToken, hashToken } = require('../utilerias/autenticacion');

const { JWT_SECRET, JWT_EXPIRACION = '8h' } = process.env;

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET no está definido o es demasiado corto (mínimo 32 caracteres)');
}

const getToken = (payload) => jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRACION, algorithm: 'HS256' });

passport.use(new JwtStrategy(
  {
    jwtFromRequest: extraerToken,
    secretOrKey: JWT_SECRET,
    algorithms: ['HS256'],
    passReqToCallback: true,
  },
  async (req, payload, done) => {
    try {
      const tokenActual = extraerToken(req);
      const sesion = await Sesion.findOne({
        where: { usuarioId: payload.id, token: hashToken(tokenActual), estado: 'activa' },
      });

      if (!sesion) return done(null, false, { message: 'Sesión cerrada o no registrada. Inicie sesión nuevamente' });

      const usuario = await Usuario.findByPk(payload.id, {
        attributes: { exclude: ['contrasena', 'pin'] },
      });

      if (!usuario || !usuario.estado) return done(null, false, { message: 'Usuario no encontrado o inactivo' });

      return done(null, usuario);
    } catch (error) {
      return done(error, false);
    }
  }
));

const autenticar = passport.authenticate('jwt', { session: false });

const autorizar = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Token no proporcionado o inválido' });
  }

  if (!roles.includes(req.user.rol)) {
    return res.status(403).json({ error: 'No tiene permisos para realizar esta acción' });
  }
  next();
};

module.exports = { passport, getToken, autenticar, autorizar };