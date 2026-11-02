const db = require('../configuracion/db');
const { DataTypes } = require('sequelize');
const argon2 = require('argon2');

const hashear = (valor) => argon2.hash(String(valor));

const Usuario = db.define('Usuario', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  correoElectronico: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  contrasena: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  pin: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  rol: {
    type: DataTypes.ENUM('administrador', 'estudiante'),
    allowNull: false,
    defaultValue: 'estudiante',
  },
  estado: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  intentosFallidos: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
}, {
  tableName: 'usuarios',
  timestamps: false,
  hooks: {
    beforeSave: async (usuario) => {
      if (usuario.changed('contrasena')) {
        usuario.contrasena = await hashear(usuario.contrasena);
      }
      if (usuario.pin && usuario.changed('pin')) {
        usuario.pin = await hashear(usuario.pin);
      }
    },
  },
});

Usuario.prototype.toJSON = function () {
  const datos = { ...this.get() };
  delete datos.contrasena;
  delete datos.pin;
  return datos;
};

module.exports = Usuario;