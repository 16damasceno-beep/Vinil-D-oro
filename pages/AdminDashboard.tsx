
import React, { useState } from 'react';
import { useStore } from '../store';
import { useNavigate } from 'react-router-dom';
import { User, UserRole } from '../types';

export const AdminDashboard: React.FC = () => {
  const { currentUser, users, listings, deleteUser, deleteListing, getEnrichedListings, updateUser, adminCreateUser } = useStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'USERS' | 'LISTINGS'>('OVERVIEW');

  // User Management State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // Default empty form
  const initialFormState = {
    name: '',
    nickname: '',
    email: '',
    password: '',
    cpf: '',
    phone: '',
    address: '',
    role: 'AMBOS' as UserRole
  };
  const [userForm, setUserForm] = useState(initialFormState);

  // Security Check
  if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'ATENDENTE')) {
    return (
      <div className="min-h-screen bg-vinyl-black flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Acesso Negado</h2>
          <p className="text-gray-400 mb-4">Você não tem permissão para acessar esta página.</p>
          <button onClick={() => navigate('/')} className="text-vinyl-accent underline">Voltar</button>
        </div>
      </div>
    );
  }

  const enrichedListings = getEnrichedListings();
  const totalUsers = users.length;
  const totalListings = listings.length;
  
  // Financial Calc (Only for ADMIN)
  const completedSales = listings.filter(l => l.status === 'CONCLUÍDO');
  const totalRevenue = completedSales.reduce((sum, item) => sum + item.price, 0);
  const platformFees = totalRevenue * 0.07; 

  const handleDeleteUser = (id: string, name: string) => {
    if (confirm(`ATENÇÃO: Você está prestes a excluir o usuário "${name}". Isso removerá todos os anúncios dele também. Confirmar?`)) {
      deleteUser(id);
    }
  };

  const handleDeleteListing = (id: string, title: string) => {
    if (confirm(`Excluir anúncio "${title}"?`)) {
      deleteListing(id);
    }
  };

  // User Modal Logic
  const openCreateUserModal = () => {
    setEditingUser(null);
    setUserForm(initialFormState);
    setIsUserModalOpen(true);
  };

  const openEditUserModal = (user: User) => {
    setEditingUser(user);
    setUserForm({
      name: user.name,
      nickname: user.nickname,
      email: user.email,
      password: '', // Don't show existing password
      cpf: user.cpf,
      phone: user.phone,
      address: user.address,
      role: user.role
    });
    setIsUserModalOpen(true);
  };

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingUser) {
      // Edit Mode
      const updatedUser: User = {
        ...editingUser,
        name: userForm.name,
        nickname: userForm.nickname,
        email: userForm.email,
        cpf: userForm.cpf,
        phone: userForm.phone,
        address: userForm.address,
        role: userForm.role,
        password: userForm.password ? userForm.password : editingUser.password // Keep old password if empty
      };
      updateUser(updatedUser);
      alert("Usuário atualizado com sucesso!");
    } else {
      // Create Mode
      if (!userForm.password) return alert("Senha é obrigatória para novos usuários.");
      
      const newUser: User = {
        id: `u-${Date.now()}`,
        ...userForm,
        password: userForm.password,
        walletBalance: 0,
        favorites: [],
        notifications: [],
        savedPaymentMethods: [],
        sellerRating: 0,
        sellerReviewCount: 0,
        buyerRating: 0,
        buyerReviewCount: 0,
        isVerified: true // Admin created users are verified
      };
      adminCreateUser(newUser);
      alert("Novo usuário criado com sucesso!");
    }
    setIsUserModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-vinyl-black py-8 px-4 sm:px-6 lg:px-8">
      
      {/* Create/Edit User Modal */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm p-4">
          <div className="bg-gray-900 rounded-xl shadow-2xl max-w-lg w-full border border-gray-700 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">
                {editingUser ? `Editar Usuário: ${editingUser.name}` : 'Criar Novo Usuário'}
              </h2>
              <button onClick={() => setIsUserModalOpen(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            
            <form onSubmit={handleUserSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Nome Completo</label>
                  <input type="text" required value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})} className="w-full bg-gray-800 text-white p-2 rounded border border-gray-600 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Apelido (Loja)</label>
                  <input type="text" required value={userForm.nickname} onChange={e => setUserForm({...userForm, nickname: e.target.value})} className="w-full bg-gray-800 text-white p-2 rounded border border-gray-600 text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">E-mail</label>
                <input type="email" required value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} className="w-full bg-gray-800 text-white p-2 rounded border border-gray-600 text-sm" />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Senha {editingUser && '(Deixe em branco para manter)'}</label>
                <input type="text" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} placeholder={editingUser ? "******" : "Senha Provisória"} className="w-full bg-gray-800 text-white p-2 rounded border border-gray-600 text-sm" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">CPF/CNPJ</label>
                  <input type="text" required value={userForm.cpf} onChange={e => setUserForm({...userForm, cpf: e.target.value})} className="w-full bg-gray-800 text-white p-2 rounded border border-gray-600 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Telefone</label>
                  <input type="text" required value={userForm.phone} onChange={e => setUserForm({...userForm, phone: e.target.value})} className="w-full bg-gray-800 text-white p-2 rounded border border-gray-600 text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Endereço</label>
                <input type="text" required value={userForm.address} onChange={e => setUserForm({...userForm, address: e.target.value})} className="w-full bg-gray-800 text-white p-2 rounded border border-gray-600 text-sm" />
              </div>

              <div>
                <label className="block text-xs font-bold text-vinyl-accent mb-1">Cargo / Permissão (Role)</label>
                <select 
                  value={userForm.role} 
                  onChange={e => setUserForm({...userForm, role: e.target.value as UserRole})}
                  className="w-full bg-gray-800 text-white p-2 rounded border border-vinyl-accent text-sm font-bold"
                >
                  <option value="AMBOS">Usuário Comum (Comprar/Vender)</option>
                  <option value="COMPRADOR">Apenas Comprador</option>
                  <option value="VENDEDOR">Apenas Vendedor</option>
                  {currentUser.role === 'ADMIN' && (
                    <>
                      <option value="ATENDENTE">Atendente</option>
                      <option value="ADMIN">Administrador</option>
                    </>
                  )}
                </select>
                <p className="text-[10px] text-gray-500 mt-1">
                  Atendente: Acesso ao painel sem ver financeiro. Admin: Acesso total.
                </p>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsUserModalOpen(false)} className="flex-1 bg-gray-700 text-white py-2 rounded font-bold">Cancelar</button>
                <button type="submit" className="flex-1 bg-vinyl-accent text-black py-2 rounded font-bold hover:bg-yellow-600">Salvar Usuário</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8 border-b border-gray-800 pb-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Painel Administrativo</h1>
            <p className="text-gray-400 mt-1">
              Logado como: <span className={currentUser.role === 'ADMIN' ? 'text-red-400 font-bold' : 'text-blue-400 font-bold'}>{currentUser.name} ({currentUser.role})</span>
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8">
          <button 
            onClick={() => setActiveTab('OVERVIEW')}
            className={`px-4 py-2 rounded text-sm font-bold transition ${activeTab === 'OVERVIEW' ? 'bg-gray-700 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
          >
            Visão Geral
          </button>
          <button 
            onClick={() => setActiveTab('USERS')}
            className={`px-4 py-2 rounded text-sm font-bold transition ${activeTab === 'USERS' ? 'bg-gray-700 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
          >
            Usuários
          </button>
          <button 
            onClick={() => setActiveTab('LISTINGS')}
            className={`px-4 py-2 rounded text-sm font-bold transition ${activeTab === 'LISTINGS' ? 'bg-gray-700 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
          >
            Anúncios (Moderação)
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'OVERVIEW' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-[fadeIn_0.3s]">
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <h3 className="text-gray-400 text-sm uppercase font-bold mb-2">Total Usuários</h3>
              <p className="text-3xl font-bold text-white">{totalUsers}</p>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <h3 className="text-gray-400 text-sm uppercase font-bold mb-2">Total Anúncios</h3>
              <p className="text-3xl font-bold text-white">{totalListings}</p>
            </div>
            {currentUser.role === 'ADMIN' && (
              <>
                <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                  <h3 className="text-gray-400 text-sm uppercase font-bold mb-2">Volume Total (Vendas)</h3>
                  <p className="text-3xl font-bold text-green-400">R$ {totalRevenue.toFixed(2)}</p>
                </div>
                <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-2 opacity-10 text-6xl">💰</div>
                  <h3 className="text-gray-400 text-sm uppercase font-bold mb-2">Receita Plataforma (7%)</h3>
                  <p className="text-3xl font-bold text-vinyl-accent">R$ {platformFees.toFixed(2)}</p>
                </div>
              </>
            )}
            {currentUser.role === 'ATENDENTE' && (
              <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 col-span-2 flex items-center justify-center text-gray-500 italic">
                Dados financeiros restritos a Administradores.
              </div>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'USERS' && (
          <div className="space-y-4 animate-[fadeIn_0.3s]">
             <div className="flex justify-end">
               <button 
                 onClick={openCreateUserModal}
                 className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded font-bold text-sm flex items-center gap-2"
               >
                 <span>+</span> Novo Usuário
               </button>
             </div>

             <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
               <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm text-gray-400">
                   <thead className="bg-gray-900 text-xs uppercase font-bold text-gray-200">
                     <tr>
                       <th className="px-6 py-3">Nome / Email</th>
                       <th className="px-6 py-3">Role</th>
                       <th className="px-6 py-3">Reputação (Venda)</th>
                       <th className="px-6 py-3">Ações</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-700">
                     {users.map(u => (
                       <tr key={u.id} className="hover:bg-gray-750">
                         <td className="px-6 py-4">
                           <p className="font-bold text-white">{u.name}</p>
                           <p className="text-xs">{u.email}</p>
                           <p className="text-[10px] text-gray-500">{u.id}</p>
                         </td>
                         <td className="px-6 py-4">
                           <span className={`px-2 py-1 rounded text-xs font-bold ${
                             u.role === 'ADMIN' ? 'bg-red-900 text-red-200' :
                             u.role === 'ATENDENTE' ? 'bg-blue-900 text-blue-200' :
                             'bg-gray-700 text-white'
                           }`}>
                             {u.role}
                           </span>
                         </td>
                         <td className="px-6 py-4">
                           {u.sellerReviewCount > 0 ? (
                             <span className="text-yellow-400">★ {u.sellerRating.toFixed(1)}</span>
                           ) : '-'}
                         </td>
                         <td className="px-6 py-4">
                           <div className="flex gap-2">
                             {currentUser.role === 'ADMIN' && (
                               <>
                                 <button 
                                   onClick={() => openEditUserModal(u)}
                                   className="text-blue-400 hover:text-blue-300 font-bold border border-blue-900/50 bg-blue-900/20 px-3 py-1 rounded hover:bg-blue-900/40"
                                 >
                                   Editar
                                 </button>
                                 {u.id !== currentUser.id && (
                                   <button 
                                     onClick={() => handleDeleteUser(u.id, u.name)}
                                     className="text-red-400 hover:text-red-300 font-bold border border-red-900/50 bg-red-900/20 px-3 py-1 rounded hover:bg-red-900/40"
                                   >
                                     Excluir
                                   </button>
                                 )}
                               </>
                             )}
                             {currentUser.role === 'ATENDENTE' && u.role !== 'ADMIN' && (
                                <button 
                                   onClick={() => openEditUserModal(u)}
                                   className="text-blue-400 hover:text-blue-300 font-bold border border-blue-900/50 bg-blue-900/20 px-3 py-1 rounded hover:bg-blue-900/40"
                                 >
                                   Editar
                                 </button>
                             )}
                           </div>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>
          </div>
        )}

        {/* Listings Tab */}
        {activeTab === 'LISTINGS' && (
          <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 animate-[fadeIn_0.3s]">
             <div className="overflow-x-auto">
               <table className="w-full text-left text-sm text-gray-400">
                 <thead className="bg-gray-900 text-xs uppercase font-bold text-gray-200">
                   <tr>
                     <th className="px-6 py-3">Item</th>
                     <th className="px-6 py-3">Vendedor</th>
                     <th className="px-6 py-3">Status</th>
                     <th className="px-6 py-3">Preço</th>
                     <th className="px-6 py-3">Ações</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-700">
                   {enrichedListings.map(l => (
                     <tr key={l.id} className="hover:bg-gray-750">
                       <td className="px-6 py-4 flex items-center gap-3">
                         <img src={l.catalogItem.coverUrl} className="w-10 h-10 object-cover rounded" />
                         <div>
                            <p className="font-bold text-white">{l.catalogItem.title}</p>
                            <p className="text-xs">{l.condition}</p>
                         </div>
                       </td>
                       <td className="px-6 py-4">
                         {l.sellerName}
                       </td>
                       <td className="px-6 py-4">
                         {l.status}
                       </td>
                       <td className="px-6 py-4">
                         R$ {l.price.toFixed(2)}
                       </td>
                       <td className="px-6 py-4">
                         <div className="flex gap-2">
                           <button 
                             onClick={() => handleDeleteListing(l.id, l.catalogItem.title)}
                             className="text-red-400 hover:text-red-300 font-bold text-xs border border-red-900/50 bg-red-900/20 px-3 py-1 rounded hover:bg-red-900/40"
                           >
                             Remover
                           </button>
                           <button 
                             onClick={() => navigate(`/listing/${l.id}`)}
                             className="text-blue-400 hover:text-blue-300 text-xs underline"
                           >
                             Ver
                           </button>
                         </div>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </div>
        )}

      </div>
    </div>
  );
};
