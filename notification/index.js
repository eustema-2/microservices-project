require("dotenv").config();
const express = require("express");
const nodemailer = require("nodemailer");

const app = express();

app.use(express.json());

// SEND MAIL
app.post("/send-mail", async (req, res) => {
  const { to, subject, text } = req.body;
  // validazione del req.body
  if (!to || !subject || !text)
    return res.status(400).json("manca qualche parametro");

  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  try {
    await transport.sendMail({
      from: process.env.MAIL_FROM,
      to,
      subject,
      text,
    });
  } catch (error) {
    return res.status(500).json(error);
  }

  res.json("ok");
});

// 404
app.use((req, res) => {
  res.status(404).json("La rotta non può essere trovata");
});

app.listen(process.env.SERVER_PORT, () => {
  console.log("Notification Service is running", process.env.SERVER_PORT);
});
