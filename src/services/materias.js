// src/services/materias.js
const API_URL = 'http://localhost:3001/api';

const getToken = () => {
  return localStorage.getItem('violetaflow_token') || sessionStorage.getItem('violetaflow_token');
};

const getUsuario = () => {
  const usuario = localStorage.getItem('violetaflow_usuario') || sessionStorage.getItem('violetaflow_usuario');
  if (usuario) {
    try {
      return JSON.parse(usuario);
    } catch (e) {
      return null;
    }
  }
  return null;
};

const getHeaders = () => {
  const usuario = getUsuario();
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`
  };
  
  if (usuario && usuario.id) {
    headers['X-User-Id'] = usuario.id;
  }
  
  return headers;
};

export const materiasAPI = {
  // Buscar todas as matérias
  getAll: async () => {
    try {
      const response = await fetch(`${API_URL}/materias`, { headers: getHeaders() });
      const data = await response.json();
      
      if (!response.ok) {
        return { success: false, materias: [], error: data.message };
      }
      
      return { success: true, materias: data };
    } catch (error) {
      console.error('Erro ao buscar matérias:', error);
      return { success: false, materias: [], error: 'Erro de conexão' };
    }
  },
  
  // Criar matéria
  create: async (materia) => {
    try {
      const response = await fetch(`${API_URL}/materias`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(materia)
      });
      const data = await response.json();
      
      if (!response.ok) {
        return { success: false, error: data.message };
      }
      
      return { success: true, materia: data };
    } catch (error) {
      return { success: false, error: 'Erro de conexão' };
    }
  },
  
  // Atualizar matéria
  update: async (id, materia) => {
    try {
      const response = await fetch(`${API_URL}/materias/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(materia)
      });
      const data = await response.json();
      
      if (!response.ok) {
        return { success: false, error: data.message };
      }
      
      return { success: true, materia: data };
    } catch (error) {
      return { success: false, error: 'Erro de conexão' };
    }
  },
  
  // Deletar matéria
  delete: async (id) => {
    try {
      const response = await fetch(`${API_URL}/materias/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      const data = await response.json();
      
      if (!response.ok) {
        return { success: false, error: data.message };
      }
      
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Erro de conexão' };
    }
  },
  
  // Adicionar avaliação
  addAvaliacao: async (materiaId, avaliacao) => {
    try {
      const response = await fetch(`${API_URL}/materias/${materiaId}/avaliacoes`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(avaliacao)
      });
      const data = await response.json();
      
      if (!response.ok) {
        return { success: false, error: data.message };
      }
      
      return { success: true, avaliacao: data };
    } catch (error) {
      return { success: false, error: 'Erro de conexão' };
    }
  },
  
  // Atualizar avaliação
  updateAvaliacao: async (materiaId, avaliacaoId, avaliacao) => {
    try {
      const response = await fetch(`${API_URL}/materias/${materiaId}/avaliacoes/${avaliacaoId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(avaliacao)
      });
      const data = await response.json();
      
      if (!response.ok) {
        return { success: false, error: data.message };
      }
      
      return { success: true, avaliacao: data };
    } catch (error) {
      return { success: false, error: 'Erro de conexão' };
    }
  },
  
  // Deletar avaliação
  deleteAvaliacao: async (materiaId, avaliacaoId) => {
    try {
      const response = await fetch(`${API_URL}/materias/${materiaId}/avaliacoes/${avaliacaoId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      const data = await response.json();
      
      if (!response.ok) {
        return { success: false, error: data.message };
      }
      
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Erro de conexão' };
    }
  }
};