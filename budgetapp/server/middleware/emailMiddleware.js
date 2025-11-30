import sendEmail from "../helpers/email.js";

// Attaches a sendEmail helper to req for downstream handlers
export const emailMiddleware = (req, res, next) => {
  req.sendEmail = sendEmail;
  next();
};

export default emailMiddleware;
