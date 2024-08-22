import { envorimentVariables } from '../env/envoriment';

function tokenVerification(req, res, next) {
  const bearer = req.headers.authorization;
  const token = bearer?.slice(7)?.toString();
  if (!token) {
    return res.status(403).send({
      error: true,
      message: 'no bearer token header was present',
    });
  }

  if (envorimentVariables.saltSecret !== token) {
    return res
      .status(403)
      .send({ error: true, message: 'invalid bearer token supplied' });
  }
  next();
}

export default tokenVerification;
