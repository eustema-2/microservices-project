const Joi = require("joi");

const createUser = Joi.object({
  name: Joi.string().min(3).max(255).required(),
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  passwordConfirm: Joi.required().valid(Joi.ref("password")),
});

const updateUser = Joi.object({
  name: Joi.string().min(3).max(255).required(),
  email: Joi.string().email().required(),
});

const requestResetPasswordUser = Joi.object({
  email: Joi.string().email().required(),
});

const resetPassowrdUser = Joi.object({
  token: Joi.string().required(),
  password: Joi.string().required(),
});

module.exports = {
  createUser,
  updateUser,
  requestResetPasswordUser,
  resetPassowrdUser,
};
