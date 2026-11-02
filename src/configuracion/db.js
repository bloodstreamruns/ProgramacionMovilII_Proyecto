const { HOST_DB, USUARIO_DB, CONTRASENA_DB, NOMBRE_DB, PORT_DB } = process.env;
const sequelize = require('sequelize');

const db = new sequelize(NOMBRE_DB, USUARIO_DB, CONTRASENA_DB, {
  host: HOST_DB,
  port: PORT_DB,
  dialect: 'mysql',
  logging: true, // Desactivar el registro de consultas SQL
});

db.authenticate()
  .then(() => {
    console.log('Conexión a la base de datos establecida correctamente.');
    db.sync({ alter: true }) // Sincroniza los modelos con la base de datos
      .then(() => {
        console.log('Modelos sincronizados con la base de datos.');
      })
      .catch((error) => {
        console.error('Error al sincronizar los modelos con la base de datos:', error);
      });
  })
  .catch((error) => {
    console.error('Error al conectar a la base de datos:', error);
  });

module.exports = db;