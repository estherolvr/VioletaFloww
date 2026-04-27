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
  
  req.usuarioId = parseInt(usuarioId);
  next();
};

// ========== ROTAS DE ROTEIROS ==========

// Buscar roteiro semanal do usuário (apenas um)
router.get('/', verificarAutenticacao, async (req, res) => {
  try {
    console.log('📚 Buscando roteiro semanal para usuário:', req.usuarioId);
    
    // Buscar apenas o roteiro com título "Roteiro Semanal"
    let roteiroSemanal = await query(
      `SELECT r.*, 
        (SELECT COUNT(*) FROM roteiro_itens WHERE roteiro_id = r.id) as total_itens,
        (SELECT COUNT(*) FROM roteiro_itens WHERE roteiro_id = r.id AND concluido = 1) as itens_concluidos
       FROM roteiros_estudo r 
       WHERE r.usuario_id = ? AND r.titulo = 'Roteiro Semanal'
       LIMIT 1`,
      [req.usuarioId]
    );
    
    // Se não existir, criar um novo
    if (!roteiroSemanal || roteiroSemanal.length === 0) {
      console.log('📝 Criando novo roteiro semanal para usuário:', req.usuarioId);
      
      const result = await query(
        `INSERT INTO roteiros_estudo (usuario_id, titulo, descricao, data_inicio, data_fim, status) 
         VALUES (?, 'Roteiro Semanal', 'Plano de estudos semanal', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 7 DAY), 'planejado')`,
        [req.usuarioId]
      );
      
      const novoId = result.insertId;
      
      roteiroSemanal = await query(
        'SELECT * FROM roteiros_estudo WHERE id = ?',
        [novoId]
      );
    }
    
    // Buscar itens do roteiro
    if (roteiroSemanal && roteiroSemanal.length > 0) {
      const itens = await query(
        'SELECT * FROM roteiro_itens WHERE roteiro_id = ? ORDER BY ordem ASC',
        [roteiroSemanal[0].id]
      );
      roteiroSemanal[0].itens = itens || [];
    }
    
    // Retornar apenas este roteiro em um array
    const roteiros = roteiroSemanal && roteiroSemanal.length > 0 ? [roteiroSemanal[0]] : [];
    
    console.log(`✅ Retornando ${roteiros.length} roteiro(s)`);
    res.json({ success: true, roteiros });
  } catch (error) {
    console.error('❌ Erro ao buscar roteiros:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao buscar roteiros: ' + error.message 
    });
  }
});

// Criar novo roteiro (apenas se necessário)
router.post('/', verificarAutenticacao, async (req, res) => {
  const { titulo, descricao, data_inicio, data_fim, itens } = req.body;
  
  console.log('📝 Criando roteiro:', { titulo, data_inicio, usuarioId: req.usuarioId });
  
  if (!titulo || !titulo.trim()) {
    return res.status(400).json({ 
      success: false, 
      message: 'Título é obrigatório' 
    });
  }
  
  if (!data_inicio) {
    return res.status(400).json({ 
      success: false, 
      message: 'Data de início é obrigatória' 
    });
  }
  
  try {
    const result = await query(
      `INSERT INTO roteiros_estudo (usuario_id, titulo, descricao, data_inicio, data_fim, status) 
       VALUES (?, ?, ?, ?, ?, 'planejado')`,
      [req.usuarioId, titulo.trim(), descricao || null, data_inicio, data_fim || null]
    );
    
    const roteiroId = result.insertId;
    console.log('✅ Roteiro criado com ID:', roteiroId);
    
    // Inserir itens se houver
    if (itens && itens.length > 0) {
      for (let i = 0; i < itens.length; i++) {
        const item = itens[i];
        await query(
          `INSERT INTO roteiro_itens (roteiro_id, titulo, descricao, data_prevista, ordem) 
           VALUES (?, ?, ?, ?, ?)`,
          [roteiroId, item.titulo, item.descricao || null, item.data_prevista, i]
        );
      }
      console.log(`✅ Adicionados ${itens.length} itens ao roteiro`);
    }
    
    const novoRoteiro = await query(
      'SELECT * FROM roteiros_estudo WHERE id = ?',
      [roteiroId]
    );
    
    // Buscar itens do novo roteiro
    const itensRoteiro = await query(
      'SELECT * FROM roteiro_itens WHERE roteiro_id = ? ORDER BY ordem ASC',
      [roteiroId]
    );
    
    res.json({ 
      success: true, 
      roteiro: {
        ...novoRoteiro[0],
        itens: itensRoteiro,
        total_itens: itensRoteiro.length,
        itens_concluidos: 0
      }
    });
  } catch (error) {
    console.error('❌ Erro ao criar roteiro:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao criar roteiro: ' + error.message 
    });
  }
});

