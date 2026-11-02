const db = require('../configuracion/db.js');
const {DataTypes} = require('sequelize');

const matricula = db.define('matricula', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    estudiante_id:{
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    asignatura_id:{
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    periodo:{
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    estado:{
        type: DataTypes.ENUM(
        'pendiente',
        'encurso',
        'aprobada',
        'reprobada',
        ),
        allowNull: false,
        defaultValue: 'pendiente'
    },
    },{
        tableName: 'matriculas',
        timestamps: false,
    });

module.exports = matricula;