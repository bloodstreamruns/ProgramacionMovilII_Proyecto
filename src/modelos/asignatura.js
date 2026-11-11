const db = require('../configuracion/db');
const { DataTypes } = require('sequelize');
const Carrera = require('./carreras');

const Asignatura = db.define('Asignatura', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  codigo: {
    type: DataTypes.STRING(15),
    allowNull: false,
    unique: true,
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  unidadesValorativas: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1, max: 10 },
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  estado: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  carreraId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Carrera,
      key: 'id',
    },
  },
}, {
  tableName: 'asignaturas',
  timestamps: false,
});

Asignatura.belongsTo(Carrera, { foreignKey: 'carreraId', as: 'carrera' });
Carrera.hasMany(Asignatura, { foreignKey: 'carreraId', as: 'asignaturas' });

module.exports = Asignatura;