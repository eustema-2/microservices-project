const nodemailer = require("nodemailer");

async function sendEmail(email, subject, text) {
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  await transport.sendMail({
    from: process.env.MAIL_FROM,
    to: email,
    subject,
    text,
  });
}

module.exports = sendEmail;
