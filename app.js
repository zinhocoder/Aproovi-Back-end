const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();

app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/creatives', require('./routes/creativeRoutes'));
app.use('/api/empresas', require('./routes/empresaRoutes'));

// Middleware de tratamento de erros global
app.use((error, req, res, next) => {
  console.error('Erro não tratado:', error);
  
  // Se já foi enviada uma resposta, não fazer nada
  if (res.headersSent) {
    return next(error);
  }

  // Tratar diferentes tipos de erro
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Erro de validação',
      message: error.message
    });
  }

  if (error.name === 'MulterError') {
    return res.status(400).json({
      error: 'Erro no upload de arquivo',
      message: 'Arquivo muito grande ou formato inválido'
    });
  }

  // Erro genérico
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Ocorreu um erro inesperado'
  });
});

module.exports = app;
