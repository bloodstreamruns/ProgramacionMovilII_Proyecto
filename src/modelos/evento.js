const db = require('../configuracion/db');
const { DataTypes } = require('sequelize');
const Estudiante = require('./estudiante');
const Asignatura = require('./asignatura');

const TIPOS = ['Aviso personal', 'Reunión académica', 'Tutoría', 'Fecha importante'];
const ESTADOS = ['Pendiente', 'Completado', 'Cancelado'];

const Evento = db.define('Evento', {
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
  tipo: {
    type: DataTypes.ENUM(...TIPOS),
    allowNull: false,
  },
  fechaInicio: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  fechaFin: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  lugar: {
    type: DataTypes.STRING(150),
    allowNull: true,
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
}, {
  tableName: 'eventos',
  timestamps: false,
});

Evento.TIPOS = TIPOS;
Evento.ESTADOS = ESTADOS;

Evento.belongsTo(Estudiante, { foreignKey: 'estudianteId', as: 'estudiante', onDelete: 'CASCADE' });
Estudiante.hasMany(Evento, { foreignKey: 'estudianteId', as: 'eventos', onDelete: 'CASCADE' });
Evento.belongsTo(Asignatura, { foreignKey: 'asignaturaId', as: 'asignatura', onDelete: 'SET NULL' });
Asignatura.hasMany(Evento, { foreignKey: 'asignaturaId', as: 'eventos', onDelete: 'SET NULL' });

module.exports = Evento;