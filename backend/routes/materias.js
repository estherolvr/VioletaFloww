const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

// Middleware para verificar autenticação
const verificarAutenticacao = (req, res, next) => {
  const usuarioId = req.headers['x-user-id'];
  
  console.log('🔐 Verificando autenticação - Usuário ID:', usuarioId);
  
  if (!usuarioId) {
    return res.status(401).json({ 
      success: false,
      message: 'Usuário não autenticado' 
    });
  }
  
  req.usuarioId = usuarioId;
  next();
};

// ========== ROTAS DE MATÉRIAS ==========

// Buscar todas as matérias
router.get('/', verificarAutenticacao, async (req, res) => {
  try {
    console.log('📚 Buscando matérias para usuário:', req.usuarioId);
    
    const materias = await query(
      'SELECT * FROM materias WHERE usuario_id = ? ORDER BY created_at DESC',
      [req.usuarioId]
    );
    
    console.log('📚 Matérias encontradas:', materias?.length || 0);
    
    if (materias && materias.length > 0) {
      for (let materia of materias) {
        console.log(`📘 Matéria: ${materia.nome}, Média: ${materia.media_aprovacao}`);
        
        const avaliacoes = await query(
          'SELECT * FROM avaliacoes WHERE materia_id = ? ORDER BY created_at ASC',
          [materia.id]
        );
        materia.avaliacoes = avaliacoes || [];
      }
    }
    
    // Enviar os dados como estão (o campo media_aprovacao já está na resposta)
    res.json(materias || []);
  } catch (error) {
    console.error('❌ Erro ao buscar matérias:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro ao buscar matérias: ' + error.message
    });
  }
});

// Criar matéria
router.post('/', verificarAutenticacao, async (req, res) => {
  const { nome, mediaAprovacao } = req.body;
  
  console.log('📝 Criando matéria - Dados recebidos:', { nome, mediaAprovacao, tipo: typeof mediaAprovacao });
  
  if (!nome || !nome.trim()) {
    return res.status(400).json({ 
      success: false,
      message: 'Nome da matéria é obrigatório' 
    });
  }
  
  // Converter para número decimal
  let mediaFinal = 6.0;
  if (mediaAprovacao !== undefined && mediaAprovacao !== null) {
    mediaFinal = parseFloat(mediaAprovacao);
    if (isNaN(mediaFinal)) mediaFinal = 6.0;
  }
  
  console.log('📝 Salvando matéria com média:', mediaFinal);
  
  try {
    const result = await query(
      'INSERT INTO materias (usuario_id, nome, media_aprovacao) VALUES (?, ?, ?)',
      [req.usuarioId, nome.trim(), mediaFinal]
    );
    
    console.log('✅ Matéria criada com ID:', result.insertId);
    
    const novaMateria = await query(
      'SELECT * FROM materias WHERE id = ?',
      [result.insertId]
    );
    
    // Garantir que a resposta tenha os campos corretos
    const materiaResponse = {
      ...novaMateria[0],
      mediaAprovacao: novaMateria[0].media_aprovacao // Mapear para o frontend
    };
    
    console.log('📤 Resposta da criação:', { 
      id: materiaResponse.id, 
      nome: materiaResponse.nome, 
      media_aprovacao: materiaResponse.media_aprovacao,
      mediaAprovacao: materiaResponse.mediaAprovacao 
    });
    
    res.status(201).json(materiaResponse);
  } catch (error) {
    console.error('❌ Erro ao criar matéria:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro ao criar matéria: ' + error.message
    });
  }
});

