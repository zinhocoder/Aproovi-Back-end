const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const uploadMultiple = require('../middleware/uploadMultiple');
const {
  uploadCreative,
  uploadMultipleCreative,
  addCreativeVersion,
  updateStatus,
  commentCreative,
  getCreatives,
  getCreativeById,
  deleteCreative,
  updateCreativeImage,
  addCommentToHistory
} = require('../controllers/creativeController');

router.get('/', auth, getCreatives);
router.get('/:id', auth, getCreativeById);
router.post('/upload', auth, upload, uploadCreative);
router.post('/upload-multiple', auth, uploadMultiple, uploadMultipleCreative);

// Rotas específicas
router.put('/:id/status', auth, updateStatus);
router.put('/:id/comment', auth, commentCreative); // Rota antiga mantida para compatibilidade
router.post('/:id/comments', auth, addCommentToHistory); // Nova rota para múltiplos comentários
router.post('/:id/versions', auth, upload, addCreativeVersion);
router.put('/:id/image', auth, upload, updateCreativeImage); // Nova rota para alterar imagem
router.delete('/:id', auth, deleteCreative); // Nova rota para deletar

// Rota genérica para atualizar status (para compatibilidade)
router.put('/:id', auth, updateStatus);

module.exports = router;
