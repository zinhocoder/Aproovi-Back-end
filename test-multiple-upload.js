const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_BASE_URL = 'http://localhost:5000/api';

async function testMultipleUpload() {
  console.log('🧪 Testando endpoints de upload múltiplo e versões...\n');

  try {
    let token;

    // 1. Tentar fazer login primeiro
    console.log('1. Tentando fazer login...');
    try {
      const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: 'test@example.com',
        password: '123456'
      });

      if (loginResponse.data.success) {
        token = loginResponse.data.data.token;
        console.log('✅ Login realizado com sucesso');
      }
    } catch (loginError) {
      console.log('⚠️  Login falhou, tentando criar usuário...');
      
      // 2. Se login falhar, criar usuário
      const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, {
        name: 'Usuário Teste',
        email: 'test@example.com',
        password: '123456'
      });

      if (registerResponse.data.success) {
        token = registerResponse.data.data.token;
        console.log('✅ Usuário criado e logado com sucesso');
      } else {
        console.log('❌ Erro ao criar usuário:', registerResponse.data.error);
        return;
      }
    }

    if (!token) {
      console.log('❌ Não foi possível obter token de autenticação');
      return;
    }

    // 3. Testar upload múltiplo (simulado)
    console.log('\n3. Testando upload múltiplo...');
    
    // Como não temos arquivos reais, vamos simular com dados
    const formData = new FormData();
    
    // Simular múltiplos arquivos (em produção seriam arquivos reais)
    formData.append('legenda', 'Este é um carrossel de teste');
    formData.append('tipo', 'carrossel');
    formData.append('fileCount', '3');

    // Nota: Em um teste real, você adicionaria arquivos assim:
    // formData.append('files', fs.createReadStream('path/to/file1.jpg'));
    // formData.append('files', fs.createReadStream('path/to/file2.jpg'));
    
    console.log('⚠️  Teste de upload múltiplo requer arquivos reais');
    console.log('   Para testar com arquivos reais, adicione arquivos e descomente as linhas de upload');

    // 4. Testar endpoint de versões (GET)
    console.log('\n4. Listando criativos existentes...');
    const creativesResponse = await axios.get(`${API_BASE_URL}/creatives`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (creativesResponse.data.success && creativesResponse.data.data.length > 0) {
      const firstCreative = creativesResponse.data.data[0];
      console.log(`✅ Encontrados ${creativesResponse.data.data.length} criativos`);
      console.log(`   Primeiro criativo: ${firstCreative.fileName} (ID: ${firstCreative.id})`);

      // 5. Testar adicionar versão (simulado)
      console.log('\n5. Testando adicionar versão...');
      console.log('⚠️  Teste de adicionar versão requer arquivo real');
      console.log(`   Endpoint: POST ${API_BASE_URL}/creatives/${firstCreative.id}/versions`);
      
    } else {
      console.log('⚠️  Nenhum criativo encontrado para testar versões');
    }

    console.log('\n✅ Testes de estrutura dos endpoints concluídos!');
    console.log('\n📝 Para testar completamente:');
    console.log('   1. Use um cliente como Postman ou Insomnia');
    console.log('   2. Faça upload de arquivos reais para /creatives/upload-multiple');
    console.log('   3. Adicione versões para /creatives/:id/versions');

  } catch (error) {
    console.error('❌ Erro nos testes:', error.message);
    if (error.response?.data) {
      console.error('   Resposta:', error.response.data);
    }
    if (error.config?.url) {
      console.error('   URL:', error.config.url);
    }
  }
}

// Executar testes
testMultipleUpload();