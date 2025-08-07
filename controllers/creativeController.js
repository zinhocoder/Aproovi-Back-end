const prisma = require('../prismaClient');

exports.uploadCreative = async (req, res) => {
    try {
      // Verificar se req.cloudinary existe (deve ser definido pelo middleware)
      if (!req.cloudinary) {
        return res.status(400).json({
          error: 'Dados do upload não encontrados',
          message: 'O arquivo não foi processado corretamente'
        });
      }

      const { url, filename } = req.cloudinary;
  
      // Verificar se os dados necessários estão presentes
      if (!url || !filename) {
        return res.status(400).json({
          error: 'Dados incompletos do upload',
          message: 'URL ou nome do arquivo não foram fornecidos'
        });
      }

      const { titulo, legenda, tipo, empresaId } = req.body;
  
      const creative = await prisma.creative.create({
        data: {
          url,
          fileName: titulo || filename,
          titulo: titulo || null,
          legenda: legenda || null,
          tipo: tipo || 'post',
          uploadedById: req.user.id,
          empresaId: empresaId || null,
        },
        include: {
          uploadedBy: {
            select: { name: true }
          },
          empresa: {
            select: { 
              id: true,
              nome: true 
            }
          }
        }
      });
  
      res.status(201).json({
        success: true,
        data: creative,
        message: 'Criativo enviado com sucesso'
      });
    } catch (err) {
        console.error('Erro detalhado:', JSON.stringify(err, null, 2));
        
        // Tratamento específico para erros do Prisma
        if (err.code === 'P2002') {
          return res.status(400).json({
            error: 'Arquivo duplicado',
            message: 'Este arquivo já foi enviado anteriormente'
          });
        }

        if (err.code === 'P2003') {
          return res.status(400).json({
            error: 'Usuário inválido',
            message: 'Usuário não encontrado no sistema'
          });
        }

        res.status(500).json({
          error: 'Erro interno do servidor',
          message: err.message || 'Ocorreu um erro ao processar a requisição',
          details: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
      }
    };

exports.updateStatus = async (req, res) => {
  try {
  const { id } = req.params;
  const { status } = req.body;

    // Validar status permitidos
    const allowedStatuses = ['pendente', 'aprovado', 'reprovado'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Status inválido',
        message: 'Status deve ser: pendente, aprovado ou reprovado'
      });
    }

  const creative = await prisma.creative.update({
    where: { id },
    data: { status },
      include: { uploadedBy: { select: { name: true } } }
    });

    res.status(200).json({
      success: true,
      data: creative,
      message: `Status atualizado para ${status}`
    });
  } catch (err) {
    console.error('Erro ao atualizar status:', err);
    
    if (err.code === 'P2025') {
      return res.status(404).json({
        error: 'Criativo não encontrado',
        message: 'O criativo com o ID fornecido não foi encontrado'
      });
    }

    res.status(500).json({
      error: 'Erro interno do servidor',
      message: err.message || 'Ocorreu um erro ao atualizar o status'
    });
  }
};

exports.commentCreative = async (req, res) => {
  try {
  const { id } = req.params;
  const { comentario } = req.body;

    if (!comentario || comentario.trim() === '') {
      return res.status(400).json({
        error: 'Comentário vazio',
        message: 'O comentário não pode estar vazio'
      });
    }

  const creative = await prisma.creative.update({
    where: { id },
    data: { comentario },
      include: { uploadedBy: { select: { name: true } } }
    });

    res.status(200).json({
      success: true,
      data: creative,
      message: 'Comentário adicionado com sucesso'
    });
  } catch (err) {
    console.error('Erro ao adicionar comentário:', err);
    
    if (err.code === 'P2025') {
      return res.status(404).json({
        error: 'Criativo não encontrado',
        message: 'O criativo com o ID fornecido não foi encontrado'
      });
    }

    res.status(500).json({
      error: 'Erro interno do servidor',
      message: err.message || 'Ocorreu um erro ao adicionar o comentário'
    });
  }
};