// Atualizar roteiro
router.put('/:id', verificarAutenticacao, async (req, res) => {
  const { id } = req.params;
  const { titulo, descricao, data_inicio, data_fim, status } = req.body;
  
  console.log('✏️ Atualizando roteiro:', { id, titulo, status });
  
  try {
    const roteiro = await query(
      'SELECT * FROM roteiros_estudo WHERE id = ? AND usuario_id = ?',
      [id, req.usuarioId]
    );
    
    if (!roteiro || roteiro.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Roteiro não encontrado' 
      });
    }
    
    await query(
      `UPDATE roteiros_estudo 
       SET titulo = ?, descricao = ?, data_inicio = ?, data_fim = ?, status = ? 
       WHERE id = ?`,
      [titulo, descricao, data_inicio, data_fim, status, id]
    );
    
    console.log('✅ Roteiro atualizado com sucesso');
    res.json({ success: true, message: 'Roteiro atualizado com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao atualizar roteiro:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao atualizar roteiro: ' + error.message 
    });
  }
});

// Deletar roteiro
router.delete('/:id', verificarAutenticacao, async (req, res) => {
  const { id } = req.params;
  
  console.log('🗑️ Deletando roteiro:', { id, usuarioId: req.usuarioId });
  
  try {
    const roteiro = await query(
      'SELECT * FROM roteiros_estudo WHERE id = ? AND usuario_id = ?',
      [id, req.usuarioId]
    );
    
    if (!roteiro || roteiro.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Roteiro não encontrado' 
      });
    }
    
    await query('DELETE FROM roteiros_estudo WHERE id = ?', [id]);
    
    console.log('✅ Roteiro deletado com sucesso');
    res.json({ success: true, message: 'Roteiro removido com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao deletar roteiro:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao deletar roteiro: ' + error.message 
    });
  }
});

// ========== ROTAS DE ITENS DO ROTEIRO ==========

// Adicionar item ao roteiro
router.post('/:roteiroId/itens', verificarAutenticacao, async (req, res) => {
  const { roteiroId } = req.params;
  const { titulo, descricao, data_prevista, dia_semana, tempo_estudo, horario } = req.body;
  
  console.log('📝 Adicionando item ao roteiro:', { roteiroId, titulo, dia_semana });
  
  if (!titulo || !titulo.trim()) {
    return res.status(400).json({ 
      success: false, 
      message: 'Título do item é obrigatório' 
    });
  }
  
  try {
    const roteiro = await query(
      'SELECT * FROM roteiros_estudo WHERE id = ? AND usuario_id = ?',
      [roteiroId, req.usuarioId]
    );
    
    if (!roteiro || roteiro.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Roteiro não encontrado' 
      });
    }
    
    // Pegar a maior ordem atual
    const maxOrdem = await query(
      'SELECT MAX(ordem) as max_ordem FROM roteiro_itens WHERE roteiro_id = ?',
      [roteiroId]
    );
    const novaOrdem = (maxOrdem[0]?.max_ordem || -1) + 1;
    
    const result = await query(
      `INSERT INTO roteiro_itens (roteiro_id, titulo, descricao, data_prevista, ordem, dia_semana, tempo_estudo, horario) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [roteiroId, titulo.trim(), descricao || null, data_prevista || null, novaOrdem, dia_semana || null, tempo_estudo || 60, horario || null]
    );
    
    const novoItem = await query(
      'SELECT * FROM roteiro_itens WHERE id = ?',
      [result.insertId]
    );
    
    console.log('✅ Item adicionado com sucesso');
    res.json({ success: true, item: novoItem[0] });
  } catch (error) {
    console.error('❌ Erro ao adicionar item:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao adicionar item: ' + error.message 
    });
  }
});

// Marcar item como concluído
router.put('/itens/:itemId/concluir', verificarAutenticacao, async (req, res) => {
  const { itemId } = req.params;
  const { concluido } = req.body;
  
  console.log('✅ Marcando item como:', concluido ? 'concluído' : 'pendente', { itemId });
  
  try {
    const item = await query(
      `SELECT ri.*, r.usuario_id 
       FROM roteiro_itens ri 
       JOIN roteiros_estudo r ON ri.roteiro_id = r.id 
       WHERE ri.id = ? AND r.usuario_id = ?`,
      [itemId, req.usuarioId]
    );
    
    if (!item || item.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Item não encontrado' 
      });
    }
    
    await query(
      `UPDATE roteiro_itens 
       SET concluido = ?, data_conclusao = ? 
       WHERE id = ?`,
      [concluido ? 1 : 0, concluido ? new Date() : null, itemId]
    );
    
    console.log('✅ Item atualizado com sucesso');
    res.json({ success: true, message: 'Item atualizado com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao atualizar item:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao atualizar item: ' + error.message 
    });
  }
});

// Deletar item do roteiro
router.delete('/itens/:itemId', verificarAutenticacao, async (req, res) => {
  const { itemId } = req.params;
  
  console.log('🗑️ Deletando item:', { itemId });
  
  try {
    const item = await query(
      `SELECT ri.*, r.usuario_id 
       FROM roteiro_itens ri 
       JOIN roteiros_estudo r ON ri.roteiro_id = r.id 
       WHERE ri.id = ? AND r.usuario_id = ?`,
      [itemId, req.usuarioId]
    );
    
    if (!item || item.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Item não encontrado' 
      });
    }
    
    await query('DELETE FROM roteiro_itens WHERE id = ?', [itemId]);
    
    console.log('✅ Item deletado com sucesso');
    res.json({ success: true, message: 'Item removido com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao deletar item:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao deletar item: ' + error.message 
    });
  }
});

module.exports = router;