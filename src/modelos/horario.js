const db = require('../configuracion/db');
const { DataTypes } = require('sequelize');

const horario = db.define('Horario', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  dias: {
    type: DataTypes.STRING(10),
    allowNull: false,
  },
  horas: {
    type: DataTypes.STRING(10),
    allowNull: false,
  },
  aulas: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  asignatura: {
    type: DataTypes.STRING(10),
    allowNull: false,
  },
}, {
  tableName: 'horarios',
  timestamps: false, // Desactivar las columnas createdAt y updatedAt
});

module.exports = horario;