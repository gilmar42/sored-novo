const PDFDocument = require('pdfkit');
import Budget from '../models/Budget';
import Tenant from '../models/Tenant';
import logger from './logger';
import { PopulatedBudget, PopulatedTenant } from '../types';

export const generateBudgetPDF = async (budgetId: string): Promise<Buffer> => {
  logger.info('Iniciando geração de PDF', { budgetId });
  
  try {
    const budget = await Budget.findById(budgetId)
      .populate('clientId')
      .populate({
        path: 'materials.materialId',
        select: 'name unitOfMeasure unitCost weight weightUnit dimensions diameter diameterUnit volume volumeUnit isComposite components itemType size'
      })
      .populate('labor.laborId')
      .populate('machines.machineId');

    logger.info('Budget consultado', { budgetId, found: !!budget });
    if (!budget) {
      throw new Error('Orçamento não encontrado');
    }

    logger.debug('Budget data', {
      number: budget.number,
      title: budget.title,
      clientId: budget.clientId,
      materials: budget.materials?.length,
      labor: budget.labor?.length,
      machines: budget.machines?.length,
      tenantId: budget.tenantId
    });

    const tenant = await Tenant.findById(budget.tenantId);
    logger.info('Tenant consultado', { tenantId: budget.tenantId, found: !!tenant });
    if (!tenant) {
      throw new Error('Empresa não encontrada');
    }

    logger.debug('Tenant data', {
      name: tenant.name,
      email: tenant.email
    });

  logger.info('Iniciando criação do documento PDF', { budgetId });
  const doc = new PDFDocument({ margin: 50 });
  const chunks: Buffer[] = [];

  doc.on('data', (chunk: Buffer) => {
    chunks.push(chunk);
  });

  return new Promise((resolve, reject) => {
    doc.on('end', () => {
      logger.info('PDF finalizado', { budgetId, size: chunks.length });
      resolve(Buffer.concat(chunks));
    });

    doc.on('error', (error: any) => {
      logger.error('Erro na geração do PDF', { budgetId, error: error.message });
      reject(error);
    });

    // Header
    doc.fontSize(20).text(tenant.name, { align: 'center' });
    doc.fontSize(12).text(tenant.email || '', { align: 'center' });
    doc.fontSize(12).text(tenant.phone || '', { align: 'center' });
    
    if (tenant.address) {
      const address = `${tenant.address.street}, ${tenant.address.number} - ${tenant.address.neighborhood}`;
      doc.fontSize(10).text(address, { align: 'center' });
      doc.fontSize(10).text(`${tenant.address.city} - ${tenant.address.state}, ${tenant.address.zipCode}`, { align: 'center' });
    }

    doc.moveDown();

    // Separator
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();

    doc.moveDown();

    // Title
    doc.fontSize(16).text('ORÇAMENTO', { align: 'center' });
    doc.fontSize(14).text(`Nº: ${budget.number}`, { align: 'center' });
    doc.fontSize(12).text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, { align: 'center' });
  doc.fontSize(12).text(`Validade: ${budget.validityDays} dias`, { align: 'center' });

  doc.moveDown();

  // Client Information - Agora com tipagem correta
  doc.fontSize(14).text('Dados do Cliente:', { underline: true });
  doc.fontSize(12);
  
  const client = budget.clientId as any;
  doc.text(`Nome: ${client.name || ''}`);
  if (client.email) doc.text(`Email: ${client.email}`);
  if (client.phone) doc.text(`Telefone: ${client.phone}`);
  if (client.document) doc.text(`Documento: ${client.document}`);

  doc.moveDown();

  // Budget Title and Description
  doc.fontSize(14).text('Descrição do Orçamento:', { underline: true });
  doc.fontSize(12).text(budget.title);
  if (budget.description) {
    doc.text(budget.description);
  }

  doc.moveDown();

  // Separate materials and components
  const allBudgetItems = budget.materials || [];

  logger.debug('PDF - materiais do orçamento', {
    total: allBudgetItems.length,
    items: allBudgetItems.map((item: any) => ({
      name: item.materialId?.name,
      itemType: item.materialId?.itemType,
      isComposite: item.materialId?.isComposite,
      componentsCount: item.materialId?.components?.length ?? 0,
    }))
  });

  const materialItems = allBudgetItems.filter((item: any) => {
    const mat = item.materialId as any;
    return !mat || mat.itemType !== 'component';
  });
  const componentItems = allBudgetItems.filter((item: any) => {
    const mat = item.materialId as any;
    return mat && mat.itemType === 'component';
  });

  // Materials Table (only non-components)
  if (materialItems.length > 0) {
    doc.fontSize(14).text('Materiais:', { underline: true });
    doc.moveDown();

    const tableTop = doc.y;
    const itemX = 30;
    const descriptionX = 60;
    const quantityX = 280;
    const weightUnitX = 350;
    const weightTotalX = 450;
    const unitCostX = 520;

    doc.fontSize(9);
    doc.text('Item', itemX, tableTop);
    doc.text('Descrição', descriptionX, tableTop);
    doc.text('Qtd', quantityX, tableTop);
    doc.text('Peso Un.', weightUnitX, tableTop);
    doc.text('Peso Total', weightTotalX, tableTop);
    doc.text('V. Unit.', unitCostX, tableTop);
    doc.moveTo(itemX, tableTop + 15).lineTo(570, tableTop + 15).stroke();

    let currentY = tableTop + 25;
    let totalWeightKg = 0;

    materialItems.forEach((item: any, index: number) => {
      const material = item.materialId as any;
      const weight = material?.weight || 0;
      const unit = material?.weightUnit || 'kg';
      const weightInKg = unit === 'g' ? weight / 1000 : weight;
      const rowTotalWeight = weightInKg * item.quantity;
      totalWeightKg += rowTotalWeight;

      doc.text(`${index + 1}`, itemX, currentY);
      doc.text(material?.name || '-', descriptionX, currentY, { width: 210 });
      doc.text(item.quantity.toString(), quantityX, currentY);
      doc.text(`${weight}${unit}`, weightUnitX, currentY);
      doc.text(`${rowTotalWeight.toFixed(2)}kg`, weightTotalX, currentY);
      doc.text(`R$ ${item.unitCost.toFixed(2)}`, unitCostX, currentY);
      currentY += 20;
    });

    (budget as any).totalWeightCalculation = totalWeightKg;
    (doc as any).y = currentY + 10;
  }

  // Composite product breakdown: sub-components of composite materials
  const compositeItems = materialItems.filter((item: any) => {
    const mat = item.materialId as any;
    return mat && mat.isComposite && mat.components && mat.components.length > 0;
  });

  if (compositeItems.length > 0) {
    doc.moveDown();
    doc.fontSize(14).text('Composição dos Produtos:', { underline: true });
    doc.fillColor('#333333').fontSize(10).text('Detalhamento dos componentes que formam cada produto do orçamento:');
    doc.fillColor('black');
    doc.moveDown();

    compositeItems.forEach((budgetItem: any) => {
      const mat = budgetItem.materialId as any;
      const productQty = budgetItem.quantity;

      // Product header
      doc.fontSize(11).font('Helvetica-Bold').text(`Produto: ${mat.name}  (Qtd no orçamento: ${productQty})`);
      doc.font('Helvetica');
      doc.moveDown(0.3);

      const tTop = doc.y;
      const cCol1 = 30;   // #
      const cCol2 = 55;   // Componente
      const cCol3 = 250;  // Qtd/produto
      const cCol4 = 330;  // Qtd total
      const cCol5 = 415;  // V. Unit.
      const cCol6 = 490;  // Subtotal

      doc.fontSize(8).font('Helvetica-Bold');
      doc.text('#',            cCol1, tTop);
      doc.text('Componente',   cCol2, tTop, { width: 190 });
      doc.text('Qtd/Produto',  cCol3, tTop, { width: 75 });
      doc.text('Qtd Total',    cCol4, tTop, { width: 80 });
      doc.text('V. Unit.',     cCol5, tTop, { width: 70 });
      doc.text('Subtotal',     cCol6, tTop, { width: 70 });
      doc.font('Helvetica');
      doc.moveTo(cCol1, tTop + 12).lineTo(570, tTop + 12).stroke();

      let rowY2 = tTop + 20;
      let totalSubCost = 0;

      mat.components.forEach((comp: any, idx: number) => {
        const qtyTotal = comp.quantity * productQty;
        const subtotalComp = comp.unitCost * qtyTotal;
        totalSubCost += subtotalComp;

        if (idx % 2 === 0) {
          doc.rect(cCol1 - 2, rowY2 - 2, 543, 14).fillColor('#f0f4ff').fill();
          doc.fillColor('black');
        }

        doc.fontSize(8);
        doc.text(`${idx + 1}`,                           cCol1, rowY2);
        doc.text(comp.name || '-',                       cCol2, rowY2, { width: 190, ellipsis: true });
        doc.text(comp.quantity.toString(),               cCol3, rowY2, { width: 75 });
        doc.text(qtyTotal.toString(),                    cCol4, rowY2, { width: 80 });
        doc.text(`R$ ${comp.unitCost.toFixed(2)}`,       cCol5, rowY2, { width: 70 });
        doc.text(`R$ ${subtotalComp.toFixed(2)}`,        cCol6, rowY2, { width: 70 });
        rowY2 += 16;

        if (rowY2 > 720) {
          doc.addPage();
          rowY2 = 50;
        }
      });

      doc.moveTo(cCol1, rowY2 + 2).lineTo(570, rowY2 + 2).stroke();
      rowY2 += 10;
      doc.font('Helvetica-Bold').fontSize(9);
      doc.text(`Custo total dos componentes (${productQty}x): R$ ${totalSubCost.toFixed(2)}`, cCol2, rowY2);
      doc.font('Helvetica');
      (doc as any).y = rowY2 + 20;
      doc.moveDown(0.5);
    });
  }

  // Components Table (product components for the client)
  if (componentItems.length > 0) {
    doc.moveDown();
    doc.fontSize(14).text('Componentes do Produto:', { underline: true });
    doc.fillColor('#333333').fontSize(10).text('Esta tabela mostra todos os componentes que formam o produto final, incluindo suas especificações técnicas:');
    doc.fillColor('black');
    doc.moveDown();

    const tableTop2 = doc.y;
    const col1 = 30;  // #
    const col2 = 50;  // Código/Nome
    const col3 = 180; // Descrição/Especificações
    const col4 = 320; // Dimensões
    const col5 = 420; // Peso Unit.
    const col6 = 480; // Qtd
    const col7 = 520; // Subtotal

    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('#', col1, tableTop2);
    doc.text('Componente', col2, tableTop2);
    doc.text('Especificações', col3, tableTop2);
    doc.text('Dimensões', col4, tableTop2);
    doc.text('Peso Un.', col5, tableTop2);
    doc.text('Qtd', col6, tableTop2);
    doc.text('Subtotal', col7, tableTop2);
    doc.font('Helvetica');
    doc.moveTo(col1, tableTop2 + 14).lineTo(570, tableTop2 + 14).stroke();

    let rowY = tableTop2 + 22;
    let totalComponentWeight = 0;
    let totalComponentCost = 0;

    componentItems.forEach((item: any, index: number) => {
      const c = item.materialId as any;
      if (!c) return;

      // Build specifications string
      const specs = [];
      if (c.size) specs.push(`Tam: ${c.size}`);
      if (c.diameter) specs.push(`Ø${c.diameter}${c.diameterUnit || 'mm'}`);
      if (c.dimensions?.width) specs.push(`Larg: ${c.dimensions.width}${c.dimensions.widthUnit || 'mm'}`);
      const specsText = specs.join(', ');

      // Dimensions string
      const dims = [];
      if (c.diameter) dims.push(`Diâmetro: ${c.diameter}${c.diameterUnit || 'mm'}`);
      if (c.dimensions?.width) dims.push(`Largura: ${c.dimensions.width}${c.dimensions.widthUnit || 'mm'}`);
      if (c.dimensions?.length) dims.push(`Comprimento: ${c.dimensions.length}${c.dimensions.lengthUnit || 'mm'}`);
      if (c.dimensions?.height) dims.push(`Altura: ${c.dimensions.height}${c.dimensions.heightUnit || 'mm'}`);
      const dimsText = dims.join(', ');

      // Weight calculation
      const wKg = c.weight ? (c.weightUnit === 'g' ? c.weight / 1000 : c.weight) : 0;
      const totalWeight = wKg * item.quantity;
      totalComponentWeight += totalWeight;

      const subtotal = item.unitCost * item.quantity;
      totalComponentCost += subtotal;

      // Alternating row background
      if (index % 2 === 0) {
        doc.rect(col1 - 2, rowY - 2, 543, 16).fillColor('#f8f9fa').fill();
        doc.fillColor('black');
      }

      doc.fontSize(8);
      doc.text(`${index + 1}`, col1, rowY);
      doc.text(c.name || '-', col2, rowY, { width: 125, ellipsis: true });
      doc.text(specsText || '-', col3, rowY, { width: 135, ellipsis: true });
      doc.text(dimsText || '-', col4, rowY, { width: 95, ellipsis: true });
      doc.text(c.weight ? `${c.weight}${c.weightUnit || 'kg'}` : '-', col5, rowY);
      doc.text(item.quantity.toString(), col6, rowY);
      doc.text(`R$ ${subtotal.toFixed(2)}`, col7, rowY);
      rowY += 18;

      // page break guard
      if (rowY > 720) {
        doc.addPage();
        rowY = 50;
      }
    });

    // Components summary
    doc.moveTo(col1, rowY + 2).lineTo(570, rowY + 2).stroke();
    rowY += 12;
    doc.font('Helvetica-Bold').fontSize(9);
    if (totalComponentWeight > 0) {
      doc.text(`Peso total dos componentes: ${totalComponentWeight.toFixed(3)} kg`, col1, rowY);
      rowY += 12;
    }
    doc.text(`Custo total dos componentes: R$ ${totalComponentCost.toFixed(2)}`, col1, rowY);
    doc.font('Helvetica');
    rowY += 14;

    (doc as any).y = rowY + 8;
  }

  // Labor Table
  if (budget.labor && budget.labor.length > 0) {
    doc.moveDown();
    doc.fontSize(14).text('Mão de Obra:', { underline: true });
    doc.moveDown();

    const tableTop = doc.y;
    const itemX = 50;
    const descriptionX = 150;
    const hoursX = 400;
    const costHourX = 480;

    doc.fontSize(10);
    doc.text('Item', itemX, tableTop);
    doc.text('Função', descriptionX, tableTop);
    doc.text('Horas', hoursX, tableTop);
    doc.text('Custo/H', costHourX, tableTop);

    doc.moveTo(itemX, tableTop + 15).lineTo(545, tableTop + 15).stroke();

    let currentY = tableTop + 25;
    budget.labor.forEach((item: any, index: number) => {
      const labor = item.laborId;
      doc.text(`${index + 1}`, itemX, currentY);
      doc.text(labor.name, descriptionX, currentY);
      doc.text(item.hours.toString(), hoursX, currentY);
      doc.text(`R$ ${item.costPerHour.toFixed(2)}`, costHourX, currentY);
      currentY += 20;
    });

    doc.y = currentY + 10;
  }

  // Machines Table
  if (budget.machines && budget.machines.length > 0) {
    doc.moveDown();
    doc.fontSize(14).text('Máquinas:', { underline: true });
    doc.moveDown();

    const tableTop = doc.y;
    const itemX = 50;
    const descriptionX = 150;
    const hoursX = 400;
    const costHourX = 480;

    doc.fontSize(10);
    doc.text('Item', itemX, tableTop);
    doc.text('Máquina', descriptionX, tableTop);
    doc.text('Horas', hoursX, tableTop);
    doc.text('Custo/H', costHourX, tableTop);

    doc.moveTo(itemX, tableTop + 15).lineTo(545, tableTop + 15).stroke();

    let currentY = tableTop + 25;
    budget.machines.forEach((item: any, index: number) => {
      const machine = item.machineId;
      doc.text(`${index + 1}`, itemX, currentY);
      doc.text(machine.name, descriptionX, currentY);
      doc.text(item.hours.toString(), hoursX, currentY);
      doc.text(`R$ ${item.costPerHour.toFixed(2)}`, costHourX, currentY);
      currentY += 20;
    });

    doc.y = currentY + 10;
  }

  // Financial Summary
  doc.moveDown();
  doc.fontSize(14).text('Resumo Financeiro:', { underline: true });
  doc.moveDown();

  const summaryX = 350;
  const totalWeight = (budget as any).totalWeightCalculation || 0;
  
  if (totalWeight > 0) {
    doc.fontSize(12).text(`Peso Bruto Total: ${totalWeight.toFixed(2)}kg`, summaryX, doc.y);
    doc.moveDown(0.5);
  }

  doc.font('Helvetica-Bold').fontSize(14).text(`Total do Orçamento: R$ ${budget.totalPrice.toFixed(2)}`, summaryX, doc.y);
  doc.font('Helvetica'); // Reset font

  if (budget.observations) {
    doc.moveDown();
    doc.fontSize(14).text('Observações:', { underline: true });
    doc.fontSize(12).text(budget.observations);
  }

  // Footer
  doc.moveDown();
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown();
  doc.fontSize(10).text(`Este orçamento é válido por ${budget.validityDays} dias a partir da data de emissão.`, { align: 'center' });

  logger.info('Finalizando documento PDF', { budgetId });
  doc.end();
  });
  } catch (error: any) {
    logger.error('Erro na geração do PDF', { budgetId, error: error.message });
    throw error;
  }
};
