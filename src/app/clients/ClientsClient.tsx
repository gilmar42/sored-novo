'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Card, Button, Input, Modal } from '@/components/UI';
import { Plus, Search, Edit2, Trash2, Mail, Phone, MapPin, User, FileText } from 'lucide-react';
import { formatDate } from '@/utils/cn';

interface Client {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  document?: string;
  address?: {
    street: string;
    city: string;
    state: string;
  };
  isActive: boolean;
  createdAt: string;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    document: '',
    street: '',
    city: '',
    state: ''
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await api.get('clients');
      setClients(response.data.clients || []);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('clients', {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        document: formData.document,
        address: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          number: 'S/N', // Defaulting since form is simple
          neighborhood: 'N/A',
          zipCode: '00000-000'
        }
      });
      setIsModalOpen(false);
      setFormData({ name: '', email: '', phone: '', document: '', street: '', city: '', state: '' });
      fetchClients();
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.document?.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Clientes</h1>
          <p className="text-muted-foreground text-sm">Gerencie seus clientes e visualize seus dados.</p>
        </div>
        <Button className="shrink-0" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Cliente
        </Button>
      </div>

      <Card className="!p-0 overflow-hidden">
        <div className="p-4 border-b border-border bg-card/30">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por nome, email ou documento..." 
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
                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contato</th>
                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Endereço</th>
                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cadastro</th>
                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">Carregando clientes...</td>
                </tr>
              ) : filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">Nenhum cliente encontrado.</td>
                </tr>
              ) : (
                filteredClients.map((client) => (
                  <tr key={client._id} className="hover:bg-accent/10 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-semibold">{client.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{client.document || 'Sem documento'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {client.email && (
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Mail className="w-3 h-3 mr-1.5 opacity-60" />
                            {client.email}
                          </div>
                        )}
                        {client.phone && (
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Phone className="w-3 h-3 mr-1.5 opacity-60" />
                            {client.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="w-3.5 h-3.5 mr-1.5 opacity-60 text-indigo-400" />
                        {client.address ? `${client.address.city}, ${client.address.state}` : 'Não informado'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {formatDate(client.createdAt)}
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
        title="Novo Cliente"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nome / Razão Social"
              placeholder="Ex: Industrial ABC Ltda"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              icon={User}
              required
            />
            <Input
              label="CNPJ / CPF"
              placeholder="00.000.000/0000-00"
              value={formData.document}
              onChange={(e) => setFormData({ ...formData, document: e.target.value })}
              icon={FileText}
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="E-mail"
              type="email"
              placeholder="contato@empresa.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              icon={Mail}
            />
            <Input
              label="Telefone"
              placeholder="(00) 00000-0000"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              icon={Phone}
            />
          </div>

          <div className="space-y-4 pt-2 border-t border-border">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Endereço</h4>
            <Input
              label="Rua / Logradouro"
              placeholder="Rua das Indústrias, 123"
              value={formData.street}
              onChange={(e) => setFormData({ ...formData, street: e.target.value })}
              icon={MapPin}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Cidade"
                placeholder="São Paulo"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
              <Input
                label="Estado (UF)"
                placeholder="SP"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                maxLength={2}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={submitting}>
              Salvar Cliente
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
