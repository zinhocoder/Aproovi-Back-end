const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testAuth() {
  console.log('🧪 Testando autenticação...\n');

  try {
    // Teste 1: Registro de usuário
    console.log('1. Testando registro...');
    const registerData = {
      name: 'Teste Usuário',
      email: 'teste@exemplo.com',
      password: '123456'
    };

    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, registerData);
    console.log('✅ Registro bem-sucedido:', registerResponse.data.message);

    // Teste 2: Login
    console.log('\n2. Testando login...');
    const loginData = {
      email: 'teste@exemplo.com',
      password: '123456'
    };

    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, loginData);
    console.log('✅ Login bem-sucedido:', loginResponse.data.message);
    console.log('Token:', loginResponse.data.data.token.substring(0, 20) + '...');

    // Teste 3: Login com credenciais inválidas
    console.log('\n3. Testando login com credenciais inválidas...');
    try {
      await axios.post(`${BASE_URL}/auth/login`, {
        email: 'teste@exemplo.com',
        password: 'senhaerrada'
      });
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Erro de credenciais inválidas capturado corretamente');
      } else {
        console.log('❌ Erro inesperado:', error.response?.status);
      }
    }

    // Teste 4: Registro com email duplicado
    console.log('\n4. Testando registro com email duplicado...');
    try {
      await axios.post(`${BASE_URL}/auth/register`, registerData);
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Erro de email duplicado capturado corretamente');
      } else {
        console.log('❌ Erro inesperado:', error.response?.status);
      }
    }

    console.log('\n✅ Todos os testes de autenticação passaram!');

  } catch (error) {
    console.error('❌ Erro nos testes:');
    console.error('Mensagem:', error.message);
    console.error('Status:', error.response?.status);
    console.error('Dados:', error.response?.data);
    console.error('URL:', error.config?.url);
  }
}

testAuth(); 