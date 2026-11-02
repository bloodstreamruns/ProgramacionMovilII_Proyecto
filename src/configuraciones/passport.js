const passport = require('passport');
const jwt = require('jsonwebtoken');
const { Strategy: JwtStrategy } = require('passport-jwt');
const Usuario = require('../modelos/usuario');
const Sesion = require('../modelos/sesion');
const { extraerToken, hashToken } = require('../utilerias/autenticacion');

const { JWT_SECRET, JWT_EXPIRACION = '8h' } = process.env;

const getToken = (payload) => jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRACION });

passport.use(new JwtStrategy(
  { jwtFromRequest: extraerToken, secretOrKey: JWT_SECRET, passReqToCallback: true },
  async (req, payload, done) => {
    try {
      const sesion = await Sesion.findOne({
        where: { usuarioId: payload.id, token: hashToken(extraerToken(req)), estado: 'activa' },
      });
      if (!sesion) return done(null, false);

      const usuario = await Usuario.findByPk(payload.id, {
        attributes: { exclude: ['contrasena', 'pin'] },
      });
      if (!usuario || !usuario.estado) return done(null, false);

      return done(null, usuario);
    } catch (error) {
      return done(error, false);
    }
  }
));

const autenticar = passport.authenticate('jwt', { session: false });

const autorizar = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.rol)) {
    return res.status(403).json({ error: 'No tiene permisos para realizar esta acción' });
  }
  next();
};

module.exports = { passport, getToken, autenticar, autorizar };