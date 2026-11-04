const db = require('../configuracion/db');
const { DataTypes } = require('sequelize');

const Tareas = db.define('Tareas', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  fechaEntrega: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  prioridad: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  descripcion: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  estado: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
}, {
  tableName: 'tareas',
  timestamps: false, // Desactivar las columnas createdAt y updatedAt
});

module.exports = Tareas;