const db = require('../configuracion/db');
const { DataTypes } = require('sequelize');
const Usuario = require('./usuario');

const Sesion = db.define('Sesion', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  usuarioId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: Usuario, key: 'id' },
    onDelete: 'CASCADE',
  },
  token: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  ip: {
    type: DataTypes.STRING(45),
    allowNull: true,
  },
  estado: {
    type: DataTypes.ENUM('activa', 'cerrada', 'revocada', 'expirada'),
    allowNull: false,
    defaultValue: 'activa',
  },
  fechaInicio: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  fechaFin: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'sesiones',
  timestamps: false,
  indexes: [{ fields: ['token'] }],
});

Usuario.hasMany(Sesion, { foreignKey: 'usuarioId', as: 'sesiones' });
Sesion.belongsTo(Usuario, { foreignKey: 'usuarioId', as: 'usuario' });

module.exports = Sesion;