exports.getCreatives = async (req, res) => {
  try {
    const { empresaId, status, tipo } = req.query;

    // Construir filtros
    const whereClause = {
      deletedAt: null // Filtrar apenas criativos não deletados
    };

    if (empresaId) whereClause.empresaId = empresaId;
    if (status) whereClause.status = status;
    if (tipo) whereClause.tipo = tipo;

    const creatives = await prisma.creative.findMany({
      where: whereClause,
      include: {
        uploadedBy: {
          select: { name: true }
        },
        empresa: {
          select: { 
            id: true,
            nome: true 
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.status(200).json({ success: true, data: creatives });
  } catch (err) {
    console.error('Erro ao listar criativos:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// Buscar criativo específico por ID
exports.getCreativeById = async (req, res) => {
  try {
    const { id } = req.params;

    const creative = await prisma.creative.findUnique({
      where: { 
        id,
        deletedAt: null // Apenas criativos não deletados
      },
      include: {
        uploadedBy: {
          select: { name: true }
        },
        empresa: {
          select: { 
            id: true,
            nome: true 
          }
        }
      }
    });

    if (!creative) {
      return res.status(404).json({
        success: false,
        error: 'Criativo não encontrado'
      });
    }

    res.status(200).json({ success: true, data: creative });
  } catch (err) {
    console.error('Erro ao buscar criativo:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// Upload múltiplo de criativos (carrossel)
exports.uploadMultipleCreative = async (req, res) => {
  try {
    // Verificar se req.cloudinary existe (array de resultados)
    if (!req.cloudinary || !Array.isArray(req.cloudinary) || req.cloudinary.length === 0) {
      return res.status(400).json({
        error: 'Dados do upload não encontrados',
        message: 'Os arquivos não foram processados corretamente'
      });
    }

    const { legenda, tipo, titulo, empresaId } = req.body;
    const files = req.cloudinary;

    // Verificar se todos os arquivos têm dados necessários
    for (const file of files) {
      if (!file.url || !file.filename) {
        return res.status(400).json({
          error: 'Dados incompletos do upload',
          message: 'URL ou nome de arquivo não foram fornecidos para todos os arquivos'
        });
      }
    }

    // Criar o criativo principal
    const creative = await prisma.creative.create({
      data: {
        url: files[0].url, // URL do primeiro arquivo como principal
        fileName: titulo || `${tipo || 'carrossel'}_${files.length}_arquivos`,
        titulo: titulo || null,
        uploadedById: req.user.id,
        empresaId: empresaId || null,
        legenda: legenda || null,
        tipo: tipo || 'carrossel',
        // Salvar URLs de todos os arquivos como JSON
        arquivos: JSON.stringify(files.map(f => ({
          url: f.url,
          filename: f.filename,
          order: files.indexOf(f) + 1
        })))
      },
      include: {
        uploadedBy: {
          select: { name: true }
        },
        empresa: {
          select: { 
            id: true,
            nome: true 
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: creative,
      message: `Carrossel com ${files.length} arquivos criado com sucesso`
    });
  } catch (err) {
    console.error('Erro detalhado no upload múltiplo:', JSON.stringify(err, null, 2));
    
    // Tratamento específico para erros do Prisma
    if (err.code === 'P2003') {
      return res.status(400).json({
        error: 'Usuário inválido',
        message: 'Usuário não encontrado no sistema'
      });
    }

    res.status(500).json({
      error: 'Erro interno do servidor',
      message: err.message || 'Ocorreu um erro ao criar o carrossel',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

// Adicionar nova versão a um criativo existente
exports.addCreativeVersion = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se req.cloudinary existe
    if (!req.cloudinary) {
      return res.status(400).json({
        error: 'Dados do upload não encontrados',
        message: 'O arquivo não foi processado corretamente'
      });
    }

    const { url, filename } = req.cloudinary;

    // Verificar se os dados necessários estão presentes
    if (!url || !filename) {
      return res.status(400).json({
        error: 'Dados incompletos do upload',
        message: 'URL ou nome do arquivo não foram fornecidos'
      });
    }

    // Verificar se o criativo existe
    const existingCreative = await prisma.creative.findUnique({
      where: { id }
    });

    if (!existingCreative) {
      return res.status(404).json({
        error: 'Criativo não encontrado',
        message: 'O criativo com o ID fornecido não foi encontrado'
      });
    }

    // Buscar versões existentes
    let versoes = [];
    try {
      versoes = existingCreative.versoes ? JSON.parse(existingCreative.versoes) : [];
    } catch (e) {
      versoes = [];
    }

    // Adicionar nova versão
    const novaVersao = {
      url,
      filename,
      createdAt: new Date().toISOString(),
      version: versoes.length + 2 // +2 porque a versão 1 é o arquivo original
    };

    versoes.push(novaVersao);

    // Atualizar o criativo (nova versão volta para pendente)
    const updatedCreative = await prisma.creative.update({
      where: { id },
      data: {
        versoes: JSON.stringify(versoes),
        status: 'pendente' // Nova versão volta para análise
      },
      include: {
        uploadedBy: {
          select: { name: true }
        },
        empresa: {
          select: { 
            id: true,
            nome: true 
          }
        }
      }
    });

    res.status(200).json({
      success: true,
      data: updatedCreative,
      message: `Nova versão (v${novaVersao.version}) adicionada com sucesso`
    });
  } catch (err) {
    console.error('Erro ao adicionar versão:', err);
    
    if (err.code === 'P2025') {
      return res.status(404).json({
        error: 'Criativo não encontrado',
        message: 'O criativo com o ID fornecido não foi encontrado'
      });
    }

    res.status(500).json({
      error: 'Erro interno do servidor',
      message: err.message || 'Ocorreu um erro ao adicionar a versão',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

// Deletar criativo (soft delete)
exports.deleteCreative = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se o criativo existe e não foi deletado
    const existingCreative = await prisma.creative.findUnique({
      where: { id }
    });

    if (!existingCreative) {
      return res.status(404).json({
        error: 'Criativo não encontrado',
        message: 'O criativo com o ID fornecido não foi encontrado'
      });
    }

    if (existingCreative.deletedAt) {
      return res.status(400).json({
        error: 'Criativo já deletado',
        message: 'Este criativo já foi removido anteriormente'
      });
    }

    // Soft delete - apenas marca como deletado
    const deletedCreative = await prisma.creative.update({
      where: { id },
      data: {
        deletedAt: new Date()
      },
      include: {
        uploadedBy: {
          select: { name: true }
        }
      }
    });

    res.status(200).json({
      success: true,
      data: deletedCreative,
      message: 'Criativo removido com sucesso'
    });
  } catch (err) {
    console.error('Erro ao deletar criativo:', err);
    
    if (err.code === 'P2025') {
      return res.status(404).json({
        error: 'Criativo não encontrado',
        message: 'O criativo com o ID fornecido não foi encontrado'
      });
    }

    res.status(500).json({
      error: 'Erro interno do servidor',
      message: err.message || 'Ocorreu um erro ao deletar o criativo',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

// Alterar imagem principal do criativo
exports.updateCreativeImage = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se há dados do upload
    if (!req.cloudinary) {
      return res.status(400).json({
        error: 'Dados do upload não encontrados',
        message: 'A nova imagem não foi processada corretamente'
      });
    }

    const { url, filename } = req.cloudinary;

    if (!url || !filename) {
      return res.status(400).json({
        error: 'Dados incompletos do upload',
        message: 'URL ou nome da nova imagem não foram fornecidos'
      });
    }

    // Verificar se o criativo existe
    const existingCreative = await prisma.creative.findUnique({
      where: { id }
    });

    if (!existingCreative) {
      return res.status(404).json({
        error: 'Criativo não encontrado',
        message: 'O criativo com o ID fornecido não foi encontrado'
      });
    }

    if (existingCreative.deletedAt) {
      return res.status(400).json({
        error: 'Criativo deletado',
        message: 'Não é possível alterar um criativo que foi removido'
      });
    }

    // Atualizar a imagem principal
    const updatedCreative = await prisma.creative.update({
      where: { id },
      data: {
        url: url,
        fileName: filename,
        updatedAt: new Date()
      },
      include: {
        uploadedBy: {
          select: { name: true }
        }
      }
    });

    res.status(200).json({
      success: true,
      data: updatedCreative,
      message: 'Imagem do criativo atualizada com sucesso'
    });
  } catch (err) {
    console.error('Erro ao atualizar imagem:', err);
    
    if (err.code === 'P2025') {
      return res.status(404).json({
        error: 'Criativo não encontrado',
        message: 'O criativo com o ID fornecido não foi encontrado'
      });
    }

    res.status(500).json({
      error: 'Erro interno do servidor',
      message: err.message || 'Ocorreu um erro ao atualizar a imagem',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

// Adicionar comentário ao histórico
exports.addCommentToHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { comentario } = req.body;

    if (!comentario || comentario.trim() === '') {
      return res.status(400).json({
        error: 'Comentário vazio',
        message: 'O comentário não pode estar vazio'
      });
    }

    // Verificar se o criativo existe
    const existingCreative = await prisma.creative.findUnique({
      where: { id }
    });

    if (!existingCreative) {
      return res.status(404).json({
        error: 'Criativo não encontrado',
        message: 'O criativo com o ID fornecido não foi encontrado'
      });
    }

    if (existingCreative.deletedAt) {
      return res.status(400).json({
        error: 'Criativo deletado',
        message: 'Não é possível comentar em um criativo que foi removido'
      });
    }

    // Buscar comentários existentes
    let comentarios = [];
    try {
      comentarios = existingCreative.comentarios ? JSON.parse(existingCreative.comentarios) : [];
    } catch (e) {
      comentarios = [];
    }

    // Adicionar novo comentário
    const novoComentario = {
      id: Date.now().toString(), // ID único baseado no timestamp
      texto: comentario.trim(),
      autor: req.user?.name || 'Usuário',
      autorId: req.user?.id || 'unknown',
      createdAt: new Date().toISOString()
    };

    comentarios.push(novoComentario);

    // Atualizar o criativo
    const updatedCreative = await prisma.creative.update({
      where: { id },
      data: {
        comentarios: JSON.stringify(comentarios),
        // Manter compatibilidade com campo antigo
        comentario: comentario.trim(),
        updatedAt: new Date()
      },
      include: {
        uploadedBy: {
          select: { name: true }
        }
      }
    });

    res.status(200).json({
      success: true,
      data: updatedCreative,
      comentario: novoComentario,
      message: 'Comentário adicionado com sucesso'
    });
  } catch (err) {
    console.error('Erro ao adicionar comentário:', err);
    
    if (err.code === 'P2025') {
      return res.status(404).json({
        error: 'Criativo não encontrado',
        message: 'O criativo com o ID fornecido não foi encontrado'
      });
    }

    res.status(500).json({
      error: 'Erro interno do servidor',
      message: err.message || 'Ocorreu um erro ao adicionar o comentário',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};
