const prisma = require('../prismaClient');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

exports.register = async (req, res) => {
  try {
    const { name, email, password, userType = 'agency' } = req.body;

    // Validações
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Dados incompletos',
        message: 'Nome, email e senha são obrigatórios'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Senha muito curta',
        message: 'A senha deve ter pelo menos 6 caracteres'
      });
    }

    // Verificar se o usuário já existe
    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) {
      return res.status(400).json({
        success: false,
        error: 'Usuário já existe',
        message: 'Este email já está cadastrado'
      });
    }

    // Se for registro de cliente, verificar se o e-mail está registrado em uma empresa
    if (userType === 'client') {
      const empresa = await prisma.empresa.findFirst({
        where: {
          clienteEmail: email,
          ativa: true
        }
      });

      if (!empresa) {
        return res.status(403).json({
          success: false,
          error: 'E-mail não autorizado',
          message: 'Este e-mail não está registrado em nenhuma empresa. Entre em contato com sua agência para solicitar acesso.'
        });
      }
    }

    // Criar hash da senha
    const hashed = await bcrypt.hash(password, 10);
    
    // Criar usuário
    const user = await prisma.user.create({ 
      data: { 
        name, 
        email, 
        password: hashed,
        userType
      } 
    });

    // Gerar token
    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        }
      },
      message: userType === 'client' ? 'Conta de cliente criada com sucesso!' : 'Conta criada com sucesso!'
    });
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: 'Ocorreu um erro ao criar sua conta'
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password, userType = 'agency' } = req.body;

    // Validações
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Dados incompletos',
        message: 'Email e senha são obrigatórios'
      });
    }

    // Buscar usuário
    const user = await prisma.user.findUnique({ where: { email } });

    // Verificar se o usuário existe e a senha está correta
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        success: false,
        error: 'Credenciais inválidas',
        message: 'Email ou senha incorretos'
      });
    }

    // Verificar se o tipo de usuário solicitado corresponde ao tipo registrado
    if (user.userType !== userType) {
      return res.status(403).json({
        success: false,
        error: 'Tipo de usuário incorreto',
        message: userType === 'client' 
          ? 'Esta conta não é de cliente. Tente fazer login como agência.'
          : 'Esta conta não é de agência. Tente fazer login como cliente.'
      });
    }

    // Se for login como cliente, verificar se tem empresa associada
    if (userType === 'client') {
      const empresa = await prisma.empresa.findFirst({
        where: {
          clienteEmail: email,
          ativa: true
        }
      });

      if (!empresa) {
        return res.status(403).json({
          success: false,
          error: 'Acesso negado',
          message: 'Este e-mail não está associado a nenhuma empresa. Entre em contato com sua agência.'
        });
      }
    }

    // Gerar token
    const token = generateToken(user.id);

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          userType: user.userType
        }
      },
      message: 'Login realizado com sucesso!'
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: 'Ocorreu um erro ao fazer login'
    });
  }
};
