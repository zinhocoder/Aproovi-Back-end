const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Criar nova empresa
exports.createEmpresa = async (req, res) => {
  try {
    const { nome, descricao, clienteEmail } = req.body;
    const logoFile = req.file; // Para upload de arquivo

    if (!nome || nome.trim() === '') {
      return res.status(400).json({
        error: 'Nome obrigatório',
        message: 'O nome da empresa é obrigatório'
      });
    }

    if (!clienteEmail || clienteEmail.trim() === '') {
      return res.status(400).json({
        error: 'E-mail do cliente obrigatório',
        message: 'O e-mail do cliente é obrigatório'
      });
    }

    // Validação básica de e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clienteEmail)) {
      return res.status(400).json({
        error: 'E-mail inválido',
        message: 'Por favor, forneça um e-mail válido'
      });
    }

    // Verificar se já existe empresa com o mesmo nome
    const existingEmpresa = await prisma.empresa.findFirst({
      where: {
        nome: nome.trim(),
        ativa: true
      }
    });

    if (existingEmpresa) {
      return res.status(400).json({
        error: 'Empresa já existe',
        message: 'Já existe uma empresa ativa com este nome'
      });
    }

    // Upload da logo para Cloudinary se houver arquivo
    let logoUrl = null;
    if (logoFile) {
      try {
        const cloudinary = require('cloudinary').v2;
        const result = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              resource_type: "auto",
              folder: "empresas/logos",
              public_id: `logo_${Date.now()}`,
              transformation: [
                { width: 200, height: 200, crop: "fit" }
              ]
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          ).end(logoFile.buffer);
        });
        logoUrl = result.secure_url;
      } catch (uploadError) {
        console.error('Erro no upload da logo:', uploadError);
        // Continua sem logo se houver erro no upload
      }
    }

    const empresa = await prisma.empresa.create({
      data: {
        nome: nome.trim(),
        descricao: descricao?.trim() || null,
        clienteEmail: clienteEmail.trim(),
        logo: logoUrl,
        createdById: req.user.id
      },
      include: {
        createdBy: {
          select: { name: true }
        },
        _count: {
          select: { creatives: true }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: empresa,
      message: 'Empresa criada com sucesso'
    });
  } catch (err) {
    console.error('Erro ao criar empresa:', err);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: err.message || 'Ocorreu um erro ao criar a empresa'
    });
  }
};

// Listar empresas
exports.getEmpresas = async (req, res) => {
  try {
    const { includeInactive = false } = req.query;

    const empresas = await prisma.empresa.findMany({
      where: includeInactive === 'true' ? {} : { ativa: true },
      include: {
        createdBy: {
          select: { name: true }
        },
        _count: {
          select: { 
            creatives: {
              where: { deletedAt: null } // Contar apenas criativos não deletados
            }
          }
        }
      },
      orderBy: [
        { ativa: 'desc' }, // Ativas primeiro
        { createdAt: 'desc' }
      ]
    });

    res.status(200).json({ 
      success: true, 
      data: empresas 
    });
  } catch (err) {
    console.error('Erro ao listar empresas:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
};

// Obter empresa por ID
exports.getEmpresaById = async (req, res) => {
  try {
    const { id } = req.params;

    const empresa = await prisma.empresa.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { name: true }
        },
        _count: {
          select: { 
            creatives: {
              where: { deletedAt: null }
            }
          }
        }
      }
    });

    if (!empresa) {
      return res.status(404).json({
        error: 'Empresa não encontrada',
        message: 'A empresa com o ID fornecido não foi encontrada'
      });
    }

    res.status(200).json({
      success: true,
      data: empresa
    });
  } catch (err) {
    console.error('Erro ao buscar empresa:', err);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: err.message || 'Ocorreu um erro ao buscar a empresa'
    });
  }
};

// Atualizar empresa
exports.updateEmpresa = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, descricao, ativa } = req.body;
    const logoFile = req.file; // Para upload de arquivo

    // Verificar se a empresa existe
    const existingEmpresa = await prisma.empresa.findUnique({
      where: { id }
    });

    if (!existingEmpresa) {
      return res.status(404).json({
        error: 'Empresa não encontrada',
        message: 'A empresa com o ID fornecido não foi encontrada'
      });
    }

    // Verificar se o nome já existe em outra empresa (se nome foi alterado)
    if (nome && nome.trim() !== existingEmpresa.nome) {
      const duplicateEmpresa = await prisma.empresa.findFirst({
        where: {
          nome: nome.trim(),
          ativa: true,
          id: { not: id }
        }
      });

      if (duplicateEmpresa) {
        return res.status(400).json({
          error: 'Nome já existe',
          message: 'Já existe outra empresa ativa com este nome'
        });
      }
    }

    // Upload da nova logo para Cloudinary se houver arquivo
    let logoUrl = existingEmpresa.logo; // Manter logo atual se não houver nova
    if (logoFile) {
      try {
        const cloudinary = require('cloudinary').v2;
        const result = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              resource_type: "auto",
              folder: "empresas/logos",
              public_id: `logo_${id}_${Date.now()}`,
              transformation: [
                { width: 200, height: 200, crop: "fit" }
              ]
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          ).end(logoFile.buffer);
        });
        logoUrl = result.secure_url;
      } catch (uploadError) {
        console.error('Erro no upload da logo:', uploadError);
        // Continua sem alterar a logo se houver erro no upload
      }
    }

    const updatedData = {};
    if (nome !== undefined) updatedData.nome = nome.trim();
    if (descricao !== undefined) updatedData.descricao = descricao?.trim() || null;
    if (ativa !== undefined) updatedData.ativa = Boolean(ativa);
    if (logoUrl !== existingEmpresa.logo) updatedData.logo = logoUrl;

    const empresa = await prisma.empresa.update({
      where: { id },
      data: updatedData,
      include: {
        createdBy: {
          select: { name: true }
        },
        _count: {
          select: { 
            creatives: {
              where: { deletedAt: null }
            }
          }
        }
      }
    });

    res.status(200).json({
      success: true,
      data: empresa,
      message: 'Empresa atualizada com sucesso'
    });
  } catch (err) {
    console.error('Erro ao atualizar empresa:', err);
    
    if (err.code === 'P2025') {
      return res.status(404).json({
        error: 'Empresa não encontrada',
        message: 'A empresa com o ID fornecido não foi encontrada'
      });
    }

    res.status(500).json({
      error: 'Erro interno do servidor',
      message: err.message || 'Ocorreu um erro ao atualizar a empresa'
    });
  }
};

