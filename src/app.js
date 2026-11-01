require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const path = require('path');
const rutas = require('./index');

const app = express();
const port = process.env.PORT || 3001;

app.use(morgan('common'));
app.use(express.json());
app.use('/api/imagenes', express.static(path.join(__dirname, '../public/img')));
app.use('/api', rutas);

app.listen(port, () => {
  console.log(`El servidor está corriendo en http://localhost:${port}`);
});