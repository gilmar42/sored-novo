import mongoose from 'mongoose';
import logger from '../utils/logger';

export const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sored';
    
    await mongoose.connect(mongoURI, {
      // These options are no longer needed in Mongoose 7.x but kept for reference
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
    });
    
    logger.info('MongoDB conectado com sucesso', { uri: mongoURI.replace(/\/\/.*@/, '//***:***@') });
  } catch (error: any) {
    logger.error('Erro ao conectar ao MongoDB', { error: error?.message });
    process.exit(1);
  }
};

mongoose.connection.on('error', (err) => {
  logger.error('Erro de conexão MongoDB', { error: err.message });
});

mongoose.connection.on('disconnected', () => {
  logger.info('MongoDB desconectado');
});

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  logger.info('MongoDB desconectado pelo término da aplicação');
  process.exit(0);
});
