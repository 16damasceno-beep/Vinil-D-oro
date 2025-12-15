
import React, { useState } from 'react';
import { useStore } from '../store';
import { useNavigate } from 'react-router-dom';
import { User, UserRole } from '../types';

export const Login: React.FC = () => {
  const { login, register, requestPasswordReset } = useStore();
  const navigate = useNavigate();
  
  // Controls current view: LOGIN, REGISTER, or FORGOT
  const [view, setView] = useState<'LOGIN' | 'REGISTER' | 'FORGOT'>('LOGIN');

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState(''); // Apelido / Nome da Loja
  const [cpf, setCpf] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('AMBOS');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Format CPF/CNPJ while typing
  const handleCpfCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
    
    if (value.length <= 11) {
      // CPF Mask: 000.000.000-00
      value = value.replace(/(\d{3})(\d)/, '$1.$2');
      value = value.replace(/(\d{3})(\d)/, '$1.$2');
      value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    } else {
      // CNPJ Mask: 00.000.000/0000-00
      value = value.substring(0, 14); // Limit to 14 chars
      value = value.replace(/^(\d{2})(\d)/, '$1.$2');
      value = value.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
      value = value.replace(/\.(\d{3})(\d)/, '.$1/$2');
      value = value.replace(/(\d{4})(\d)/, '$1-$2');
    }
    setCpf(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (view === 'FORGOT') {
      if (!email) return alert("Por favor, digite seu e-mail.");
      const success = requestPasswordReset(email);
      if (success) {
        // NotificationService inside store handles the alert/log
        setView('LOGIN');
      } else {
        alert("E-mail não encontrado em nossa base de dados.");
      }
      return;
    }

    if (view === 'REGISTER') {
      if (!acceptedTerms) {
        return alert("Para prosseguir com o cadastro, você deve ler e aceitar o Termo de Responsabilidade.");
      }
      // Mandatory Fields Check (Password removed from check)
      if (!name.trim() || !nickname.trim() || !cpf.trim() || !address.trim() || !phone.trim() || !email.trim()) {
        return alert("Todos os campos são obrigatórios.");
      }
      
      const cleanCpf = cpf.replace(/\D/g, '');
      if (cleanCpf.length !== 11 && cleanCpf.length !== 14) {
        return alert("CPF ou CNPJ inválido.");
      }
      
      const newUser: User = {
        id: `u-${Date.now()}`,
        email,
        // password is set internally as provisional or empty initially
        name,
        nickname,
        cpf,
        address,
        phone,
        role,
        walletBalance: 0,
        favorites: [],
        notifications: [],
        savedPaymentMethods: [], 
        sellerRating: 0,
        sellerReviewCount: 0,
        buyerRating: 0,
        buyerReviewCount: 0
      };
      register(newUser);
      // Don't navigate to profile, show success message and switch to login
      alert("Cadastro iniciado! Uma senha provisória e um link de validação foram enviados para o seu e-mail. Verifique para ativar sua conta.");
      setView('LOGIN');
    } else {
      // LOGIN
      if (!email || !password) return alert("Preencha email e senha.");
      login(email, password);
      navigate('/');
    }
  };

  const renderTitle = () => {
    if (view === 'REGISTER') return <>Junte-se ao <span className="text-vinyl-accent">Vinil D'oro</span></>;
    if (view === 'FORGOT') return 'Recuperar Senha';
    return 'Entrar na conta';
  }

  const renderSubtitle = () => {
    if (view === 'REGISTER') return 'Cadastre-se para comprar ou vender.';
    if (view === 'FORGOT') return 'Enviaremos um link de redefinição para seu e-mail.';
    return 'Bem-vindo de volta, colecionador.';
  }

  return (
    <div className="min-h-screen bg-vinyl-black flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-gray-900 p-8 rounded-xl shadow-2xl border border-gray-800">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            {renderTitle()}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            {renderSubtitle()}
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          
          {/* Email is always visible */}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">Endereço de Email</label>
              <input
                id="email-address"
                name="email"
                type="email"
                required
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-700 placeholder-gray-500 text-white bg-gray-800 focus:outline-none focus:ring-vinyl-accent focus:border-vinyl-accent focus:z-10 sm:text-sm ${view === 'FORGOT' ? 'rounded-md' : 'rounded-t-md'}`}
                placeholder="Endereço de Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            
            {/* Password Field - Only visible in LOGIN View */}
            {view === 'LOGIN' && (
              <div>
                <label htmlFor="password" className="sr-only">Senha</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="appearance-none rounded-b-md relative block w-full px-3 py-2 border border-gray-700 placeholder-gray-500 text-white bg-gray-800 focus:outline-none focus:ring-vinyl-accent focus:border-vinyl-accent focus:z-10 sm:text-sm"
                  placeholder="Senha"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
            )}

            {/* Registration Fields */}
            {view === 'REGISTER' && (
              <>
                 <div>
                  <input
                    type="text"
                    required
                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-700 placeholder-gray-500 text-white bg-gray-800 focus:outline-none focus:ring-vinyl-accent focus:border-vinyl-accent focus:z-10 sm:text-sm"
                    placeholder="Nome Completo (Privado)"
                    value={name}
                    onChange={e => setName(e.target.value)}
                  />
                </div>
                <div>
                  <input
                    type="text"
                    required
                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-700 placeholder-gray-500 text-white bg-gray-800 focus:outline-none focus:ring-vinyl-accent focus:border-vinyl-accent focus:z-10 sm:text-sm"
                    placeholder="Apelido / Nome da Loja (Público)"
                    value={nickname}
                    onChange={e => setNickname(e.target.value)}
                  />
                  <p className="text-[10px] text-gray-400 px-2 bg-gray-800 border-x border-gray-700">Este nome aparecerá nos seus anúncios.</p>
                </div>
                <div>
                  <input
                    type="text"
                    required
                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-700 placeholder-gray-500 text-white bg-gray-800 focus:outline-none focus:ring-vinyl-accent focus:border-vinyl-accent focus:z-10 sm:text-sm"
                    placeholder="CPF ou CNPJ"
                    value={cpf}
                    onChange={handleCpfCnpjChange}
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
                
                <p className="text-xs text-yellow-500 mt-2 bg-yellow-900/10 p-2 rounded text-center">
                  Após o cadastro, enviaremos um link para seu e-mail para que você crie sua senha definitiva.
                </p>
              </>
            )}
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-bold rounded-md text-black bg-vinyl-accent hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
            >
              {view === 'REGISTER' ? 'Cadastrar e Validar E-mail' : (view === 'FORGOT' ? 'Enviar Link de Recuperação' : 'Entrar')}
            </button>
          </div>
          
          <div className="text-center space-y-2">
            {view === 'LOGIN' && (
              <>
                <button
                  type="button"
                  className="block w-full text-sm text-gray-400 hover:text-white"
                  onClick={() => setView('FORGOT')}
                >
                  Esqueci minha senha
                </button>
                <button
                  type="button"
                  className="block w-full text-sm text-gray-400 hover:text-white"
                  onClick={() => setView('REGISTER')}
                >
                  Não tem uma conta? Cadastrar
                </button>
              </>
            )}

            {view === 'REGISTER' && (
              <button
                type="button"
                className="text-sm text-gray-400 hover:text-white"
                onClick={() => setView('LOGIN')}
              >
                Já tem uma conta? Entrar
              </button>
            )}

            {view === 'FORGOT' && (
              <button
                type="button"
                className="text-sm text-gray-400 hover:text-white"
                onClick={() => setView('LOGIN')}
              >
                Voltar para Login
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
