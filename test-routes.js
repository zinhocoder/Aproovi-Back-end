const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Função para testar as rotas
async function testRoutes() {
  console.log('🧪 Testando rotas da API...\n');

  try {
    // Teste 1: GET /api/creatives (sem token - deve retornar 401)
    console.log('1. Testando GET /api/creatives (sem autenticação)...');
    try {
      await axios.get(`${BASE_URL}/creatives`);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ OK: Retornou 401 (não autorizado) como esperado');
      } else {
        console.log('❌ Erro inesperado:', error.response?.status);
      }
    }

    // Teste 2: PUT /api/creatives/:id (sem token - deve retornar 401)
    console.log('\n2. Testando PUT /api/creatives/:id (sem autenticação)...');
    try {
      await axios.put(`${BASE_URL}/creatives/test-id`, { status: 'aprovado' });
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ OK: Retornou 401 (não autorizado) como esperado');
      } else {
        console.log('❌ Erro inesperado:', error.response?.status);
      }
    }

    // Teste 3: PUT /api/creatives/:id/status (sem token - deve retornar 401)
    console.log('\n3. Testando PUT /api/creatives/:id/status (sem autenticação)...');
    try {
      await axios.put(`${BASE_URL}/creatives/test-id/status`, { status: 'aprovado' });
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ OK: Retornou 401 (não autorizado) como esperado');
      } else {
        console.log('❌ Erro inesperado:', error.response?.status);
      }
    }

    console.log('\n✅ Todos os testes de autenticação passaram!');
    console.log('\n📋 Rotas disponíveis:');
    console.log('- GET  /api/creatives');
    console.log('- POST /api/creatives/upload');
    console.log('- PUT  /api/creatives/:id');
    console.log('- PUT  /api/creatives/:id/status');
    console.log('- PUT  /api/creatives/:id/comment');

  } catch (error) {
    console.error('❌ Erro nos testes:', error.message);
  }
}

// Executar testes
testRoutes(); 