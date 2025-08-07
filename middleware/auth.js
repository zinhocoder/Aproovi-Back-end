const jwt = require('jsonwebtoken');
const prisma = require('../prismaClient');

module.exports = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token não fornecido' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) return res.status(401).json({ message: 'Usuário inválido' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: 'Token inválido' });
  }
};
