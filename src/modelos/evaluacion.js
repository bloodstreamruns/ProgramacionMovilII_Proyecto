const db = require('../configuracion/db');
const { DataTypes } = require('sequelize');
const Asignatura = require('./asignatura');
const Periodo = require('./periodo');

const TIPOS = ['Examen', 'Prueba', 'Tarea', 'Exposicion', 'Proyecto', 'Practica', 'Otro'];
const ESTADOS = ['Pendiente', 'Realizada', 'Cancelada'];

const Evaluacion = db.define('Evaluacion', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  titulo: { type: DataTypes.STRING(150), allowNull: false },
  descripcion: { type: DataTypes.TEXT, allowNull: true },
  tipo: { type: DataTypes.ENUM(...TIPOS), allowNull: false },
  fecha: { type: DataTypes.DATE, allowNull: false },
  hora: { type: DataTypes.STRING(5), allowNull: true },
  lugar: { type: DataTypes.STRING(120), allowNull: true },
  valor: { type: DataTypes.DECIMAL(6, 2), allowNull: true, validate: { min: 0 } },
  estado: { type: DataTypes.ENUM(...ESTADOS), allowNull: false, defaultValue: 'Pendiente' },
  asignaturaId: {
    type: DataTypes.INTEGER, allowNull: false,
    references: { model: Asignatura, key: 'id' }
  },
  periodoId: {
    type: DataTypes.INTEGER, allowNull: false,
    references: { model: Periodo, key: 'id' }
  }
}, {
  tableName: 'evaluaciones',
  timestamps: true
});

Evaluacion.TIPOS = TIPOS;
Evaluacion.ESTADOS = ESTADOS;
Evaluacion.belongsTo(Asignatura, { foreignKey: 'asignaturaId', as: 'asignatura' });
Asignatura.hasMany(Evaluacion, { foreignKey: 'asignaturaId', as: 'evaluaciones' });
Evaluacion.belongsTo(Periodo, { foreignKey: 'periodoId', as: 'periodo' });
Periodo.hasMany(Evaluacion, { foreignKey: 'periodoId', as: 'evaluaciones' });

module.exports = Evaluacion;
