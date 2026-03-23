'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Card, Button, Input } from '@/components/UI';
import { Save, Building2, Mail, Phone, Percent } from 'lucide-react';
import { cn } from '@/utils/cn';

interface TenantSettings {
  name: string;
  email: string;
  phone: string;
  document: string;
  address: {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  settings: {
    defaultMargin: number;
    currency: string;
  };
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<TenantSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get('settings');
      setSettings(response.data.tenant);
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      await api.put('settings', settings);
      setMessage({ type: 'success', text: 'Configurações salvas com sucesso!' });
      localStorage.setItem('tenant', JSON.stringify(settings));
    } catch {
      setMessage({ type: 'error', text: 'Erro ao salvar configurações.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Carregando...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-center">Configurações da Empresa</h1>
        <p className="text-muted-foreground text-sm text-center">Gerencie os dados da sua empresa e padrões do sistema.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card title="Dados Gerais">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nome da Empresa"
              value={settings?.name}
              onChange={(e) => setSettings({ ...settings!, name: e.target.value })}
              icon={Building2}
            />
            <Input
              label="E-mail de Contato"
              value={settings?.email}
              onChange={(e) => setSettings({ ...settings!, email: e.target.value })}
              icon={Mail}
            />
            <Input
              label="Telefone"
              value={settings?.phone}
              onChange={(e) => setSettings({ ...settings!, phone: e.target.value })}
              icon={Phone}
            />
            <Input
              label="CNPJ / CPF"
              value={settings?.document}
              disabled
            />
          </div>
        </Card>

        <Card title="Padrões de Orçamento">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Margem de Lucro Padrão (%)"
              type="number"
              value={settings?.settings.defaultMargin}
              onChange={(e) => setSettings({ 
                ...settings!, 
                settings: { ...settings!.settings, defaultMargin: Number(e.target.value) } 
              })}
              icon={Percent}
            />
            <Input
              label="Moeda"
              value={settings?.settings.currency || 'BRL'}
              disabled
            />
          </div>
        </Card>

        {message.text && (
          <div className={cn(
            "p-3 rounded-lg text-sm font-medium border text-center",
            message.type === 'success' ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"
          )}>
            {message.text}
          </div>
        )}

        <div className="flex justify-end">
          <Button type="submit" isLoading={saving} className="px-8">
            <Save className="w-4 h-4 mr-2" />
            Salvar Alterações
          </Button>
        </div>
      </form>
    </div>
  );
}
