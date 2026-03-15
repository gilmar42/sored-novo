'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Card, Button, Input, Modal } from '@/components/UI';
import { Search, Plus, Edit2, Trash2, Package, Tag, Ruler, DollarSign, Calculator, Layers, Box } from 'lucide-react';
import { formatCurrency, cn } from '@/utils/cn';
import { parseFraction } from '@/utils/measurements';

interface Material {
  _id: string;
  name: string;
  category?: string;
  unitOfMeasure: string;
  unitCost: number;
  itemType: 'material' | 'component';
  size?: string;
  isActive: boolean;
}

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeType, setActiveType] = useState<'material' | 'component'>('material');
  
  const initialFormData = {
    name: '',
    category: '',
    unitOfMeasure: 'un',
    unitCost: '',
    basePrice: '',
    basePriceUnit: 'un', // un, kg, m, m³
    length: '',
    lengthUnit: 'mm',
    width: '',
    widthUnit: 'mm',
    diameter: '',
    diameterUnit: 'mm',
    weight: '',
    weightUnit: 'kg',
    volume: '',
    volumeUnit: 'm³',
    size: '',
    itemType: 'material' as 'material' | 'component'
  };

  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    fetchMaterials();
  }, []);

  // Update itemType when activeType changes
  useEffect(() => {
    setFormData(prev => ({ ...prev, itemType: activeType }));
  }, [activeType]);

  // Cálculo dinâmico do custo unitário
  useEffect(() => {
    if (!formData.basePrice) return;

    const basePrice = parseFloat(formData.basePrice);
    if (isNaN(basePrice)) return;

    let calculatedCost = 0;

    if (formData.basePriceUnit === 'un') {
      calculatedCost = basePrice;
    } else if (formData.basePriceUnit === 'kg' && formData.weight) {
      const weight = parseFraction(formData.weight);
      const factor = formData.weightUnit === 'g' ? 0.001 : 1;
      calculatedCost = basePrice * weight * factor;
    } else if (formData.basePriceUnit === 'm' && formData.length) {
      const length = parseFraction(formData.length);
      const factor = formData.lengthUnit === 'mm' ? 0.001 : formData.lengthUnit === 'cm' ? 0.01 : 1;
      calculatedCost = basePrice * length * factor;
    } else if (formData.basePriceUnit === 'm³' && formData.volume) {
      const volume = parseFraction(formData.volume);
      const factor = formData.volumeUnit === 'cm³' ? 0.000001 : formData.volumeUnit === 'l' ? 0.001 : 1;
      calculatedCost = basePrice * volume * factor;
    }

    if (calculatedCost > 0) {
      setFormData(prev => ({ ...prev, unitCost: calculatedCost.toFixed(2) }));
    }
  }, [
    formData.basePrice, 
    formData.basePriceUnit, 
    formData.weight, 
    formData.weightUnit, 
    formData.length, 
    formData.lengthUnit, 
    formData.volume, 
    formData.volumeUnit
  ]);

  const fetchMaterials = async () => {
    try {
      const response = await api.get('materials');
      setMaterials(response.data.materials || []);
    } catch (error) {
      console.error('Erro ao buscar materiais:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setActiveType('material');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('materials', {
        ...formData,
        unitCost: parseFloat(formData.unitCost),
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        diameter: formData.diameter ? parseFraction(formData.diameter.toString()) : undefined,
        volume: formData.volume ? parseFloat(formData.volume) : undefined,
        dimensions: (formData.length || formData.width) ? {
          length: formData.length ? parseFloat(formData.length) : 0,
          lengthUnit: formData.lengthUnit,
          width: formData.width ? parseFloat(formData.width) : 0,
          widthUnit: formData.widthUnit,
          height: 0,
          heightUnit: 'mm'
        } : undefined
      });
      setIsModalOpen(false);
      resetForm();
      fetchMaterials();
    } catch (error) {
      console.error('Erro ao criar item:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredMaterials = materials.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.itemType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Materiais e Componentes</h1>
          <p className="text-muted-foreground text-sm">Gerencie o catálogo de insumos e componentes de produto.</p>
        </div>
        <Button className="shrink-0" onClick={() => { resetForm(); setIsModalOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Item
        </Button>
      </div>

      <Card className="!p-0 overflow-hidden">
        <div className="p-4 border-b border-border bg-card/30">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar item ou categoria..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/30 border-b border-border">
                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Item</th>
                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Categoria / Tamanho</th>
                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Unidade</th>
                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Custo Unitário</th>
                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">Carregando itens...</td>
                </tr>
              ) : filteredMaterials.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">Nenhum item encontrado.</td>
                </tr>
              ) : (
                filteredMaterials.map((m) => (
                  <tr key={m._id} className="hover:bg-accent/10 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className={cn(
                          "w-8 h-8 rounded flex items-center justify-center mr-3",
                          m.itemType === 'component' ? "bg-amber-500/10 text-amber-400" : "bg-indigo-500/10 text-indigo-400"
                        )}>
                          {m.itemType === 'component' ? <Layers className="w-4 h-4" /> : <Package className="w-4 h-4" />}
                        </div>
                        <div className="font-semibold">{m.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full",
                        m.itemType === 'component' ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" : "bg-indigo-500/10 text-indigo-500 border border-indigo-500/20"
                      )}>
                        {m.itemType === 'component' ? 'Componente' : 'Material'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{m.category || 'Geral'}</span>
                        {m.size && <span className="text-[10px] text-muted-foreground">Tamanho: {m.size}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {m.unitOfMeasure}
                    </td>
                    <td className="px-6 py-4 font-medium text-emerald-400">
                      {formatCurrency(m.unitCost)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 text-muted-foreground hover:text-indigo-400 rounded-md hover:bg-indigo-500/10 transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 text-muted-foreground hover:text-red-400 rounded-md hover:bg-red-500/10 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={activeType === 'component' ? "Novo Componente de Produto" : "Novo Material"}
      >
        <div className="flex p-1 bg-slate-900/50 rounded-lg mb-6 border border-border/50">
          <button
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all",
              activeType === 'material' ? "bg-indigo-600 text-white shadow-lg" : "text-muted-foreground hover:text-white"
            )}
            onClick={() => setActiveType('material')}
          >
            <Package className="w-4 h-4" />
            Material
          </button>
          <button
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all",
              activeType === 'component' ? "bg-amber-600 text-white shadow-lg" : "text-muted-foreground hover:text-white"
            )}
            onClick={() => setActiveType('component')}
          >
            <Layers className="w-4 h-4" />
            Componente
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
          <Input
            label="Nome do Item"
            placeholder={activeType === 'component' ? "Ex: Parafuso Allen M6" : "Ex: Chapa de Aço 1020"}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            icon={activeType === 'component' ? Layers : Package}
            required
          />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Categoria"
              placeholder="Ex: Metais, Plásticos"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              icon={Tag}
            />
            <Input
              label="Unidade de Medida"
              placeholder="Ex: kg, m, un"
              value={formData.unitOfMeasure}
              onChange={(e) => setFormData({ ...formData, unitOfMeasure: e.target.value })}
              icon={Ruler}
              required
            />
          </div>

          <div className="pt-4 border-t border-border space-y-4">
            <h4 className={cn(
              "text-sm font-semibold uppercase tracking-wider flex items-center gap-2",
              activeType === 'component' ? "text-amber-400" : "text-indigo-400"
            )}>
              <Box className="w-4 h-4" />
              Especificações Técnicas
            </h4>
            
            {activeType === 'component' ? (
              // FORMULÁRIO DE COMPONENTES
              <div className="space-y-4">
                <Input
                  label="Tamanho"
                  placeholder="Ex: M6x20, 1/2 polegada"
                  value={formData.size}
                  onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Diâmetro</label>
                    <div className="flex gap-2">
                       <Input
                        type="text"
                        placeholder="0.00"
                        value={formData.diameter}
                        onChange={(e) => setFormData({ ...formData, diameter: e.target.value })}
                        className="flex-1"
                      />
                      <select 
                        className="bg-slate-900 border border-input rounded-lg px-2 text-xs"
                        value={formData.diameterUnit}
                        onChange={(e) => setFormData({ ...formData, diameterUnit: e.target.value })}
                      >
                        <option value="mm">mm</option>
                        <option value="cm">cm</option>
                        <option value="pol">pol</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Largura</label>
                    <div className="flex gap-2">
                       <Input
                        type="number"
                        placeholder="0.00"
                        value={formData.width}
                        onChange={(e) => setFormData({ ...formData, width: e.target.value })}
                        className="flex-1"
                      />
                      <select 
                        className="bg-slate-900 border border-input rounded-lg px-2 text-xs"
                        value={formData.widthUnit}
                        onChange={(e) => setFormData({ ...formData, widthUnit: e.target.value })}
                      >
                        <option value="mm">mm</option>
                        <option value="cm">cm</option>
                        <option value="m">m</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Peso Unitário</label>
                  <div className="flex gap-2">
                     <Input
                      type="number"
                      placeholder="0.00"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                      className="flex-1"
                    />
                    <select 
                      className="bg-slate-900 border border-input rounded-lg px-2 text-xs"
                      value={formData.weightUnit}
                      onChange={(e) => setFormData({ ...formData, weightUnit: e.target.value })}
                    >
                      <option value="kg">kg</option>
                      <option value="g">g</option>
                    </select>
                  </div>
                </div>
              </div>
            ) : (
              // FORMULÁRIO DE MATERIAIS
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Peso</label>
                  <div className="flex gap-2">
                     <Input
                      type="number"
                      placeholder="0.00"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                      className="flex-1"
                    />
                    <select 
                      className="bg-slate-900 border border-input rounded-lg px-2 text-xs"
                      value={formData.weightUnit}
                      onChange={(e) => setFormData({ ...formData, weightUnit: e.target.value })}
                    >
                      <option value="kg">kg</option>
                      <option value="g">g</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Comprimento</label>
                  <div className="flex gap-2">
                     <Input
                      type="number"
                      placeholder="0.00"
                      value={formData.length}
                      onChange={(e) => setFormData({ ...formData, length: e.target.value })}
                      className="flex-1"
                    />
                    <select 
                      className="bg-slate-900 border border-input rounded-lg px-2 text-xs"
                      value={formData.lengthUnit}
                      onChange={(e) => setFormData({ ...formData, lengthUnit: e.target.value })}
                    >
                      <option value="m">m</option>
                      <option value="cm">cm</option>
                      <option value="mm">mm</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-border space-y-4">
            <h4 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Financeiro
            </h4>
            
            <div className="grid grid-cols-3 gap-3 items-end">
              <div className="col-span-2">
                <Input
                  label="Preço de Referência (R$)"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.basePrice}
                  onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                />
              </div>
              <select 
                className="bg-slate-900/50 border border-input rounded-lg px-3 py-2 text-sm h-[38px] focus:ring-2 focus:ring-ring transition-all"
                value={formData.basePriceUnit}
                onChange={(e) => setFormData({ ...formData, basePriceUnit: e.target.value })}
              >
                <option value="un">por un</option>
                <option value="kg">por kg</option>
                <option value="m">por m</option>
                <option value="m³">por m³</option>
              </select>
            </div>

            <Input
              label="Custo Unitário Final (R$)"
              type="number"
              step="0.01"
              placeholder="Valor calculado..."
              value={formData.unitCost}
              onChange={(e) => setFormData({ ...formData, unitCost: e.target.value })}
              icon={Calculator}
              className="bg-emerald-500/5 border-emerald-500/20 font-bold text-emerald-400"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-6">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={submitting} className={cn(
              activeType === 'component' ? "bg-amber-600 hover:bg-amber-700" : ""
            )}>
              Salvar {activeType === 'component' ? 'Componente' : 'Material'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
