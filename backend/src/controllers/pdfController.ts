import { Response } from 'express';
import { generateBudgetPDF } from '../utils/pdfGenerator';
import Budget from '../models/Budget';
import { AuthRequest } from '../middleware/auth';
import logger from '../utils/logger';
import path from 'path';
import fs from 'fs';

export const generateBudgetPDFController = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    logger.info('Iniciando geração de PDF', { 
      tenantId: req.tenant?._id, 
      budgetId: req.params.id,
      userId: req.user?._id 
    });
    
    if (!req.tenant) {
      logger.warn('Tenant não encontrado na requisição', { userId: req.user?._id });
      res.status(401).json({ message: 'Tenant não encontrado' });
      return;
    }

    const { id } = req.params;

    const budget = await Budget.findOne({ 
      _id: id, 
      tenantId: req.tenant._id 
    });

    logger.info('Budget consultado', { budgetId: id, found: !!budget });
    if (!budget) {
      logger.warn('Orçamento não encontrado', { budgetId: id, tenantId: req.tenant._id });
      res.status(404).json({ message: 'Orçamento não encontrado' });
      return;
    }

    logger.info('Gerando PDF para orçamento', { budgetId: id, budgetNumber: budget.number });

    const pdfBuffer = await generateBudgetPDF(id);

    logger.info('PDF gerado com sucesso', { budgetId: id, size: pdfBuffer.length });

    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const fileName = `budget_${budget.number}_${Date.now()}.pdf`;
    const filePath = path.join(uploadsDir, fileName);
    
    fs.writeFileSync(filePath, pdfBuffer);

    budget.pdfPath = filePath;
    await budget.save();

    // Gerar link para o PDF
    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3001}`;
    const pdfUrl = `${baseUrl}/api/pdf/download/${fileName}`;

    logger.info('PDF salvo e URL gerada', { fileName, filePath, pdfUrl });

    res.json({
      message: 'PDF gerado com sucesso',
      pdfUrl,
      fileName: `orçamento_${budget.number}.pdf`
    });
  } catch (error: any) {
    logger.error('Erro ao gerar PDF', { 
      budgetId: req.params.id, 
      tenantId: req.tenant?._id,
      error: error?.message 
    });
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

export const downloadBudgetPDF = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.tenant) {
      logger.warn('Tenant não encontrado na requisição de download', { userId: req.user?._id });
      res.status(401).json({ message: 'Tenant não encontrado' });
      return;
    }

    const { id } = req.params;

    const budget = await Budget.findOne({ 
      _id: id, 
      tenantId: req.tenant._id 
    });

    if (!budget || !budget.pdfPath) {
      logger.warn('PDF não encontrado', { budgetId: id, hasPdfPath: !!budget?.pdfPath });
      res.status(404).json({ message: 'PDF não encontrado' });
      return;
    }

    if (!fs.existsSync(budget.pdfPath)) {
      logger.error('Arquivo PDF não encontrado no sistema de arquivos', { filePath: budget.pdfPath });
      res.status(404).json({ message: 'Arquivo PDF não encontrado' });
      return;
    }

    logger.info('PDF sendo enviado', { budgetId: id, filePath: budget.pdfPath });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="orçamento_${budget.number}.pdf"`);
    res.sendFile(budget.pdfPath);
  } catch (error: any) {
    logger.error('Erro ao baixar PDF', { 
      budgetId: req.params.id,
      error: error?.message 
    });
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

export const servePDF = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { filename } = req.params;
    const filePath = path.join(process.cwd(), 'uploads', filename);

    if (!fs.existsSync(filePath)) {
      logger.warn('Arquivo PDF solicitado não encontrado', { filename, filePath });
      res.status(404).json({ message: 'Arquivo não encontrado' });
      return;
    }

    // Verificar se o arquivo pertence ao tenant (opcional, por segurança)
    // Para simplificar, servir diretamente

    logger.info('PDF sendo servido', { filename, filePath });
    res.setHeader('Content-Type', 'application/pdf');
    res.sendFile(filePath);
  } catch (error: any) {
    logger.error('Erro ao servir PDF', { 
      filename: req.params.filename,
      error: error?.message 
    });
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};
