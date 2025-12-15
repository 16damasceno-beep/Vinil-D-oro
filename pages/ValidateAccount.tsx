
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store';

export const ValidateAccount: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { verifyAccount } = useStore();
  
  const email = searchParams.get('email');
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (!email || !token) {
      alert("Link de validação inválido.");
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

    if (email && token) {
      const success = verifyAccount(email, token, password);
      if (success) {
        alert("Conta validada e senha definida com sucesso! Você está logado.");
        navigate('/profile'); // Redirect to profile to complete setup if needed
      } else {
        alert("Falha na validação. O link pode ter expirado ou a conta já foi ativada.");
        navigate('/login');
      }
    }
  };

  if (!email) return null;

  return (
    <div className="min-h-screen bg-vinyl-black flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-gray-900 p-8 rounded-xl shadow-2xl border border-gray-800">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Validar Conta & Definir Senha
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Bem-vindo(a)! Para ativar sua conta <span className="font-bold text-vinyl-accent">{email}</span>, crie sua senha definitiva.
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
                placeholder="Sua Nova Senha"
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
                placeholder="Confirmar Senha"
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
              Ativar Conta e Entrar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
