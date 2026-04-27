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
  const token = getToken();
  
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // IMPORTANTE: Garantir que o X-User-Id seja enviado corretamente
  if (usuario && usuario.id) {
    headers['X-User-Id'] = usuario.id.toString();
    console.log('🔑 Header X-User-Id:', usuario.id);
  } else {
    console.log('⚠️ Nenhum usuário logado, X-User-Id não enviado');
  }
  
  return headers;
};

export const roteirosAPI = {
  // Buscar todos os roteiros do usuário
  getAll: async () => {
    try {
      const headers = getHeaders();
      console.log('📡 GET /roteiros - Headers:', headers);
      
      const response = await fetch(`${API_URL}/roteiros`, { 
        headers: headers 
      });
      const data = await response.json();
      console.log('GET /roteiros response:', data);
      return data;
    } catch (error) {
      console.error('Erro ao buscar roteiros:', error);
      return { success: false, roteiros: [], error: error.message };
    }
  },

  // Criar novo roteiro
  create: async (data) => {
    try {
      const headers = getHeaders();
      console.log('📡 POST /roteiros - Headers:', headers);
      
      const response = await fetch(`${API_URL}/roteiros`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(data)
      });
      const result = await response.json();
      console.log('POST /roteiros response:', result);
      return result;
    } catch (error) {
      console.error('Erro ao criar roteiro:', error);
      return { success: false, error: error.message };
    }
  },

  // Adicionar item ao roteiro
  addItem: async (roteiroId, data) => {
    try {
      const headers = getHeaders();
      console.log('📡 POST /roteiros/item - Headers:', headers);
      
      const response = await fetch(`${API_URL}/roteiros/${roteiroId}/itens`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(data)
      });
      const result = await response.json();
      console.log('POST /roteiros/item response:', result);
      return result;
    } catch (error) {
      console.error('Erro ao adicionar item:', error);
      return { success: false, error: error.message };
    }
  },

  // Deletar item do roteiro
  deleteItem: async (itemId) => {
    try {
      const headers = getHeaders();
      console.log('📡 DELETE /roteiros/item - Headers:', headers);
      
      const response = await fetch(`${API_URL}/roteiros/itens/${itemId}`, {
        method: 'DELETE',
        headers: headers
      });
      const result = await response.json();
      console.log('DELETE /roteiros/item response:', result);
      return result;
    } catch (error) {
      console.error('Erro ao deletar item:', error);
      return { success: false, error: error.message };
    }
  },

  // Marcar item como concluído
  concluirItem: async (itemId, concluido) => {
    try {
      const response = await fetch(`${API_URL}/roteiros/itens/${itemId}/concluir`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ concluido })
      });
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Erro ao concluir item:', error);
      return { success: false, error: error.message };
    }
  },

  // Atualizar roteiro
  update: async (id, data) => {
    try {
      const response = await fetch(`${API_URL}/roteiros/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data)
      });
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Erro ao atualizar roteiro:', error);
      return { success: false, error: error.message };
    }
  },

  // Deletar roteiro
  delete: async (id) => {
    try {
      const response = await fetch(`${API_URL}/roteiros/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Erro ao deletar roteiro:', error);
      return { success: false, error: error.message };
    }
  }
};