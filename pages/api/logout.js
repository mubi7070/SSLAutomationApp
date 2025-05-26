import { deleteCookie } from 'cookies-next';

export default function handler(req, res) {
  deleteCookie('sessionToken', { req, res });
  res.status(200).json({ success: true });
}
