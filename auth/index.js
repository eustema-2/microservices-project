require("dotenv").config();
const express = require("express");
const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const cors = require("cors");

// MIDDLEWARES
const { authenticateToken } = require("./middlewares/auth");
const { userAuthorization } = require("./middlewares/user");

// UTILS
const { comparePassword, hashPassword } = require("./utils/password");

// SERVICES
const sendEmail = require("./services/sendEmail");

// VALIDATIONS
const {
  createUser,
  updateUser,
  requestResetPasswordUser,
  resetPassowrdUser,
} = require("./validations/user");

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    optionsSuccessStatus: 200,
  })
);

app.use(express.json());

const prisma = new PrismaClient();

// CREATE USER
app.post("/", async (req, res) => {
  // Validation
  const { error, value } = createUser.validate(req.body);
  if (error) return res.status(400).json(error.details[0].message);

  delete value.passwordConfirm;

  try {
    const data = value;
    data.password = await hashPassword(data.password);

    const user = await prisma.user.create({
      data,
    });

    delete user.password;
    const accessToken = jwt.sign(user, process.env.JWT_SECRET);
    res.json({ accessToken, user });
  } catch (error) {
    res.status(400).json("Qualcosa è andato storto");
  }
});

// GET USER BY ID
app.get(
  "/:id([0-9]+)",
  authenticateToken,
  userAuthorization,
  async (req, res) => {
    const id = parseInt(req.params.id);

    const user = await prisma.user.findUnique({
      where: {
        id,
      },
    });

    if (!user) return res.status(404).json("L'utente non può essere trovato");

    delete user.password;

    res.json(user);
  }
);

// GET ALL USERS
app.get("/", async (req, res) => {
  let users = await prisma.user.findMany();
  users = users.map(({ password, ...data }) => data);
  res.json(users);
});

// PUT UPDATE USER
app.put(
  "/:id([0-9]+)",
  authenticateToken,
  userAuthorization,
  async (req, res) => {
    // Validation
    const { error, value } = updateUser.validate(req.body);
    if (error) return res.status(400).json(error.details[0].message);

    try {
      const id = parseInt(req.params.id);

      const user = await prisma.user.update({ where: { id }, data: value });
      delete user.password;
      res.json(user);
    } catch (error) {
      console.log(error);
      res.status(500).json("Qualcosa è andato storto");
    }
  }
);

// DELETE USER
app.delete(
  "/:id([0-9]+)",
  authenticateToken,
  userAuthorization,
  async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      const user = await prisma.user.delete({
        where: { id },
      });

      res.json(user);
    } catch (error) {
      res.status(500).json("Qualcosa è andato storto");
    }
  }
);

// LOGIN
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) return res.status(400).json("Errore nelle credenziali");

  const isPasswordValid = await comparePassword(password, user.password);

  if (!isPasswordValid) return res.status(400).json("Errore nelle credenziali");

  delete user.password;
  const accessToken = jwt.sign(user, process.env.JWT_SECRET);

  res.json({ accessToken, user });
});

// REQUEST RESET PASSWORD
app.post("/request-reset", async (req, res) => {
  const { error, value } = requestResetPasswordUser.validate(req.body);
  if (error) return res.status(400).json(error.details[0].message);

  const { email } = value;

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) return res.status(404).json("L'utente non può essere trovato");

  const token = crypto.randomBytes(32).toString("hex");

  const data = {
    userId: user.id,
    token,
  };

  await prisma.passwordReset.upsert({
    where: {
      userId: parseInt(user.id),
    },
    create: data,
    update: data,
  });

  const link = `${process.env.FRONTEND_RESET_PASSWORD}?token=${token}`;

  try {
    await sendEmail(
      user.email,
      "Password reset",
      `
      Ecco il link per resettare la tua password:\n
      ${link}
    `
    );
  } catch (error) {
    return res.status(500).json("Qualcosa è andato storto 😥");
  }

  res.json("Il link per resettare la password è stato spedito per email");
});

// CONFIRM RESET PASSWORD
app.post("/confirm-reset", async (req, res) => {
  const { error, value } = resetPassowrdUser.validate(req.body);
  if (error) return res.status(400).json(error.details[0].message);

  const passwordReset = await prisma.passwordReset.findFirst({
    where: {
      token: value.token,
    },
    include: {
      user: true,
    },
  });

  if (!passwordReset) return res.status(400).json("Il token non è valido");

  // Scadenza
  const tokenExpirationDate =
    new Date(passwordReset.updateAt).getTime() + 60 * 60 * 1000;

  if (tokenExpirationDate < Date.now())
    return res.status(400).json("Il token è scaduto");

  const newPassword = await hashPassword(value.password);

  await prisma.user.update({
    where: {
      id: passwordReset.userId,
    },
    data: {
      password: newPassword,
    },
  });

  await prisma.passwordReset.delete({
    where: {
      userId: passwordReset.userId,
    },
  });

  res.json("La password è stata resettata");
});

// 404
app.use((req, res) => {
  res.status(404).json("La risorsa non può essere trovata");
});

app.listen(process.env.SERVER_PORT, () => {
  console.log("Server is running!" + process.env.SERVER_PORT);
});
