const { validationResult } = require('express-validator');
const db = require('../configuracion/db');
const Periodo = require('../modelos/periodo');

const crearPeriodo = async (req, res) => {
  const errores = validationResult(req);
    if (!errores.isEmpty()) {
        return res.status(400).json({ errores: errores.array() });
    }
    try {
        const nuevoPeriodo = new Periodo(req.body);
        const periodoGuardado = await nuevoPeriodo.save();
        res.status(201).json(periodoGuardado);
    } catch (error) {
        console.error('Error al crear el periodo:', error);
        res.status(500).json({ mensaje: 'Error al crear el periodo' });
    }
     
};

const obtenerPeriodos = async (req, res) => {
    try {
        const periodos = await Periodo.findAll();
        res.status(200).json(periodos);
    } catch (error) {
        console.error('Error al obtener los periodos:', error);
        res.status(500).json({ mensaje: 'Error al obtener los periodos' });
    }
    
};

const listarPeriodoPorId = async (req, res) => {
    const { id } = req.params;
    try {
        const periodo = await Periodo.findByPk(id);
        if (!periodo) {
            return res.status(404).json({ mensaje: 'Periodo no encontrado' });
        }
        res.status(200).json(periodo);
    } catch (error) {
        console.error('Error al obtener el periodo:', error);
        res.status(500).json({ mensaje: 'Error al obtener el periodo' });
    }
};

const actualizarPeriodo = async (req, res) => {
    const { id } = req.params;
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
        return res.status(400).json({ errores: errores.array() });
    }
    try {
        const periodo = await Periodo.findByPk(id);
        if (!periodo) {
            return res.status(404).json({ mensaje: 'Periodo no encontrado' });
        }
        await periodo.update(req.body);
        res.status(200).json(periodo);
    } catch (error) {
        console.error('Error al actualizar el periodo:', error);
        res.status(500).json({ mensaje: 'Error al actualizar el periodo' });
    }
};

const eliminarPeriodo = async (req, res) => {
    const { id } = req.params;
    try {
        const periodo = await Periodo.findByPk(id);
        if (!periodo) {
            return res.status(404).json({ mensaje: 'Periodo no encontrado' });
        }
        await periodo.destroy();
        res.status(200).json({ mensaje: 'Periodo eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar el periodo:', error);
        res.status(500).json({ mensaje: 'Error al eliminar el periodo' });
    }
};

module.exports = {
    crearPeriodo,
    obtenerPeriodos,
    listarPeriodoPorId,
    actualizarPeriodo,
    eliminarPeriodo,
};