require('dotenv').config();
const cloudinary = require('cloudinary').v2;

// Verificar se as variáveis de ambiente estão configuradas
console.log('Verificando configurações do Cloudinary...');
console.log('CLOUD_NAME:', process.env.CLOUD_NAME ? 'Configurado' : 'NÃO CONFIGURADO');
console.log('CLOUD_API_KEY:', process.env.CLOUD_API_KEY ? 'Configurado' : 'NÃO CONFIGURADO');
console.log('CLOUD_API_SECRET:', process.env.CLOUD_API_SECRET ? 'Configurado' : 'NÃO CONFIGURADO');

if (!process.env.CLOUD_NAME || !process.env.CLOUD_API_KEY || !process.env.CLOUD_API_SECRET) {
  console.error('❌ Erro: Variáveis de ambiente do Cloudinary não estão configuradas!');
  console.error('Por favor, configure as seguintes variáveis no arquivo .env:');
  console.error('- CLOUD_NAME');
  console.error('- CLOUD_API_KEY');
  console.error('- CLOUD_API_SECRET');
  process.exit(1);
}

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET
});

// Testar conexão com Cloudinary
console.log('\nTestando conexão com Cloudinary...');
console.log('Configuração atual:', {
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY ? `${process.env.CLOUD_API_KEY.substring(0, 5)}...` : 'N/A',
  api_secret: process.env.CLOUD_API_SECRET ? `${process.env.CLOUD_API_SECRET.substring(0, 5)}...` : 'N/A'
});

cloudinary.api.ping()
  .then(result => {
    console.log('✅ Conexão com Cloudinary estabelecida com sucesso!');
    console.log('Status:', result.status);
  })
  .catch(error => {
    console.error('❌ Erro ao conectar com Cloudinary:');
    console.error('Mensagem:', error.message);
    console.error('Código:', error.http_code);
    console.error('Detalhes:', error);
    
    if (error.http_code === 401) {
      console.error('\n💡 Dica: Verifique se suas credenciais do Cloudinary estão corretas.');
      console.error('Você pode encontrar suas credenciais no Dashboard do Cloudinary.');
    } else if (error.http_code === 404) {
      console.error('\n💡 Dica: Verifique se o cloud_name está correto.');
    }
  }); 