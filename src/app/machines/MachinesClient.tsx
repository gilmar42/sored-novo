'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Card, Button, Input, Modal } from '@/components/UI';
import { Plus, Edit2, Trash2, Wrench, FileText, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/utils/cn';

interface Machine {
  _id: string;
  name: string;
  description?: string;
  costPerHour: number;
  isActive: boolean;
}

export default function MachinesPage() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    costPerHour: ''
  });

  useEffect(() => {
    fetchMachines();
  }, []);

  const fetchMachines = async () => {
    try {
      const response = await api.get('machines');
      setMachines(response.data.machines || []);
    } catch (error) {
      console.error('Erro ao buscar máquinas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('machines', {
        ...formData,
        costPerHour: parseFloat(formData.costPerHour)
      });
      setIsModalOpen(false);
      setFormData({ name: '', description: '', costPerHour: '' });
      fetchMachines();
    } catch (error) {
      console.error('Erro ao criar máquina:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Máquinas</h1>
          <p className="text-muted-foreground text-sm">Controle os custos de hora máquina dos equipamentos.</p>
        </div>
        <Button className="shrink-0" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Máquina
        </Button>
      </div>

      <Card className="!p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/30 border-b border-border">
                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Máquina</th>
                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Descrição</th>
                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Custo/Hora</th>
                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">Carregando dados...</td>
                </tr>
              ) : machines.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">Nenhuma máquina cadastrada.</td>
                </tr>
              ) : (
                machines.map((m) => (
                  <tr key={m._id} className="hover:bg-accent/10 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded bg-purple-500/10 flex items-center justify-center mr-3 text-purple-400">
                          <Wrench className="w-4 h-4" />
                        </div>
                        <div className="font-semibold">{m.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground max-w-xs truncate">
                      {m.description || '-'}
                    </td>
                    <td className="px-6 py-4 font-medium text-purple-400">
                      {formatCurrency(m.costPerHour)}/h
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
        title="Nova Máquina / Equipamento"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nome da Máquina"
            placeholder="Ex: Torno CNC"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            icon={Wrench}
            required
          />
          
          <Input
            label="Descrição"
            placeholder="Especificações técnicas ou uso..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            icon={FileText}
            multiline
          />

          <Input
            label="Custo por Hora (R$)"
            type="number"
            step="0.01"
            placeholder="0,00"
            value={formData.costPerHour}
            onChange={(e) => setFormData({ ...formData, costPerHour: e.target.value })}
            icon={DollarSign}
            required
          />

          <div className="flex justify-end gap-3 pt-6">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={submitting}>
              Salvar Máquina
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
