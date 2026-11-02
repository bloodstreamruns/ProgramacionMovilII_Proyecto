require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const path = require('path');
const rutas = require('./index');
const { passport } = require('./configuraciones/passport');
const swaggerSetup = require('./configuraciones/swaggers');

const app = express();
const port = process.env.PORT || 3001;

app.use(morgan('common'));
app.use(express.json());
app.use(passport.initialize());
app.use('/api/imagenes', express.static(path.join(__dirname, '../public/img')));
app.use('/api', rutas);
swaggerSetup(app);

app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Error interno del servidor' });
});

app.listen(port, () => {
  console.log(`El servidor está corriendo en http://localhost:${port}`);
});