// Buscar empresa por e-mail do cliente
exports.getEmpresaByClienteEmail = async (req, res) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({
        error: 'E-mail obrigatório',
        message: 'O e-mail do cliente é obrigatório'
      });
    }

    const empresa = await prisma.empresa.findFirst({
      where: {
        clienteEmail: email,
        ativa: true
      },
      include: {
        createdBy: {
          select: { name: true }
        },
        _count: {
          select: { 
            creatives: {
              where: { deletedAt: null }
            }
          }
        }
      }
    });

    if (!empresa) {
      return res.status(404).json({
        error: 'Empresa não encontrada',
        message: 'Não foi encontrada uma empresa ativa para este e-mail de cliente'
      });
    }

    res.status(200).json({
      success: true,
      data: empresa,
      message: 'Empresa encontrada com sucesso'
    });
  } catch (err) {
    console.error('Erro ao buscar empresa por e-mail:', err);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: err.message || 'Ocorreu um erro ao buscar a empresa'
    });
  }
};

// Verificar se e-mail está registrado em empresa (endpoint público)
exports.verifyClientEmail = async (req, res) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'E-mail não fornecido',
        message: 'E-mail é obrigatório'
      });
    }

    const empresa = await prisma.empresa.findFirst({
      where: {
        clienteEmail: email,
        ativa: true
      },
      select: {
        id: true,
        nome: true,
        clienteEmail: true
      }
    });

    if (!empresa) {
      return res.status(404).json({
        success: false,
        error: 'E-mail não autorizado',
        message: 'Este e-mail não está registrado em nenhuma empresa'
      });
    }

    res.json({
      success: true,
      data: {
        empresa: empresa.nome,
        email: empresa.clienteEmail
      }
    });
  } catch (err) {
    console.error('Erro ao verificar e-mail do cliente:', err);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: 'Ocorreu um erro ao verificar e-mail'
    });
  }
};

// Deletar empresa (soft delete)
exports.deleteEmpresa = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se a empresa existe
    const existingEmpresa = await prisma.empresa.findUnique({
      where: { id },
      include: {
        _count: {
          select: { 
            creatives: {
              where: { deletedAt: null }
            }
          }
        }
      }
    });

    if (!existingEmpresa) {
      return res.status(404).json({
        error: 'Empresa não encontrada',
        message: 'A empresa com o ID fornecido não foi encontrada'
      });
    }

    if (!existingEmpresa.ativa) {
      return res.status(400).json({
        error: 'Empresa já inativa',
        message: 'Esta empresa já foi desativada anteriormente'
      });
    }

    // Verificar se há criativos vinculados
    if (existingEmpresa._count.creatives > 0) {
      return res.status(400).json({
        error: 'Empresa possui criativos',
        message: `Esta empresa possui ${existingEmpresa._count.creatives} criativo(s) vinculado(s). Mova os criativos para outra empresa antes de desativar.`
      });
    }

    // Soft delete - marcar como inativa
    const empresa = await prisma.empresa.update({
      where: { id },
      data: { ativa: false },
      include: {
        createdBy: {
          select: { name: true }
        }
      }
    });

    res.status(200).json({
      success: true,
      data: empresa,
      message: 'Empresa desativada com sucesso'
    });
  } catch (err) {
    console.error('Erro ao deletar empresa:', err);
    
    if (err.code === 'P2025') {
      return res.status(404).json({
        error: 'Empresa não encontrada',
        message: 'A empresa com o ID fornecido não foi encontrada'
      });
    }

    res.status(500).json({
      error: 'Erro interno do servidor',
      message: err.message || 'Ocorreu um erro ao desativar a empresa'
    });
  }
};

// Listar criativos de uma empresa
exports.getCreativesByEmpresa = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, tipo } = req.query;

    // Verificar se a empresa existe
    const empresa = await prisma.empresa.findUnique({
      where: { id }
    });

    if (!empresa) {
      return res.status(404).json({
        error: 'Empresa não encontrada',
        message: 'A empresa com o ID fornecido não foi encontrada'
      });
    }

    // Construir filtros
    const whereClause = {
      empresaId: id,
      deletedAt: null
    };

    if (status) whereClause.status = status;
    if (tipo) whereClause.tipo = tipo;

    const creatives = await prisma.creative.findMany({
      where: whereClause,
      include: {
        uploadedBy: {
          select: { name: true }
        },
        empresa: {
          select: { nome: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.status(200).json({
      success: true,
      data: creatives,
      empresa: {
        id: empresa.id,
        nome: empresa.nome
      }
    });
  } catch (err) {
    console.error('Erro ao listar criativos da empresa:', err);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: err.message || 'Ocorreu um erro ao listar os criativos'
    });
  }
};