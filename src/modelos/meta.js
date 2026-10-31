const db = require('../configuracion/db');
const { DataTypes } = require('sequelize');
const moment = require('moment');
const Estudiante = require('./estudiante');
const Asignatura = require('./asignatura');

const ESTADOS = ['Pendiente', 'En progreso', 'Cumplida', 'Cancelada'];
const ESTADOS_ACTIVOS = ['Pendiente', 'En progreso'];

const Meta = db.define('Meta', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  titulo: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  fechaInicio: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  fechaLimite: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  valorObjetivo: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1 },
  },
  valorActual: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: { min: 0 },
  },
  unidad: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'unidades',
  },
  estado: {
    type: DataTypes.ENUM(...ESTADOS),
    allowNull: false,
    defaultValue: 'Pendiente',
  },
  estudianteId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Estudiante,
      key: 'id',
    },
  },
  asignaturaId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Asignatura,
      key: 'id',
    },
  },
  porcentaje: {
    type: DataTypes.VIRTUAL,
    get() {
      return Math.min(100, Math.round((this.valorActual / this.valorObjetivo) * 100));
    },
  },
  vencida: {
    type: DataTypes.VIRTUAL,
    get() {
      return ESTADOS_ACTIVOS.includes(this.estado) && this.fechaLimite < moment().format('YYYY-MM-DD');
    },
  },
}, {
  tableName: 'metas_academicas',
  timestamps: false,
});

Meta.ESTADOS = ESTADOS;
Meta.ESTADOS_ACTIVOS = ESTADOS_ACTIVOS;

Meta.calcularEstado = (valorActual, valorObjetivo, estadoActual = null) => {
  if (estadoActual === 'Cancelada') return 'Cancelada';
  if (valorActual >= valorObjetivo) return 'Cumplida';
  if (valorActual > 0) return 'En progreso';
  return 'Pendiente';
};

Meta.belongsTo(Estudiante, { foreignKey: 'estudianteId', as: 'estudiante', onDelete: 'CASCADE' });
Estudiante.hasMany(Meta, { foreignKey: 'estudianteId', as: 'metas', onDelete: 'CASCADE' });
Meta.belongsTo(Asignatura, { foreignKey: 'asignaturaId', as: 'asignatura', onDelete: 'SET NULL' });
Asignatura.hasMany(Meta, { foreignKey: 'asignaturaId', as: 'metas', onDelete: 'SET NULL' });

module.exports = Meta;