const { HOST_DB, USUARIO_DB, CONTRASENA_DB, NOMBRE_DB, PORT_DB } = process.env;
const Sequelize = require('sequelize');

const db = new Sequelize(NOMBRE_DB, USUARIO_DB, CONTRASENA_DB, {
  host: HOST_DB,
  port: PORT_DB,
  dialect: 'mysql',
  logging: false,
});

module.exports = db;