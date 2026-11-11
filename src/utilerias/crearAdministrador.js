require('dotenv').config();
const db = require('../configuracion/db');
const Usuario = require('../modelos/usuario');
const Sesion = require('../modelos/sesion');
require('../modelos/estudiante');

const {
  ADMIN_NOMBRE,
  ADMIN_CORREO,
  ADMIN_CONTRASENA,
  ADMIN_REINICIAR_CREDENCIALES,
} = process.env;

const crearAdministrador = async () => {
  if (!ADMIN_NOMBRE || !ADMIN_CORREO || !ADMIN_CONTRASENA) {
    throw new Error('Defina ADMIN_NOMBRE, ADMIN_CORREO y ADMIN_CONTRASENA en el archivo .env');
  }

  await db.authenticate();

  const existente = await Usuario.findOne({ where: { rol: 'administrador' } });
  if (existente) {
    if (ADMIN_REINICIAR_CREDENCIALES === 'true') {
      const administrador = await Usuario.findOne({
        where: { correoElectronico: ADMIN_CORREO, rol: 'administrador' },
      });
      if (!administrador) {
        throw new Error('No se encontró un administrador con ADMIN_CORREO; no se modificó ninguna cuenta');
      }

      await db.transaction(async (transaction) => {
        await administrador.update({
          contrasena: ADMIN_CONTRASENA,
          intentosFallidos: 0,
        }, { transaction });
        await Sesion.update(
          { estado: 'revocada', fechaFin: new Date() },
          { where: { usuarioId: administrador.id, estado: 'activa' }, transaction }
        );
      });
      console.log(`Credenciales restablecidas para: ${administrador.correoElectronico}`);
      return;
    }

    console.log(`Ya existe un administrador: ${existente.nombre}`);
    return;
  }

  await Usuario.create({
    nombre: ADMIN_NOMBRE,
    correoElectronico: ADMIN_CORREO,
    contrasena: ADMIN_CONTRASENA,
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