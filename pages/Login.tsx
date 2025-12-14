import React, { useState } from 'react';
import { useStore } from '../store';
import { useNavigate } from 'react-router-dom';
import { User, UserRole } from '../types';

export const Login: React.FC = () => {
  const { login, register } = useStore();
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('AMBOS');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const validatePassword = (pwd: string) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    return pwd.length >= minLength && hasUpperCase && hasNumber;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegistering) {
      if (!acceptedTerms) {
        return alert("Para prosseguir com o cadastro, você deve ler e aceitar o Termo de Responsabilidade.");
      }
      if (!name || !cpf || !address || !phone || !password) return alert("Preencha todos os campos");
      
      if (!validatePassword(password)) {
        return alert("A senha deve conter no mínimo 8 dígitos, uma letra maiúscula e um número.");
      }

      const newUser: User = {
        id: `u-${Date.now()}`,
        email,
        password,
        name,
        cpf,
        address,
        phone,
        role,
        walletBalance: 0,
        favorites: [],
        notifications: [],
        savedPaymentMethods: [], // Inicializado vazio
        sellerRating: 0,
        sellerReviewCount: 0,
        buyerRating: 0,
        buyerReviewCount: 0
      };
      register(newUser);
      navigate('/profile');
    } else {
      if (!email || !password) return alert("Preencha email e senha.");
      login(email, password);
      // Login function handles success/fail alert or state update
      // We rely on store to update currentUser, check it below or in store
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-vinyl-black flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-gray-900 p-8 rounded-xl shadow-2xl border border-gray-800">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            {isRegistering ? (
              <>Junte-se ao <span className="text-vinyl-accent">Vinil D'oro</span></>
            ) : (
              'Entrar na conta'
            )}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            {isRegistering ? 'Cadastre-se para comprar ou vender.' : 'Bem-vindo de volta, colecionador.'}
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">Endereço de Email</label>
              <input
                id="email-address"
                name="email"
                type="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-700 placeholder-gray-500 text-white bg-gray-800 rounded-t-md focus:outline-none focus:ring-vinyl-accent focus:border-vinyl-accent focus:z-10 sm:text-sm"
                placeholder="Endereço de Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            
            {/* Password Field (Used for both Login and Register) */}
            <div>
              <label htmlFor="password" className="sr-only">Senha</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-700 placeholder-gray-500 text-white bg-gray-800 focus:outline-none focus:ring-vinyl-accent focus:border-vinyl-accent focus:z-10 sm:text-sm ${!isRegistering ? 'rounded-b-md' : ''}`}
                placeholder="Senha"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              {isRegistering && (
                <p className="text-[10px] text-gray-400 p-2 bg-gray-800">Mínimo 8 caracteres, 1 maiúscula, 1 número.</p>
              )}
            </div>

            {isRegistering && (
              <>
                 <div>
                  <input
                    type="text"
                    required
                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-700 placeholder-gray-500 text-white bg-gray-800 focus:outline-none focus:ring-vinyl-accent focus:border-vinyl-accent focus:z-10 sm:text-sm"
                    placeholder="Nome Completo"
                    value={name}
                    onChange={e => setName(e.target.value)}
                  />
                </div>
                <div>
                  <input
                    type="text"
                    required
                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-700 placeholder-gray-500 text-white bg-gray-800 focus:outline-none focus:ring-vinyl-accent focus:border-vinyl-accent focus:z-10 sm:text-sm"
                    placeholder="CPF"
                    value={cpf}
                    onChange={e => setCpf(e.target.value)}
                  />
                </div>
                <div>
                   <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-700 placeholder-gray-500 text-white bg-gray-800 focus:outline-none focus:ring-vinyl-accent focus:border-vinyl-accent focus:z-10 sm:text-sm"
                   >
                     <option value="AMBOS">Quero Comprar e Vender</option>
                     <option value="VENDEDOR">Apenas Vender</option>
                     <option value="COMPRADOR">Apenas Comprar</option>
                   </select>
                </div>
                <div>
                  <input
                    type="text"
                    required
                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-700 placeholder-gray-500 text-white bg-gray-800 focus:outline-none focus:ring-vinyl-accent focus:border-vinyl-accent focus:z-10 sm:text-sm"
                    placeholder="Endereço Completo"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                  />
                </div>
                 <div>
                  <input
                    type="text"
                    required
                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-700 placeholder-gray-500 text-white bg-gray-800 rounded-b-md focus:outline-none focus:ring-vinyl-accent focus:border-vinyl-accent focus:z-10 sm:text-sm"
                    placeholder="Telefone"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                  />
                </div>
                
                {/* Terms of Responsibility Checkbox */}
                <div className="flex items-start mt-4 pt-4 border-t border-gray-800">
                  <div className="flex items-center h-5">
                    <input
                      id="terms"
                      name="terms"
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      className="focus:ring-vinyl-accent h-4 w-4 text-vinyl-accent border-gray-700 rounded bg-gray-800"
                    />
                  </div>
                  <div className="ml-3 text-xs">
                    <label htmlFor="terms" className="font-medium text-gray-300">
                      Termo de Responsabilidade
                    </label>
                    <p className="text-gray-500 mt-1 text-justify leading-relaxed">
                      Declaro estar ciente de que o site <strong>Vinil D'oro</strong> não se responsabiliza pelas negociações, estado dos produtos ou envios. A plataforma atua apenas como integradora entre as partes. Toda a negociação é de responsabilidade exclusiva dos usuários (comprador e vendedor).
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-bold rounded-md text-black bg-vinyl-accent hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
            >
              {isRegistering ? 'Aceitar e Cadastrar' : 'Entrar'}
            </button>
          </div>
          
          <div className="text-center">
            <button
              type="button"
              className="text-sm text-gray-400 hover:text-white"
              onClick={() => setIsRegistering(!isRegistering)}
            >
              {isRegistering ? 'Já tem uma conta? Entrar' : "Não tem uma conta? Cadastrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};