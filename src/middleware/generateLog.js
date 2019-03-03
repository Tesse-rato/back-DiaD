const fs = require('fs');

module.exports = function generateLog(req, res) {
  const ip = req.connection.remoteAddress;
  const hours = new Date();
  const data = `${req.method} | ${ip} | ${req.path} | ${hours.toString()}\n`
  fs.appendFile('./log/blackList.log', data, (err) => {
    if (err) {
      return new Error('Error on generate log file');
    }
    return res.status(200).send({ message: `Seu ip está no .log ${ip}` });
  });
}