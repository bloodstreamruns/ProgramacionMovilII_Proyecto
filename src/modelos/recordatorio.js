const db = require('../configuracion/db');
const { DataTypes } = require('sequelize');
const Evento = require('./evento');

const Recordatorio = db.define('Recordatorio', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  eventoId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Evento,
      key: 'id',
    },
  },
  minutosAntes: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 0 },
  },
  fechaAviso: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  notificado: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
}, {
  tableName: 'recordatorios',
  timestamps: false,
  indexes: [
    { name: 'uq_recordatorio_evento_minutos', unique: true, fields: ['eventoId', 'minutosAntes'] },
    { name: 'idx_recordatorio_pendientes', fields: ['notificado', 'fechaAviso'] },
  ],
});

Recordatorio.calcularAviso = (fechaInicio, minutosAntes) =>
  new Date(new Date(fechaInicio).getTime() - minutosAntes * 60 * 1000);

Evento.hasMany(Recordatorio, { foreignKey: 'eventoId', as: 'recordatorios', onDelete: 'CASCADE' });
Recordatorio.belongsTo(Evento, { foreignKey: 'eventoId', as: 'evento', onDelete: 'CASCADE' });

module.exports = Recordatorio;