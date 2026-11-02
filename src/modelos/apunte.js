const { DataTypes } = require('sequelize');
const db = require('../configuracion/db');

const Apunte = db.define('Apunte', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  titulo: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  contenido: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  asignaturaId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  tableName: 'apuntes',
  timestamps: false,
});

module.exports = Apunte;
