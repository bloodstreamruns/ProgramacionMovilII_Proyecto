const nodeMailer = require('nodemailer');
const { PROVIDER_CORREO, USUARIO_CORREO, CONTRASENA_CORREO } = process.env;

console.log('Configuración de correo:');
console.log('PROVIDER_CORREO:', PROVIDER_CORREO);
console.log('USUARIO_CORREO:', USUARIO_CORREO ? '****' : 'No definido');
console.log('CONTRASENA_CORREO:', CONTRASENA_CORREO ? '****' : 'No definido');

if (!PROVIDER_CORREO || !USUARIO_CORREO || !CONTRASENA_CORREO) {
  throw new Error('Faltan variables de entorno para la configuración del correo electrónico');
}

const transporter = nodeMailer.createTransport({
  host: PROVIDER_CORREO,
  secure: true,
  port: 465,
  auth: {
    user: USUARIO_CORREO,
    pass: CONTRASENA_CORREO,
  },
});

const enviarCorreo = async (destinatario, asunto, mensaje) => {
  
  try {
    const mailOptions = {
      from: USUARIO_CORREO,
      to: destinatario,
      subject: asunto,
      text: mensaje,
    };

    await transporter.sendMail(mailOptions);
    console.log('Correo enviado exitosamente a:', destinatario);
  } catch (error) {
    console.error('Error al enviar el correo:', error);
  }
};

module.exports = { enviarCorreo };