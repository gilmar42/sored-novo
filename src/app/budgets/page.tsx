'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Card, Button, Input, Modal } from '@/components/UI';
import {
  Plus, Search, FileText, Download, Eye, Pencil, Trash2,
  User, Tag, Package, Clock, Calculator, MessageCircle, ChevronDown, X
} from 'lucide-react';
import { formatCurrency, formatDate, cn } from '@/utils/cn';

interface Budget {
  _id: string;
  number: string;
  title: string;
  status: 'draft' | 'sent' | 'approved' | 'rejected' | 'completed';
  totalPrice: number;
  createdAt: string;
  clientId: { _id: string; name: string; email: string; phone?: string; document?: string };
}

interface BudgetMaterial {
  materialId: { _id: string; name: string; unitOfMeasure: string } | string;
  name?: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

interface BudgetLabor {
  laborId: { _id: string; name: string } | string;
  name?: string;
  hours: number;
  costPerHour: number;
  totalCost: number;
}

interface BudgetMachine {
  machineId: { _id: string; name: string } | string;
  name?: string;
  hours: number;
  costPerHour: number;
  totalCost: number;
}

interface BudgetDetail extends Budget {
  description?: string;
  materials: BudgetMaterial[];
  labor: BudgetLabor[];
  machines: BudgetMachine[];
  marginPercentage: number;
  freightCost?: number;
  additionalCosts?: number;
  validityDays: number;
  observations?: string;
}

interface FormData {
  clientId: string;
  title: string;
  description: string;
  materials: { materialId: string; name: string; quantity: number; unitCost: number; totalCost: number }[];
  labor: { laborId: string; name: string; hours: number; costPerHour: number; totalCost: number }[];
  machines: { machineId: string; name: string; hours: number; costPerHour: number; totalCost: number }[];
  marginPercentage: number;
  freightCost: number;
  additionalCosts: number;
  validityDays: number;
  observations: string;
  status: 'draft' | 'sent' | 'approved' | 'rejected' | 'completed';
}

const EMPTY_FORM: FormData = {
  clientId: '',
  title: '',
  description: '',
  materials: [],
  labor: [],
  machines: [],
  marginPercentage: 20,
  freightCost: 0,
  additionalCosts: 0,
  validityDays: 15,
  observations: '',
  status: 'draft',
};

const statusMap: Record<string, { label: string; color: string }> = {
  draft:     { label: 'Rascunho',  color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
  sent:      { label: 'Enviado',   color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  approved:  { label: 'Aprovado',  color: 'bg-green-500/10 text-green-400 border-green-500/20' },
  rejected:  { label: 'Rejeitado', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
  completed: { label: 'Concluído', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
};

const STATUS_OPTIONS = Object.entries(statusMap).map(([value, { label }]) => ({ value, label }));

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [clients, setClients] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [labor, setLabor] = useState<any[]>([]);
  const [machines, setMachines] = useState<any[]>([]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<BudgetDetail | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingBudget, setDeletingBudget] = useState<Budget | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);

  useEffect(() => { fetchBudgets(); }, []);

  const fetchBudgets = async () => {
    try {
      const response = await api.get('/budgets');
      setBudgets(response.data.budgets || []);
    } catch (error) {
      console.error('Erro ao buscar orçamentos:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDependencies = async () => {
    try {
      const [cRes, mRes, lRes, macRes] = await Promise.all([
        api.get('/clients'),
        api.get('/materials'),
        api.get('/labor'),
        api.get('/machines'),
      ]);
      setClients(cRes.data.clients || []);
      setMaterials(mRes.data.materials || []);
      setLabor(lRes.data.labor || []);
      setMachines(macRes.data.machines || []);
    } catch (error) {
      console.error('Erro ao buscar dependências:', error);
    }
  };

  const openNew = async () => {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    await loadDependencies();
    setIsFormOpen(true);
  };

  const openEdit = async (budget: Budget) => {
    await loadDependencies();
    try {
      const res = await api.get(`/budgets/${budget._id}`);
      const b: BudgetDetail = res.data.budget;
      setFormData({
        clientId: b.clientId._id,
        title: b.title,
        description: b.description || '',
        materials: b.materials.map((m: any) => ({
          materialId: m.materialId?._id || m.materialId,
          name: m.materialId?.name || '',
          quantity: m.quantity,
          unitCost: m.unitCost,
          totalCost: m.totalCost,
        })),
        labor: b.labor.map((l: any) => ({
          laborId: l.laborId?._id || l.laborId,
          name: l.laborId?.name || '',
          hours: l.hours,
          costPerHour: l.costPerHour,
          totalCost: l.totalCost,
        })),
        machines: b.machines.map((m: any) => ({
          machineId: m.machineId?._id || m.machineId,
          name: m.machineId?.name || '',
          hours: m.hours,
          costPerHour: m.costPerHour,
          totalCost: m.totalCost,
        })),
        marginPercentage: b.marginPercentage,
        freightCost: b.freightCost || 0,
        additionalCosts: b.additionalCosts || 0,
        validityDays: b.validityDays,
        observations: b.observations || '',
        status: b.status,
      });
      setEditingId(b._id);
      setIsFormOpen(true);
    } catch (error) {
      console.error('Erro ao carregar orçamento para edição:', error);
    }
  };

  const handleView = async (budget: Budget) => {
    try {
      const res = await api.get(`/budgets/${budget._id}`);
      setSelectedBudget(res.data.budget);
      setViewModalOpen(true);
    } catch (error) {
      console.error('Erro ao buscar detalhes do orçamento:', error);
    }
  };

  const addItem = (type: 'materials' | 'labor' | 'machines', item: any) => {
    const newItem =
      type === 'materials'
        ? { materialId: item._id, name: item.name, quantity: 1, unitCost: item.unitCost, totalCost: item.unitCost }
        : type === 'labor'
        ? { laborId: item._id, name: item.name, hours: 1, costPerHour: item.costPerHour, totalCost: item.costPerHour }
        : { machineId: item._id, name: item.name, hours: 1, costPerHour: item.costPerHour, totalCost: item.costPerHour };
    setFormData((prev) => ({ ...prev, [type]: [...(prev[type] as any[]), newItem] }));
  };

  const removeItem = (type: 'materials' | 'labor' | 'machines', index: number) => {
    setFormData((prev) => {
      const list = [...(prev[type] as any[])];
      list.splice(index, 1);
      return { ...prev, [type]: list };
    });
  };

  const updateItem = (type: 'materials' | 'labor' | 'machines', index: number, field: string, value: any) => {
    setFormData((prev) => {
      const list = [...(prev[type] as any[])];
      const item = { ...list[index], [field]: value };
      if (type === 'materials') item.totalCost = (item.quantity || 0) * (item.unitCost || 0);
      else item.totalCost = (item.hours || 0) * (item.costPerHour || 0);
      list[index] = item;
      return { ...prev, [type]: list };
    });
  };

  const calculateTotals = () => {
    const mat = formData.materials.reduce((s, i) => s + (i.totalCost || 0), 0);
    const lab = formData.labor.reduce((s, i) => s + (i.totalCost || 0), 0);
    const mac = formData.machines.reduce((s, i) => s + (i.totalCost || 0), 0);
    const subtotal = mat + lab + mac + (formData.freightCost || 0) + (formData.additionalCosts || 0);
    const total = subtotal * (1 + (formData.marginPercentage / 100));
    return { subtotal, total };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientId) return alert('Selecione um cliente');
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        materials: formData.materials.map(({ name: _n, ...rest }) => rest),
        labor: formData.labor.map(({ name: _n, ...rest }) => rest),
        machines: formData.machines.map(({ name: _n, ...rest }) => rest),
      };
      if (editingId) {
        await api.put(`/budgets/${editingId}`, payload);
      } else {
        await api.post('/budgets', payload);
      }
      setIsFormOpen(false);
      setFormData(EMPTY_FORM);
      setEditingId(null);
      fetchBudgets();
    } catch (error) {
      console.error('Erro ao salvar orçamento:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (budget: Budget, newStatus: string) => {
    try {
      await api.put(`/budgets/${budget._id}`, { status: newStatus });
      setBudgets((prev) => prev.map((b) => b._id === budget._id ? { ...b, status: newStatus as Budget['status'] } : b));
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const confirmDelete = (budget: Budget) => {
    setDeletingBudget(budget);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingBudget) return;
    setDeleting(true);
    try {
      await api.delete(`/budgets/${deletingBudget._id}`);
      setBudgets((prev) => prev.filter((b) => b._id !== deletingBudget._id));
      setDeleteModalOpen(false);
      setDeletingBudget(null);
    } catch (error) {
      console.error('Erro ao excluir orçamento:', error);
    } finally {
      setDeleting(false);
    }
  };

  const handleDownloadPDF = async (id: string, number: string) => {
    try {
      const response = await api.post(`pdf/budgets/${id}/generate`);
      if (!response.data.pdfUrl) throw new Error(response.data.message || 'Erro ao gerar PDF');
      const { pdfUrl } = response.data;
      
      // Determinar o baseURL para remover do link absoluto (se necessário)
      const configBaseURL = process.env.NEXT_PUBLIC_API_URL || '';
      const fallbackBaseURL = typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}/api` : '';
      
      const baseURL = configBaseURL || fallbackBaseURL;
      let relativePath = pdfUrl.includes(baseURL) ? pdfUrl.replace(baseURL, '') : pdfUrl.split('/api')[1] || pdfUrl;
      
      // Remover barra inicial para evitar barra dupla com o baseURL que já termina em /
      if (relativePath.startsWith('/')) {
        relativePath = relativePath.substring(1);
      }

      const pdfResponse = await api.get(relativePath, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([pdfResponse.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `orcamento_${number}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error: any) {
      alert(`Erro ao baixar PDF: ${error.message || 'Erro desconhecido'}`);
    }
  };

  const handleShareWhatsApp = async (id: string, number: string) => {
    try {
      const response = await api.post(`/pdf/budgets/${id}/generate`);
      if (!response.data.pdfUrl) throw new Error(response.data.message || 'Erro ao gerar PDF');
      const message = `Olá! Aqui está o orçamento ${number}: ${response.data.pdfUrl}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    } catch (error: any) {
      alert(`Erro ao compartilhar: ${error.message || 'Erro desconhecido'}`);
    }
  };

  const filteredBudgets = budgets.filter((b) => {
    const matchSearch =
      b.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.clientId?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus ? b.status === filterStatus : true;
    return matchSearch && matchStatus;
  });

  const { subtotal, total } = calculateTotals();

  const FormSection = ({ title, color, icon: Icon, type, list, catalog }: any) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className={cn('flex items-center text-sm font-bold uppercase tracking-wider', color)}>
          <Icon className="w-4 h-4 mr-2" /> {title}
        </h4>
        <select
          className="text-xs bg-slate-800 border border-border/30 rounded px-2 py-1"
          onChange={(e) => { const item = catalog.find((c: any) => c._id === e.target.value); if (item) addItem(type, item); }}
          value=""
        >
          <option value="">+ Adicionar</option>
          {catalog.map((c: any) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
      </div>
      <div className="space-y-2">
        {list.map((item: any, index: number) => (
          <div key={index} className="flex items-center gap-2 bg-slate-800/40 p-2 rounded-lg border border-border/50">
            <div className="flex-1 text-sm font-medium truncate">{item.name}</div>
            {type === 'materials' ? (
              <>
                <span className="text-xs text-muted-foreground shrink-0">Qtd</span>
                <div className="w-20">
                  <Input type="number" size="sm" value={item.quantity}
                    onChange={(e) => updateItem(type, index, 'quantity', parseFloat(e.target.value))} className="h-7 py-0" />
                </div>
                <span className="text-xs text-muted-foreground shrink-0">R$/un</span>
                <div className="w-24">
                  <Input type="number" size="sm" value={item.unitCost}
                    onChange={(e) => updateItem(type, index, 'unitCost', parseFloat(e.target.value))} className="h-7 py-0" />
                </div>
              </>
            ) : (
              <>
                <span className="text-xs text-muted-foreground shrink-0">Horas</span>
                <div className="w-20">
                  <Input type="number" size="sm" value={item.hours}
                    onChange={(e) => updateItem(type, index, 'hours', parseFloat(e.target.value))} className="h-7 py-0" />
                </div>
                <span className="text-xs text-muted-foreground shrink-0">R$/h</span>
                <div className="w-24">
                  <Input type="number" size="sm" value={item.costPerHour}
                    onChange={(e) => updateItem(type, index, 'costPerHour', parseFloat(e.target.value))} className="h-7 py-0" />
                </div>
              </>
            )}
            <div className="w-24 text-right text-xs font-mono text-indigo-300 shrink-0">{formatCurrency(item.totalCost)}</div>
            <button type="button" onClick={() => removeItem(type, index)} className="text-red-400 hover:text-red-300 p-1 shrink-0">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        {list.length === 0 && (
          <p className="text-xs text-muted-foreground italic pl-1">Nenhum item adicionado.</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Orçamentos</h1>
          <p className="text-muted-foreground text-sm">Crie e gerencie propostas comerciais.</p>
        </div>
        <Button className="shrink-0" onClick={openNew}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Orçamento
        </Button>
      </div>

      <Card className="!p-0 overflow-hidden">
        <div className="p-4 border-b border-border bg-card/30 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por número, título ou cliente..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative">
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <select
              className="appearance-none bg-slate-900/50 border border-input rounded-lg px-3 py-2 text-sm pr-9 focus:ring-2 focus:ring-ring transition-all"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">Todos os status</option>
              {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/30 border-b border-border">
                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Número</th>
                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Título / Cliente</th>
                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Valor Total</th>
                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">Carregando orçamentos...</td></tr>
              ) : filteredBudgets.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">Nenhum orçamento encontrado.</td></tr>
              ) : (
                filteredBudgets.map((b) => (
                  <tr key={b._id} className="hover:bg-accent/10 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded bg-indigo-500/10 flex items-center justify-center mr-3 text-indigo-400">
                          <FileText className="w-4 h-4" />
                        </div>
                        <span className="font-mono font-medium">{b.number}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold truncate max-w-[200px]">{b.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{b.clientId?.name}</div>
                    </td>
                    <td className="px-6 py-4 font-semibold">{formatCurrency(b.totalPrice)}</td>
                    <td className="px-6 py-4">
                      <div className="relative group/status">
                        <select
                          value={b.status}
                          onChange={(e) => handleStatusChange(b, e.target.value)}
                          className={cn(
                            'appearance-none cursor-pointer text-xs font-medium border rounded-full px-2.5 py-0.5 pr-6 focus:outline-none focus:ring-2 focus:ring-ring transition-all bg-transparent',
                            statusMap[b.status].color
                          )}
                        >
                          {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                        <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none opacity-60" />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleDownloadPDF(b._id, b.number)}
                          className="p-1.5 text-slate-400 hover:text-indigo-400 rounded-md hover:bg-indigo-500/10 transition-colors" title="Baixar PDF">
                          <Download className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleShareWhatsApp(b._id, b.number)}
                          className="p-1.5 text-slate-400 hover:text-green-400 rounded-md hover:bg-green-500/10 transition-colors" title="WhatsApp">
                          <MessageCircle className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleView(b)}
                          className="p-1.5 text-slate-400 hover:text-sky-400 rounded-md hover:bg-sky-500/10 transition-colors" title="Visualizar">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => openEdit(b)}
                          className="p-1.5 text-slate-400 hover:text-amber-400 rounded-md hover:bg-amber-500/10 transition-colors" title="Editar">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => confirmDelete(b)}
                          className="p-1.5 text-slate-400 hover:text-red-400 rounded-md hover:bg-red-500/10 transition-colors" title="Excluir">
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

      {/* Modal Criar / Editar */}
      <Modal isOpen={isFormOpen} onClose={() => { setIsFormOpen(false); setEditingId(null); setFormData(EMPTY_FORM); }}
        title={editingId ? 'Editar Orçamento' : 'Novo Orçamento'}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Cliente</label>
              <select
                className="w-full bg-slate-900/50 border border-input rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring transition-all"
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                required
              >
                <option value="">Selecione um cliente...</option>
                {clients.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <Input label="Título do Projeto" placeholder="Ex: Reforma Galpão B"
              value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              icon={Tag} required />
          </div>

          <Input label="Descrição / Observações" placeholder="Detalhes técnicos ou escopo do trabalho..."
            value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            icon={FileText} multiline />

          <div className="space-y-6 pt-2">
            <FormSection title="Materiais" color="text-indigo-400" icon={Package} type="materials"
              list={formData.materials} catalog={materials} />
            <FormSection title="Mão de Obra" color="text-yellow-500" icon={Clock} type="labor"
              list={formData.labor} catalog={labor} />
            <FormSection title="Máquinas" color="text-purple-400" icon={Calculator} type="machines"
              list={formData.machines} catalog={machines} />
          </div>

          <div className="pt-4 border-t border-border space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Input label="Margem de Lucro (%)" type="number" value={formData.marginPercentage}
                onChange={(e) => setFormData({ ...formData, marginPercentage: parseFloat(e.target.value) || 0 })} />
              <Input label="Validade (dias)" type="number" value={formData.validityDays}
                onChange={(e) => setFormData({ ...formData, validityDays: parseInt(e.target.value) || 0 })} />
              <Input label="Frete (R$)" type="number" value={formData.freightCost}
                onChange={(e) => setFormData({ ...formData, freightCost: parseFloat(e.target.value) || 0 })} />
              <Input label="Custos Adicionais (R$)" type="number" value={formData.additionalCosts}
                onChange={(e) => setFormData({ ...formData, additionalCosts: parseFloat(e.target.value) || 0 })} />
            </div>

            {editingId && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Status</label>
                <select
                  className="w-full bg-slate-900/50 border border-input rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring transition-all"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as FormData['status'] })}
                >
                  {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            )}

            <Input label="Observações Finais" placeholder="Condições de pagamento, prazo de entrega..."
              value={formData.observations} onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
              multiline />

            <div className="bg-slate-900/80 p-5 rounded-xl border border-indigo-500/20">
              <div className="flex justify-between text-sm text-muted-foreground mb-1">
                <span>Subtotal (Custo Direto)</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-emerald-400 mb-3">
                <span>Lucro ({formData.marginPercentage}%)</span>
                <span>{formatCurrency(total - subtotal)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold text-white border-t border-slate-800 pt-3">
                <span>Total do Orçamento</span>
                <span className="text-indigo-400">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" type="button" onClick={() => { setIsFormOpen(false); setEditingId(null); setFormData(EMPTY_FORM); }}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={submitting} size="lg" className="px-8">
              {editingId ? 'Salvar Alterações' : 'Criar Orçamento'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Visualização */}
      <Modal isOpen={viewModalOpen} onClose={() => setViewModalOpen(false)} title={`Orçamento ${selectedBudget?.number}`}>
        {selectedBudget && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-1">Cliente</h4>
                <p className="text-lg font-medium">{selectedBudget.clientId.name}</p>
                <p className="text-sm text-muted-foreground">{selectedBudget.clientId.email}</p>
                {selectedBudget.clientId.phone && <p className="text-sm text-muted-foreground">{selectedBudget.clientId.phone}</p>}
              </div>
              <div>
                <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-1">Status</h4>
                <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border', statusMap[selectedBudget.status].color)}>
                  {statusMap[selectedBudget.status].label}
                </span>
                <p className="text-sm text-muted-foreground mt-2">Criado em {formatDate(selectedBudget.createdAt)}</p>
                <p className="text-sm text-muted-foreground">Validade: {selectedBudget.validityDays} dias</p>
              </div>
            </div>

            {selectedBudget.description && (
              <div>
                <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-2">Descrição</h4>
                <p className="text-sm bg-slate-800/40 p-3 rounded-lg border border-border/50">{selectedBudget.description}</p>
              </div>
            )}

            {/* Tabela Unificada de Componentes do Produto */}
            {(() => {
              type ComponentItem = {
                type: string;
                typeColor: string;
                quantityOrHours: number;
                unitCostOrHour: number;
                totalCost: number;
                materialId?: string | { _id: string; name: string; unitOfMeasure: string };
                laborId?: string | { _id: string; name: string };
                machineId?: string | { _id: string; name: string };
              };
              const allComponents: ComponentItem[] = [
                ...selectedBudget.materials.map((item) => ({ ...item, type: 'Material', typeColor: 'text-indigo-400', quantityOrHours: item.quantity, unitCostOrHour: item.unitCost })),
                ...selectedBudget.labor.map((item) => ({ ...item, type: 'Mão de Obra', typeColor: 'text-yellow-400', quantityOrHours: item.hours, unitCostOrHour: item.costPerHour })),
                ...selectedBudget.machines.map((item) => ({ ...item, type: 'Máquina', typeColor: 'text-purple-400', quantityOrHours: item.hours, unitCostOrHour: item.costPerHour })),
              ];
              if (!allComponents.length) return null;
              return (
                <div>
                  <h5 className="flex items-center text-xs font-bold uppercase tracking-wider mb-3 text-slate-300">
                    <Package className="w-3.5 h-3.5 mr-2" /> Componentes do Produto
                  </h5>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border/50">
                          <th className="py-2 px-3 font-medium text-muted-foreground text-xs text-left">Tipo</th>
                          <th className="py-2 px-3 font-medium text-muted-foreground text-xs text-left">Item</th>
                          <th className="py-2 px-3 font-medium text-muted-foreground text-xs text-right">Qtd/Horas</th>
                          <th className="py-2 px-3 font-medium text-muted-foreground text-xs text-right">Custo Unit.</th>
                          <th className="py-2 px-3 font-medium text-muted-foreground text-xs text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allComponents.map((item, idx) => (
                          <tr key={idx} className="border-b border-border/20">
                            <td className={cn('py-2 px-3 font-medium', item.typeColor)}>{item.type}</td>
                            <td className="py-2 px-3 font-medium">
                              {(item.materialId as { name: string })?.name || (item.laborId as { name: string })?.name || (item.machineId as { name: string })?.name}
                            </td>
                            <td className="py-2 px-3 text-right">{item.quantityOrHours}</td>
                            <td className="py-2 px-3 text-right">{formatCurrency(item.unitCostOrHour)}</td>
                            <td className="py-2 px-3 text-right font-mono">{formatCurrency(item.totalCost)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}

            <div className="bg-slate-800/40 p-4 rounded-lg border border-border/50 space-y-2 text-sm">
              <h5 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-3">Resumo Financeiro</h5>
              <div className="flex justify-between"><span>Materiais:</span><span>{formatCurrency(selectedBudget.materials.reduce((s, i) => s + i.totalCost, 0))}</span></div>
              <div className="flex justify-between"><span>Mão de Obra:</span><span>{formatCurrency(selectedBudget.labor.reduce((s, i) => s + i.totalCost, 0))}</span></div>
              <div className="flex justify-between"><span>Máquinas:</span><span>{formatCurrency(selectedBudget.machines.reduce((s, i) => s + i.totalCost, 0))}</span></div>
              {(selectedBudget.freightCost || 0) > 0 && <div className="flex justify-between"><span>Frete:</span><span>{formatCurrency(selectedBudget.freightCost!)}</span></div>}
              {(selectedBudget.additionalCosts || 0) > 0 && <div className="flex justify-between"><span>Custos Adicionais:</span><span>{formatCurrency(selectedBudget.additionalCosts!)}</span></div>}
              <div className="flex justify-between font-medium border-t border-border/50 pt-2 mt-2 text-base">
                <span>Total do Orçamento:</span>
                <span className="font-bold text-indigo-400">{formatCurrency(selectedBudget.totalPrice)}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground"><span>Margem aplicada:</span><span>{selectedBudget.marginPercentage}%</span></div>
            </div>

            {selectedBudget.observations && (
              <div>
                <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-2">Observações</h4>
                <p className="text-sm bg-slate-800/40 p-3 rounded-lg border border-border/50">{selectedBudget.observations}</p>
              </div>
            )}

            <div className="flex flex-wrap justify-end gap-3 pt-4 border-t border-border/50">
              <Button variant="ghost" onClick={() => setViewModalOpen(false)}>Fechar</Button>
              <Button variant="outline" onClick={() => { setViewModalOpen(false); openEdit(selectedBudget); }}>
                <Pencil className="w-4 h-4 mr-2" /> Editar
              </Button>
              <Button onClick={() => handleDownloadPDF(selectedBudget._id, selectedBudget.number)}>
                <Download className="w-4 h-4 mr-2" /> Baixar PDF
              </Button>
              <Button onClick={() => handleShareWhatsApp(selectedBudget._id, selectedBudget.number)}>
                <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Confirmação de Exclusão */}
      <Modal isOpen={deleteModalOpen} onClose={() => { setDeleteModalOpen(false); setDeletingBudget(null); }} title="Confirmar Exclusão">
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja excluir o orçamento{' '}
            <span className="font-semibold text-foreground font-mono">{deletingBudget?.number}</span>
            {' '}— <span className="font-semibold text-foreground">{deletingBudget?.title}</span>?
            <br />Esta ação não pode ser desfeita.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => { setDeleteModalOpen(false); setDeletingBudget(null); }}>Cancelar</Button>
            <Button variant="danger" onClick={handleDelete} isLoading={deleting}>Excluir</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
