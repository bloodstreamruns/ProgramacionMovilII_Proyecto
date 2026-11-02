const db = require('../configuraciones/db');
const { DataTypes } = require('sequelize');
const Carrera = require('./carreras');
const Usuario = require('./usuario');

const Estudiante = db.define('Estudiante', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  identidad: {
    type: DataTypes.STRING(13),
    allowNull: false,
    unique: true,
  },
  cuenta: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
  },
  primerNombre: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  segundoNombre: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  primerApellido: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  segundoApellido: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  correoElectronico: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  estado: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  imagen: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  imagenUrl: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.imagen ? `/api/imagenes/${this.imagen}` : null;
    },
  },
  carreraId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Carrera,
      key: 'id',
    },
  },
  usuarioId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    unique: true,
    references: {
      model: Usuario,
      key: 'id',
    },
  },
}, {
  tableName: 'estudiantes',
  timestamps: false,
});

Estudiante.belongsTo(Usuario, { foreignKey: 'usuarioId', as: 'usuario', onDelete: 'RESTRICT' });
Usuario.hasOne(Estudiante, { foreignKey: 'usuarioId', as: 'estudiante' });
Estudiante.belongsTo(Carrera, { foreignKey: 'carreraId', as: 'carrera' });
Carrera.hasMany(Estudiante, { foreignKey: 'carreraId', as: 'estudiantes' });


module.exports = Estudiante;