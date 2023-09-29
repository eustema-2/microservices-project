const jwt = require("jsonwebtoken");

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json("Token non fornito");

  // verifichiamo che il token sia valido
  jwt.verify(token, process.env.JWT_SECRET, (err, data) => {
    if (err) return res.status(403).json("Token non è valido");

    req.user = data;

    next();
  });
}

module.exports = { authenticateToken };
