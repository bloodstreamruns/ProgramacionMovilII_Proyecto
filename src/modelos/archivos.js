const { DataTypes } = require('sequelize');
const db = require('../configuracion/db');

const Archivo = db.define('Archivo', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nombre: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  nombreArchivo: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  ruta: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  tipoDocumento: {
    type: DataTypes.ENUM(
      'PDF',
      'Presentación',
      'Guía',
      'Word',
      'Otro'
    ),
    allowNull: false,
  },
  asignaturaId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  fechaSubida: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'archivos',
  timestamps: false,
});

module.exports = Archivo;
