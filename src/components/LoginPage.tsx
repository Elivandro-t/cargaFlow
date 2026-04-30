import  { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Truck, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../store';
import toast from 'react-hot-toast';

const schema = z.object({
  email: z.string().email('Email invalido'),
  password: z.string().min(6, 'Minimo 6 caracteres'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      await login(data.email, data.password);
      const destino = '/home';
      navigate(destino);
    } catch {
      toast.error('Credenciais invalidas');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 py-10">

      <div className="w-full max-w-md">

        {/* Card */}
        <div className="bg-white shadow-xl rounded-2xl p-8">

          {/* Header */}
          <div className="mb-8 flex flex-col items-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-600 mb-4">
              <Truck size={24} className="text-white" />
            </div>

            <h1 className="text-2xl font-semibold text-gray-800">
              CargaFlow
            </h1>

            {/* <p className="text-sm text-gray-500 text-center">
              Sistema de atendimento ao cliente
            </p> */}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Email
              </label>
              <input
                {...register('email')}
                type="email"
                placeholder="seu@empresa.com"
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.email.message}
                </p>
              )}
            </div>

            {/* Senha */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Senha
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Digite sua senha"
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 pr-11 text-sm text-gray-700 placeholder-gray-400 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-0.5"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.password.message}
                </p>
              )}
            </div>

            {/* Botao */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-lg bg-blue-600 text-white py-3 text-sm font-medium hover:bg-blue-700 transition disabled:opacity-60"
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center text-xs text-gray-400">
            Sistema Modular • Trnasporte Logistica
          </div>

        </div>
      </div>
    </div>
  );
}