// Atualizar matéria
router.put('/:id', verificarAutenticacao, async (req, res) => {
  const { id } = req.params;
  const { nome, mediaAprovacao } = req.body;
  
  console.log('✏️ Atualizando matéria - Dados recebidos:', { id, nome, mediaAprovacao, tipo: typeof mediaAprovacao });
  
  // Converter para número decimal
  let mediaFinal = 6.0;
  if (mediaAprovacao !== undefined && mediaAprovacao !== null) {
    mediaFinal = parseFloat(mediaAprovacao);
    if (isNaN(mediaFinal)) mediaFinal = 6.0;
  }
  
  try {
    const materia = await query(
      'SELECT * FROM materias WHERE id = ? AND usuario_id = ?',
      [id, req.usuarioId]
    );
    
    if (!materia || materia.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Matéria não encontrada' 
      });
    }
    
    console.log('📝 Atualizando matéria para média:', mediaFinal);
    
    await query(
      'UPDATE materias SET nome = ?, media_aprovacao = ? WHERE id = ?',
      [nome, mediaFinal, id]
    );
    
    const materiaAtualizada = await query(
      'SELECT * FROM materias WHERE id = ?',
      [id]
    );
    
    const materiaResponse = {
      ...materiaAtualizada[0],
      mediaAprovacao: materiaAtualizada[0].media_aprovacao // Mapear para o frontend
    };
    
    console.log('📤 Resposta da atualização:', { 
      id: materiaResponse.id, 
      nome: materiaResponse.nome, 
      media_aprovacao: materiaResponse.media_aprovacao,
      mediaAprovacao: materiaResponse.mediaAprovacao 
    });
    
    res.json(materiaResponse);
  } catch (error) {
    console.error('❌ Erro ao atualizar matéria:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro ao atualizar matéria: ' + error.message
    });
  }
});

// Deletar matéria
router.delete('/:id', verificarAutenticacao, async (req, res) => {
  const { id } = req.params;
  
  console.log('🗑️ Deletando matéria - ID:', id, 'Usuário:', req.usuarioId);
  
  try {
    const materia = await query(
      'SELECT * FROM materias WHERE id = ? AND usuario_id = ?',
      [id, req.usuarioId]
    );
    
    if (!materia || materia.length === 0) {
      console.log('❌ Matéria não encontrada para o usuário');
      return res.status(404).json({ 
        success: false,
        message: 'Matéria não encontrada' 
      });
    }
    
    console.log('✅ Matéria encontrada:', materia[0].nome);
    
    const result = await query(
      'DELETE FROM materias WHERE id = ? AND usuario_id = ?',
      [id, req.usuarioId]
    );
    
    console.log('📊 Resultado da exclusão:', result);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Matéria não encontrada' 
      });
    }
    
    console.log('✅ Matéria deletada com sucesso!');
    res.json({ 
      success: true,
      message: 'Matéria removida com sucesso' 
    });
  } catch (error) {
    console.error('❌ Erro ao deletar matéria:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro ao deletar matéria: ' + error.message
    });
  }
});

// ========== ROTAS DE AVALIAÇÕES ==========

// Criar avaliação
router.post('/:materiaId/avaliacoes', verificarAutenticacao, async (req, res) => {
  const { materiaId } = req.params;
  const { nome, nota, peso } = req.body;
  
  console.log('📝 Criando avaliação:', { materiaId, nome, nota, peso });
  
  if (!nome || !nome.trim()) {
    return res.status(400).json({ 
      success: false,
      message: 'Nome da avaliação é obrigatório' 
    });
  }
  
  const pesoNum = parseFloat(peso);
  
  if (isNaN(pesoNum) || pesoNum < 1 || pesoNum > 100) {
    return res.status(400).json({ 
      success: false,
      message: 'Peso deve ser um número entre 1 e 100' 
    });
  }
  
  try {
    const materia = await query(
      'SELECT * FROM materias WHERE id = ? AND usuario_id = ?',
      [materiaId, req.usuarioId]
    );
    
    if (!materia || materia.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Matéria não encontrada' 
      });
    }
    
    const avaliacoes = await query(
      'SELECT * FROM avaliacoes WHERE materia_id = ?',
      [materiaId]
    );
    
    let somaAtual = 0;
    for (let av of avaliacoes) {
      somaAtual += parseFloat(av.peso);
    }
    
    if (somaAtual + pesoNum > 100) {
      const maxPermitido = 100 - somaAtual;
      return res.status(400).json({ 
        success: false,
        message: `Máximo restante: ${maxPermitido}%` 
      });
    }
    
    const result = await query(
      'INSERT INTO avaliacoes (materia_id, nome, nota, peso) VALUES (?, ?, ?, ?)',
      [materiaId, nome.trim(), nota ? parseFloat(nota) : null, pesoNum]
    );
    
    const novaAvaliacao = await query(
      'SELECT * FROM avaliacoes WHERE id = ?',
      [result.insertId]
    );
    
    res.status(201).json({ 
      success: true,
      ...novaAvaliacao[0]
    });
  } catch (error) {
    console.error('❌ Erro ao criar avaliação:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro ao criar avaliação: ' + error.message
    });
  }
});

