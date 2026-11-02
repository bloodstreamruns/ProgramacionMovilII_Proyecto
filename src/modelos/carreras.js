const db = require('../configuracion/db');
const { DataTypes } = require('sequelize');

const Carrera = db.define('Carrera', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  codigo: {
    type: DataTypes.STRING(10),
    allowNull: false,
    unique: true,
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  grado: {
    type: DataTypes.ENUM('Licenciatura', 'Maestría', 'Doctorado'),
    allowNull: false,
  },
  estado: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
}, {
  tableName: 'carreras',
  timestamps: false,
});

module.exports = Carrera;