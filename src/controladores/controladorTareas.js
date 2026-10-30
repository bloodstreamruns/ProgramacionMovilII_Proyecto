const { validationResult } = require('express-validator');
const db = require('../configuracion/db');
const asignatura = require('../modelos/asignatura');
const Tareas = require('../modelos/tareas');

const listarTareasPorId = async (req, res) => {
    const { id } = req.params;
    try {
        const tarea = await Tareas.findByPk(id);
        if (!tarea) {
            return res.status(404).json({ mensaje: 'Tarea no encontrada' });
        }   
        res.status(200).json(tarea);
    }
    catch (error) {
        console.error('Error al obtener la tarea:', error);
        res.status(500).json({ mensaje: 'Error al obtener la tarea' });
    }
};

const obtenerTareas = async (req, res) => {
    try {
        const tareas = await Tareas.findAll();
        res.status(200).json(tareas);
    } catch (error) {
        console.error('Error al obtener las tareas:', error);
        res.status(500).json({ mensaje: 'Error al obtener las tareas' });
    }
};

const crearTarea = async (req, res) => {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
        return res.status(400).json({ errores: errores.array() });
    }
    try {
        const nuevaTarea = new Tareas(req.body);
        const tareaGuardada = await nuevaTarea.save();
        res.status(201).json(tareaGuardada);
    }
    catch (error) {
        console.error('Error al crear la tarea:', error);
        res.status(500).json({ mensaje: 'Error al crear la tarea' });
    }



};

const actualizarTarea = async (req, res) => {
    const { id } = req.params;
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
        return res.status(400).json({ errores: errores.array() });
    }
    try {
        const tarea = await Tareas.findByPk(id);
        if (!tarea) {
            return res.status(404).json({ mensaje: 'Tarea no encontrada' });
        }
        await tarea.update(req.body);
        res.status(200).json(tarea);
    }
    catch (error) {
        console.error('Error al actualizar la tarea:', error);
        res.status(500).json({ mensaje: 'Error al actualizar la tarea' });
    }
};

const eliminarTarea = async (req, res) => {
    const { id } = req.params;
    try {
        const tarea = await Tareas.findByPk(id);
        if (!tarea) {
            return res.status(404).json({ mensaje: 'Tarea no encontrada' });
        }
        await tarea.destroy();
        res.status(200).json({ mensaje: 'Tarea eliminada correctamente' });
    }
    catch (error) {
        console.error('Error al eliminar la tarea:', error);
        res.status(500).json({ mensaje: 'Error al eliminar la tarea' });
    }   

};

module.exports = {
    crearTarea,
    obtenerTareas,
    listarTareasPorId,
    actualizarTarea,
    eliminarTarea
};