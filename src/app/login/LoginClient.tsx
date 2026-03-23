'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Card, Button, Input } from '@/components/UI';
import { LogIn, Mail, Lock, Zap, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function LoginClient() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<any[]>([]);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setFieldErrors([]);

    try {
      const response = await api.post('auth/login', {
        email: email.trim().toLowerCase(),
        password
      });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      localStorage.setItem('tenant', JSON.stringify(response.data.tenant));
      router.push('/dashboard');
    } catch (err: any) {
      const data = err.response?.data;
      setError(data?.message || 'Erro ao realizar login');
      if (data?.errors) {
        setFieldErrors(data.errors);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-background">
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px] -z-10 animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px] -z-10" />

      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block hover:scale-105 transition-transform">
            <h1 className="text-4xl font-extrabold mb-2 tracking-tighter">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                SORED
              </span>
            </h1>
          </Link>
          <p className="text-muted-foreground font-medium flex items-center justify-center gap-2">
            <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
            Acesso ao Portal Industrial
          </p>
        </div>

        <Card className="glass-card shadow-2xl border-indigo-500/10 backdrop-blur-xl p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-1">Entrar</h2>
            <p className="text-sm text-muted-foreground">Bem-vindo de volta! Faça login na sua conta.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <Input
              label="E-mail Corporativo"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={Mail}
              required
              className="bg-slate-900/50"
            />
            <Input
              label="Senha"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={Lock}
              required
              className="bg-slate-900/50"
            />

            <div className="flex items-center justify-end">
              <Link href="#" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                Esqueceu a senha?
              </Link>
            </div>

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
              <LogIn className="w-5 h-5 mr-2 group-hover:translate-x-0.5 transition-transform" />
              Entrar na Conta
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-indigo-500/10 text-center text-sm text-muted-foreground font-medium">
            Ainda não possui conta?{' '}
            <Link href="/register" className="text-indigo-400 hover:text-indigo-300 transition-colors">
              Criar acesso
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
