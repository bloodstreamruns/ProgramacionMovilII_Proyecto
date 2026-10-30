const { validationResult } = require('express-validator');
const db = require('../configuracion/db');
const Horarrio = require('../modelos/periodo');



const listarHorarioPorId = async (req, res) => {
    const { id } = req.params;
    try {
        const horario = await Horarrio.findByPk(id);
        if (!horario) {
            return res.status(404).json({ mensaje: 'Horario no encontrado' });
        }
        res.status(200).json(horario);
    }
    catch (error) {
        console.error('Error al obtener el horario:', error);
        res.status(500).json({ mensaje: 'Error al obtener el horario' });
    }
};

const crearHorario = async (req, res) => {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
        return res.status(400).json({ errores: errores.array() });
    }
    try {
        const nuevoHorario = new Horarrio(req.body);
        const horarioGuardado = await nuevoHorario.save();
        res.status(201).json(horarioGuardado);
    }
    catch (error) {
        console.error('Error al crear el horario:', error);
        res.status(500).json({ mensaje: 'Error al crear el horario' });
    }   



};
const obtenerHorarios = async (req, res) => {
    try {
        const horarios = await Horarrio.findAll();
        res.status(200).json(horarios);
    } catch (error) {
        console.error('Error al obtener los horarios:', error);
        res.status(500).json({ mensaje: 'Error al obtener los horarios' });
    }
};

const actualizarHorario = async (req, res) => {
    const { id } = req.params;
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
        return res.status(400).json({ errores: errores.array() });
    }
    try {
        const horario = await Horarrio.findByPk(id);
        if (!horario) {
            return res.status(404).json({ mensaje: 'Horario no encontrado' });
        }
        await horario.update(req.body);
        res.status(200).json(horario);
    }
    catch (error) {
        console.error('Error al actualizar el horario:', error);
        res.status(500).json({ mensaje: 'Error al actualizar el horario' });
    }
};

const eliminarHorario = async (req, res) => {
    const { id } = req.params;
    try {
        const horario = await Horarrio.findByPk(id);
        if (!horario) {
            return res.status(404).json({ mensaje: 'Horario no encontrado' });
        }
        await horario.destroy();
        res.status(200).json({ mensaje: 'Horario eliminado correctamente' });
    }
    catch (error) {
        console.error('Error al eliminar el horario:', error);
        res.status(500).json({ mensaje: 'Error al eliminar el horario' });
    }


};

module.exports = {
    crearHorario,
    obtenerHorarios,
    listarHorarioPorId,
    actualizarHorario,
    eliminarHorario
};

