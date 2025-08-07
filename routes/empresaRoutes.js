const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const multer = require('multer');

// Configuração do multer para upload de logo
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos de imagem são permitidos'), false);
    }
  }
});

const {
  createEmpresa,
  getEmpresas,
  getEmpresaById,
  updateEmpresa,
  deleteEmpresa,
  getCreativesByEmpresa,
  getEmpresaByClienteEmail,
  verifyClientEmail
} = require('../controllers/empresaController');

// Rotas CRUD de empresas
router.get('/', auth, getEmpresas);
router.post('/', auth, upload.single('logo'), createEmpresa);
router.get('/:id', auth, getEmpresaById);
router.put('/:id', auth, upload.single('logo'), updateEmpresa);
router.delete('/:id', auth, deleteEmpresa);

// Rota para buscar empresa por e-mail do cliente
router.get('/cliente/:email', auth, getEmpresaByClienteEmail);
router.get('/verify-email/:email', verifyClientEmail); // Rota pública para verificação

// Rota para listar criativos de uma empresa
router.get('/:id/creatives', auth, getCreativesByEmpresa);

module.exports = router;