// Atualizar avaliação
router.put('/:materiaId/avaliacoes/:avaliacaoId', verificarAutenticacao, async (req, res) => {
  const { materiaId, avaliacaoId } = req.params;
  const { nome, nota, peso } = req.body;
  
  console.log('✏️ Atualizando avaliação:', { materiaId, avaliacaoId, nome, nota, peso });
  
  const pesoNum = parseFloat(peso);
  
  if (isNaN(pesoNum) || pesoNum < 1 || pesoNum > 100) {
    return res.status(400).json({ 
      success: false,
      message: 'Peso deve ser um número entre 1 e 100' 
    });
  }
  
  try {
    const materia = await query(
      'SELECT * FROM materias WHERE id = ? AND usuario_id = ?',
      [materiaId, req.usuarioId]
    );
    
    if (!materia || materia.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Matéria não encontrada' 
      });
    }
    
    const outrasAvaliacoes = await query(
      'SELECT * FROM avaliacoes WHERE materia_id = ? AND id != ?',
      [materiaId, avaliacaoId]
    );
    
    let somaOutras = 0;
    for (let av of outrasAvaliacoes) {
      somaOutras += parseFloat(av.peso);
    }
    
    if (somaOutras + pesoNum > 100) {
      const maxPermitido = 100 - somaOutras;
      return res.status(400).json({ 
        success: false,
        message: `Máximo permitido para esta avaliação: ${maxPermitido}%` 
      });
    }
    
    await query(
      'UPDATE avaliacoes SET nome = ?, nota = ?, peso = ? WHERE id = ? AND materia_id = ?',
      [nome, nota ? parseFloat(nota) : null, pesoNum, avaliacaoId, materiaId]
    );
    
    const avaliacaoAtualizada = await query(
      'SELECT * FROM avaliacoes WHERE id = ?',
      [avaliacaoId]
    );
    
    res.json({ 
      success: true,
      ...avaliacaoAtualizada[0]
    });
  } catch (error) {
    console.error('❌ Erro ao atualizar avaliação:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro ao atualizar avaliação: ' + error.message
    });
  }
});

// Deletar avaliação
router.delete('/:materiaId/avaliacoes/:avaliacaoId', verificarAutenticacao, async (req, res) => {
  const { materiaId, avaliacaoId } = req.params;
  
  console.log('🗑️ Deletando avaliação:', { materiaId, avaliacaoId });
  
  try {
    const materia = await query(
      'SELECT * FROM materias WHERE id = ? AND usuario_id = ?',
      [materiaId, req.usuarioId]
    );
    
    if (!materia || materia.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Matéria não encontrada' 
      });
    }
    
    const result = await query(
      'DELETE FROM avaliacoes WHERE id = ? AND materia_id = ?',
      [avaliacaoId, materiaId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Avaliação não encontrada' 
      });
    }
    
    res.json({ 
      success: true,
      message: 'Avaliação removida com sucesso' 
    });
  } catch (error) {
    console.error('❌ Erro ao deletar avaliação:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro ao deletar avaliação: ' + error.message
    });
  }
});

module.exports = router;