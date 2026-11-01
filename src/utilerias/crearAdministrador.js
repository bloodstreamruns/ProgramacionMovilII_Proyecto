require('dotenv').config();
const argon2 = require('argon2');
const db = require('../configuraciones/db');
const Usuario = require('../modelos/usuario');
require('../modelos/sesion');
require('../modelos/estudiante');

const { ADMIN_NOMBRE, ADMIN_CORREO, ADMIN_CONTRASENA, ADMIN_PIN } = process.env;

const crearAdministrador = async () => {
  if (!ADMIN_NOMBRE || !ADMIN_CORREO || !ADMIN_CONTRASENA || !ADMIN_PIN) {
    throw new Error('Defina ADMIN_NOMBRE, ADMIN_CORREO, ADMIN_CONTRASENA y ADMIN_PIN en el archivo .env');
  }

  await db.authenticate();

  const existente = await Usuario.findOne({ where: { rol: 'administrador' } });
  if (existente) {
    console.log(`Ya existe un administrador: ${existente.nombre}`);
    return;
  }

  await Usuario.create({
    nombre: ADMIN_NOMBRE,
    correoElectronico: ADMIN_CORREO,
    contrasena: await argon2.hash(ADMIN_CONTRASENA),
    pin: await argon2.hash(ADMIN_PIN),
    rol: 'administrador',
  });
  console.log('Administrador creado correctamente');
};

crearAdministrador()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => db.close());