const path = require('path');
const fs = require('fs');
const multer = require('multer');

const EXTENSIONES = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const rutaDestino = path.join(__dirname, '../../public/img');
    fs.mkdirSync(rutaDestino, { recursive: true });
    cb(null, rutaDestino);
  },
  filename: (req, file, cb) => {
    const sufijo = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${sufijo}${EXTENSIONES[file.mimetype]}`);
  },
});

const uploadImagen = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (EXTENSIONES[file.mimetype]) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos JPEG, PNG y JPG'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

module.exports = { uploadImagen };