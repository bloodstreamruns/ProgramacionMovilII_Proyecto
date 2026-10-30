const db = require('../configuracion/db');
const { DataTypes } = require('sequelize');

const periodo = db.define('Periodo', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  dias: {
    type: DataTypes.STRING(10),
    allowNull: false,
    unique: true,
  },
  horas: {
    type: DataTypes.STRING(10),
    allowNull: false,
    unique: true,
  },
  aulas: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
  },
  asignatura: {
    type: DataTypes.STRING(10),
    allowNull: false,
    unique: true,
  },
  
}, {
  tableName: 'periodos',
  timestamps: false, // Desactivar las columnas createdAt y updatedAt
});

module.exports = horario;