import { envorimentVariables } from '../env/envoriment';

const keyVerification = (req, res, next) => {
  const key = req.query['key']?.toString();
  if (!key) {
    return res
      .status(403)
      .send({ error: true, message: 'no key query was present' });
  }
  const instance = envorimentVariables.whatsappInstace[key];
  if (!instance) {
    return res
      .status(403)
      .send({ error: true, message: 'invalid key supplied' });
  }
  next();
};

export default keyVerification;
