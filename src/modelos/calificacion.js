const db = require('../configuraciones/db');
const { DataTypes } = require('sequelize');
const Asignatura = require('./asignatura');
const Periodo = require('./periodo');

const Calificacion = db.define('Calificacion', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre: { type: DataTypes.STRING(120), allowNull: false },
  tipo: {
    type: DataTypes.ENUM('Tarea', 'Examen', 'Prueba', 'Proyecto', 'Practica', 'Exposicion', 'Participacion', 'Otro'),
    allowNull: false
  },
  nota: { type: DataTypes.DECIMAL(6, 2), allowNull: false, validate: { min: 0 } },
  notaMaxima: { type: DataTypes.DECIMAL(6, 2), allowNull: false, defaultValue: 100, validate: { min: 0.01 } },
  fecha: { type: DataTypes.DATEONLY, allowNull: true },
  observacion: { type: DataTypes.TEXT, allowNull: true },
  asignaturaId: {
    type: DataTypes.INTEGER, allowNull: false,
    references: { model: Asignatura, key: 'id' }
  },
  periodoId: {
    type: DataTypes.INTEGER, allowNull: false,
    references: { model: Periodo, key: 'id' }
  }
}, {
  tableName: 'calificaciones',
  timestamps: true
});

Calificacion.belongsTo(Asignatura, { foreignKey: 'asignaturaId', as: 'asignatura' });
Asignatura.hasMany(Calificacion, { foreignKey: 'asignaturaId', as: 'calificaciones' });
Calificacion.belongsTo(Periodo, { foreignKey: 'periodoId', as: 'periodo' });
Periodo.hasMany(Calificacion, { foreignKey: 'periodoId', as: 'calificaciones' });

module.exports = Calificacion;
