const nodemailer = require('nodemailer');

const sendMail = (to, token) => {
  return new Promise((resolve, reject) => {
    const trasporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'casera.email@gmail.com',
        pass: 'Muake32lo'
      }
    })
    const mailOptions = {
      from: 'casera.email@gmail.com',
      to,
      subject: 'Reset Password',
      text: `Forgot your password? No problem, use this token ${token}`
    }
    trasporter.sendMail(mailOptions, (err, info) => {
      console.log(err);
      if (err) return reject(err);

      resolve(info);
    });
  });
};

module.exports = sendMail;