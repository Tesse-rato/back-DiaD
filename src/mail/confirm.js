const crypto = require('crypto');
const nodeMailer = require('nodemailer');

class CodeOfConfirm {
  constructor() {
    this.codeList = new Array();
  }
  generateCode(mail) {
    return new Promise(async (resolve, reject) => {
      const code = await crypto.randomBytes(2).toString('hex');
      const date = new Date()
      date.setHours(date.getHours() + 2);
      const expires = date.toString();

      const newObj = { code, mail, expires }

      this.pushList(newObj, { resolve, reject });
    });
  }

  deleteCode(mail) {
    this.codeList = this.codeList.filter(obj => obj.code != mail);
  }
  getCode(mail) {
    return this.codeList.find(obj => obj.mail == mail);
  }
  compareCode(code) {
    return new Promise((resolve, reject) => {
      const obj = this.codeList.find(obj => obj.code == code);

      obj ? resolve(obj) : reject('Code expired');
    });
  }
  startInterval() {

    this.timeOut = setInterval(() => {
      const date = new Date();
      const time = date.toString();

      if (!this.codeList.length) {
        clearInterval(this.timeOut);
        this.timeOut = null;
      }

      this.codeList.map(obj => {
        obj.expires < time ? this.deleteCode(obj.code) : null;
      });

    }, 60000)
  }

  pushList(obj, cb) {
    if (!this.timeOut) {
      this.startInterval();
    }
    this.codeList.push(obj);
    cb.resolve(obj);
    //this.sendMail(obj.mail, obj.code, cb);
  }

  sendMail(to, code, cb) {

    const transporter = nodeMailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'casera.email@gmail.com',
        pass: 'Muake32lo'
      }
    });

    const options = {
      to,
      from: 'casera.email@gmail.com',
      subject: 'Confirme seu email',
      text: `Seu codigo de confirmacao ${code}`
    }

    transporter.sendMail(options, (err, response) => {
      if (err) return cb.reject(err);

      cb.resolve(response);
    });
  }

}

module.exports = new CodeOfConfirm();