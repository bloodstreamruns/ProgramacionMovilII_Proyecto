const db = require('../configuracion/db');
const { DataTypes } = require('sequelize');

const periodo = db.define('Periodo', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  periodoquecursa: {
    type: DataTypes.STRING(10),
    allowNull: false,
  },
  año: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  fechainicio: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  fechafin: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'periodos',
  timestamps: false, // Desactivar las columnas createdAt y updatedAt
});

module.exports = periodo;