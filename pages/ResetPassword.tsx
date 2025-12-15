
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store';

export const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { completePasswordReset } = useStore();
  
  const email = searchParams.get('email');
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (!email || !token) {
      alert("Link de recuperação inválido.");
      navigate('/login');
    }
  }, [email, token, navigate]);

  const validatePassword = (pwd: string) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    return pwd.length >= minLength && hasUpperCase && hasNumber;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      return alert("As senhas não coincidem.");
    }

    if (!validatePassword(password)) {
      return alert("A senha deve conter no mínimo 8 dígitos, uma letra maiúscula e um número.");
    }

    if (email) {
      completePasswordReset(email, password);
      alert("Senha alterada com sucesso! Faça login com a nova senha.");
      navigate('/login');
    }
  };

  if (!email) return null;

  return (
    <div className="min-h-screen bg-vinyl-black flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-gray-900 p-8 rounded-xl shadow-2xl border border-gray-800">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Criar Nova Senha
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Para o usuário: <span className="font-bold text-vinyl-accent">{email}</span>
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="new-password" className="sr-only">Nova Senha</label>
              <input
                id="new-password"
                type="password"
                required
                className="appearance-none rounded-t-md relative block w-full px-3 py-2 border border-gray-700 placeholder-gray-500 text-white bg-gray-800 focus:outline-none focus:ring-vinyl-accent focus:border-vinyl-accent focus:z-10 sm:text-sm"
                placeholder="Nova Senha"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="sr-only">Confirmar Senha</label>
              <input
                id="confirm-password"
                type="password"
                required
                className="appearance-none rounded-b-md relative block w-full px-3 py-2 border border-gray-700 placeholder-gray-500 text-white bg-gray-800 focus:outline-none focus:ring-vinyl-accent focus:border-vinyl-accent focus:z-10 sm:text-sm"
                placeholder="Confirmar Nova Senha"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>
          
          <p className="text-[10px] text-gray-400 text-center">Mínimo 8 caracteres, 1 maiúscula, 1 número.</p>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-bold rounded-md text-black bg-vinyl-accent hover:bg-yellow-600 focus:outline-none"
            >
              Redefinir Senha
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
