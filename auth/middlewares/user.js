function userAuthorization(req, res, next) {
  const id = parseInt(req.params.id);

  if (req.user.id !== id)
    return res.status(403).json("Operazione non autorizzata");

  next();
}

module.exports = { userAuthorization };
