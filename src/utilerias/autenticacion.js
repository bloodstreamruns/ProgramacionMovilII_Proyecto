const crypto = require('crypto');
const { ExtractJwt } = require('passport-jwt');

const extraerToken = ExtractJwt.fromAuthHeaderAsBearerToken();

const obtenerTokenDeRequest = (req) => extraerToken(req);

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

module.exports = { extraerToken, obtenerTokenDeRequest, hashToken };