import React, { useState } from 'react';
import { useStore } from '../store';
import { useNavigate } from 'react-router-dom';

export const AdminDashboard: React.FC = () => {
  const { currentUser, users, listings, deleteUser, deleteListing, getEnrichedListings } = useStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'USERS' | 'LISTINGS'>('OVERVIEW');

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
  const platformFees = totalRevenue * 0.05; // 5% fee

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

  return (
    <div className="min-h-screen bg-vinyl-black py-8 px-4 sm:px-6 lg:px-8">
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
                  <h3 className="text-gray-400 text-sm uppercase font-bold mb-2">Receita Plataforma (5%)</h3>
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
          <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 animate-[fadeIn_0.3s]">
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
                         {currentUser.role === 'ADMIN' ? (
                           u.id !== currentUser.id && u.role !== 'ADMIN' ? (
                             <button 
                               onClick={() => handleDeleteUser(u.id, u.name)}
                               className="text-red-400 hover:text-red-300 font-bold border border-red-900/50 bg-red-900/20 px-3 py-1 rounded hover:bg-red-900/40"
                             >
                               Excluir
                             </button>
                           ) : <span className="text-gray-600 text-xs">Protegido</span>
                         ) : (
                           <span className="text-gray-600 italic text-xs">Apenas visualização</span>
                         )}
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
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