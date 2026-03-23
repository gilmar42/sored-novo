'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Card, Button, Input } from '@/components/UI';
import { UserPlus, Building2, Mail, Lock, FileText, User, Zap, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function RegisterClient() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    tenantName: '',
    document: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<any[]>([]);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setFieldErrors([]);

    try {
      const normalizedEmail = formData.email.trim().toLowerCase();
      const payload = {
        tenantName: formData.tenantName,
        tenantEmail: normalizedEmail,
        tenantDocument: formData.document,
        userName: formData.name,
        userEmail: normalizedEmail,
        userPassword: formData.password
      };

      await api.post('auth/register', payload);
      router.push('/login?registered=true');
    } catch (err: any) {
      const data = err.response?.data;
      setError(data?.message || 'Erro ao realizar cadastro');
      if (data?.errors) {
        setFieldErrors(data.errors);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20 relative overflow-hidden bg-background">
      <div className="absolute top-[-5%] left-[-5%] w-[45%] h-[45%] bg-indigo-500/10 rounded-full blur-[130px] -z-10 animate-pulse" />
      <div className="absolute bottom-[-5%] right-[-5%] w-[45%] h-[45%] bg-purple-500/10 rounded-full blur-[130px] -z-10" />

      <div className="w-full max-w-xl animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block hover:scale-105 transition-transform">
            <h1 className="text-4xl font-extrabold mb-2 tracking-tighter">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                SORED
              </span>
            </h1>
          </Link>
          <p className="text-muted-foreground font-medium flex items-center justify-center gap-2">
            <Zap className="w-4 h-4 text-emerald-400 fill-emerald-400" />
            Inicie sua jornada industrial
          </p>
        </div>

        <Card className="glass-card shadow-2xl border-indigo-500/10 backdrop-blur-xl p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-1">Cadastre-se</h2>
            <p className="text-sm text-muted-foreground">Registre sua empresa e comece a gerar orçamentos.</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Seu Nome"
                placeholder="Ex: João Silva"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                icon={User}
                required
                className="bg-slate-900/50"
              />
              <Input
                label="Seu E-mail"
                type="email"
                placeholder="Ex: joao@empresa.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                icon={Mail}
                required
                className="bg-slate-900/50"
              />
            </div>

            <div className="space-y-4 pt-2 border-t border-indigo-500/10">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Dados da Empresa
              </h3>

              <Input
                label="Nome da Empresa (Tenant)"
                placeholder="Ex: Indústria Metalúrgica XYZ"
                value={formData.tenantName}
                onChange={(e) => setFormData({ ...formData, tenantName: e.target.value })}
                icon={Building2}
                required
                className="bg-slate-900/50"
              />

              <Input
                label="CNPJ / Documento (Opcional)"
                placeholder="00.000.000/0000-00"
                value={formData.document}
                onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                icon={FileText}
                className="bg-slate-900/50"
              />
            </div>

            <Input
              label="Crie uma Senha"
              type="password"
              placeholder="Min. 6 caracteres"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              icon={Lock}
              required
              minLength={6}
              className="bg-slate-900/50"
            />

            {fieldErrors.length > 0 && (
              <div className="space-y-1.5 px-4 py-3 bg-red-400/5 rounded-xl border border-red-400/10 animate-in fade-in duration-300">
                {fieldErrors.map((err, i) => (
                  <p key={i} className="text-xs text-red-400 font-medium">
                    • {err.message}
                  </p>
                ))}
              </div>
            )}

            {error && fieldErrors.length === 0 && (
              <div className="text-sm text-red-400 text-center font-medium bg-red-400/5 py-3 px-4 rounded-xl border border-red-400/10 animate-in shake duration-500">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full h-12 premium-gradient border-none text-white font-bold text-base group shadow-lg shadow-indigo-500/20" isLoading={loading}>
              <UserPlus className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
              Criar Conta e Empresa
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-indigo-500/10 text-center text-sm text-muted-foreground font-medium">
            Já possui acesso?{' '}
            <Link href="/login" className="text-indigo-400 hover:text-indigo-300 transition-colors">
              Fazer login
            </Link>
          </div>
        </Card>

        <div className="mt-8 flex justify-center">
          <Link href="/" className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors">
            <ArrowLeft className="w-3 h-3" />
            Voltar para o início
          </Link>
        </div>
      </div>
    </div>
  );
}
