const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET
});

exports.uploader = (file) => {
  return new Promise((resolve, reject) => {
    // Verificar se o arquivo existe
    if (!file || !file.buffer) {
      return reject(new Error('Arquivo inválido ou não fornecido'));
    }

    // Verificar se o buffer não está vazio
    if (file.buffer.length === 0) {
      return reject(new Error('Arquivo vazio'));
    }

    const stream = cloudinary.uploader.upload_stream(
      { 
        folder: 'aproovi',
        resource_type: 'image',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp']
      },
      (error, result) => {
        if (error) {
          console.error('Erro do Cloudinary:', error);
          return reject(new Error(`Falha no upload para Cloudinary: ${error.message}`));
        }
        
        if (!result || !result.secure_url) {
          return reject(new Error('Resposta inválida do Cloudinary'));
        }
        
        resolve({ 
          url: result.secure_url, 
          filename: result.public_id 
        });
      }
    );

    // Tratar erros de stream
    stream.on('error', (error) => {
      console.error('Erro no stream:', error);
      reject(new Error(`Erro no processamento do arquivo: ${error.message}`));
    });

    Readable.from(file.buffer).pipe(stream);
  });
};
