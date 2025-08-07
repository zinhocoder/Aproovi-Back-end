const multer = require('multer');
const { uploader } = require('../utils/cloudinary');
const { Readable } = require('stream');

const storage = multer.memoryStorage();
const upload = multer({ storage });

module.exports = [
  upload.single('file'),
  async (req, res, next) => {
    try {
      // Verificar se o arquivo foi enviado
      if (!req.file) {
        return res.status(400).json({ 
          error: 'Nenhum arquivo foi enviado',
          message: 'Por favor, selecione um arquivo para upload'
        });
      }

      // Verificar se o arquivo é uma imagem
      if (!req.file.mimetype.startsWith('image/')) {
        return res.status(400).json({ 
          error: 'Tipo de arquivo inválido',
          message: 'Apenas arquivos de imagem são permitidos'
        });
      }

      const result = await uploader(req.file);
      req.cloudinary = result;
      next();
    } catch (error) {
      console.error('Erro no upload para Cloudinary:', error);
      return res.status(500).json({
        error: 'Erro no upload do arquivo',
        message: error.message || 'Falha ao fazer upload do arquivo',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
];
