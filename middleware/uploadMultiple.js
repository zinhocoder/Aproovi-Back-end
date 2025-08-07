const multer = require('multer');
const { uploader } = require('../utils/cloudinary');

const storage = multer.memoryStorage();
const upload = multer({ storage });

module.exports = [
  upload.array('files', 10), // Máximo 10 arquivos
  async (req, res, next) => {
    try {
      // Verificar se arquivos foram enviados
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ 
          error: 'Nenhum arquivo foi enviado',
          message: 'Por favor, selecione pelo menos um arquivo para upload'
        });
      }

      // Verificar limite de arquivos
      if (req.files.length > 10) {
        return res.status(400).json({ 
          error: 'Muitos arquivos',
          message: 'Máximo de 10 arquivos permitidos'
        });
      }

      // Validar cada arquivo
      for (const file of req.files) {
        // Verificar se é imagem ou vídeo
        if (!file.mimetype.startsWith('image/') && !file.mimetype.startsWith('video/')) {
          return res.status(400).json({ 
            error: 'Tipo de arquivo inválido',
            message: 'Apenas arquivos de imagem e vídeo são permitidos'
          });
        }

        // Verificar tamanho (50MB)
        if (file.size > 50 * 1024 * 1024) {
          return res.status(400).json({ 
            error: 'Arquivo muito grande',
            message: `Arquivo ${file.originalname} é muito grande. Máximo 50MB por arquivo.`
          });
        }
      }

      // Fazer upload de todos os arquivos para Cloudinary
      const uploadPromises = req.files.map(file => uploader(file));
      const results = await Promise.all(uploadPromises);
      
      req.cloudinary = results; // Array de resultados
      next();
    } catch (error) {
      console.error('Erro no upload múltiplo para Cloudinary:', error);
      return res.status(500).json({
        error: 'Erro no upload dos arquivos',
        message: error.message || 'Falha ao fazer upload dos arquivos',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
];