
import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useStore } from '../store';
import { WantResponse, VinylCondition } from '../types';

export const LookingForDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { wantRequests, wantResponses, currentUser, respondToWantRequest, getEnrichedListings } = useStore();
  
  const [isResponding, setIsResponding] = useState(false);
  const [resForm, setResForm] = useState({ price: '', condition: VinylCondition.VG, message: '', listingId: '' });

  const request = wantRequests.find(r => r.id === id);
  const responses = wantResponses.filter(r => r.requestId === id).sort((a, b) => b.price - a.price);
  const myListings = getEnrichedListings().filter(l => l.sellerId === currentUser?.id && l.status === 'DISPONÍVEL');

  if (!request) return <div className="text-white text-center p-20">Pedido não encontrado.</div>;

  const handleResponseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!resForm.price) return alert("Informe o preço.");

    const newRes: WantResponse = {
      id: `wres-${Date.now()}`,
      requestId: request.id,
      sellerId: currentUser.id,
      sellerName: currentUser.nickname,
      price: parseFloat(resForm.price),
      condition: resForm.condition,
      message: resForm.message || (resForm.listingId ? 'Já postei este item! Veja no link.' : 'Tenho este item e vou postar em breve!'),
      listingId: resForm.listingId || undefined,
      createdAt: new Date().toISOString()
    };

    respondToWantRequest(newRes);
    setIsResponding(false);
    setResForm({ price: '', condition: VinylCondition.VG, message: '', listingId: '' });
  };

  return (
    <div className="min-h-screen bg-vinyl-black py-12 px-4">
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Lado Esquerdo: Info do Pedido */}
        <div className="md:col-span-1 space-y-6">
           <div className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800 shadow-2xl">
              <div className="bg-black flex items-center justify-center p-4">
                 <img src={request.imageUrl} className="max-h-64 max-w-full object-contain" />
              </div>
              <div className="p-6">
                 <h1 className="text-2xl font-bold text-white mb-1">{request.title}</h1>
                 <p className="text-vinyl-accent mb-4">{request.artist}</p>
                 <div className="bg-gray-800/50 p-4 rounded border border-gray-700 mb-4">
                    <p className="text-gray-300 text-sm italic">"{request.description}"</p>
                 </div>
                 <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>Pedido por: <strong className="text-gray-300">{request.buyerName}</strong></span>
                    <span>•</span>
                    <span>{new Date(request.createdAt).toLocaleDateString()}</span>
                 </div>
              </div>
           </div>

           {currentUser?.id !== request.buyerId && (
             <button 
               onClick={() => setIsResponding(!isResponding)}
               className="w-full bg-vinyl-accent hover:bg-yellow-600 text-black font-bold py-4 rounded-xl shadow-lg transition flex items-center justify-center gap-2"
             >
                {isResponding ? 'Cancelar Proposta' : '➕ Eu Tenho este Item!'}
             </button>
           )}
        </div>

        {/* Lado Direito: Propostas ou Formulário */}
        <div className="md:col-span-2">
           {isResponding ? (
             <form onSubmit={handleResponseSubmit} className="bg-gray-900 p-8 rounded-xl border border-vinyl-accent/30 shadow-2xl animate-[fadeIn_0.3s] space-y-6">
                <h2 className="text-2xl font-bold text-white mb-6 border-b border-gray-800 pb-2">Minha Proposta</h2>
                
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase">Preço (R$)</label>
                      <input type="number" step="0.01" required placeholder="0.00" className="w-full bg-gray-800 text-white p-3 rounded border border-gray-700" value={resForm.price} onChange={e => setResForm({...resForm, price: e.target.value})} />
                   </div>
                   <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase">Estado do Disco</label>
                      <select className="w-full bg-gray-800 text-white p-3 rounded border border-gray-700" value={resForm.condition} onChange={e => setResForm({...resForm, condition: e.target.value as VinylCondition})}>
                         {Object.values(VinylCondition).map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                   </div>
                </div>

                <div className="space-y-2">
                   <label className="text-xs font-bold text-gray-500 uppercase">Vincular Anúncio Existente (Opcional)</label>
                   <select className="w-full bg-gray-800 text-white p-3 rounded border border-gray-700" value={resForm.listingId} onChange={e => setResForm({...resForm, listingId: e.target.value})}>
                      <option value="">-- Selecione um anúncio seu --</option>
                      {myListings.map(l => (
                        <option key={l.id} value={l.id}>{l.catalogItem.title} - R$ {l.price.toFixed(2)}</option>
                      ))}
                   </select>
                   <p className="text-[10px] text-gray-500">Se você já postou o item, vincule-o para o comprador comprar na hora.</p>
                </div>

                <div className="space-y-2">
                   <label className="text-xs font-bold text-gray-500 uppercase">Mensagem Adicional</label>
                   <textarea placeholder="Ex: Item impecável, envio hoje mesmo..." className="w-full bg-gray-800 text-white p-3 rounded border border-gray-700 h-24" value={resForm.message} onChange={e => setResForm({...resForm, message: e.target.value})} />
                </div>

                <button type="submit" className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-xl shadow-lg transition shadow-green-900/20">Enviar Proposta Oficial</button>
             </form>
           ) : (
             <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                   Propostas Recebidas
                   <span className="bg-gray-800 text-vinyl-accent text-sm px-3 py-1 rounded-full">{responses.length}</span>
                </h2>

                {responses.length === 0 ? (
                  <div className="bg-gray-900/50 py-20 text-center rounded-xl border border-dashed border-gray-800">
                     <p className="text-gray-500">Aguardando vendedores interessados...</p>
                  </div>
                ) : (
                  responses.map(res => (
                    <div key={res.id} className="bg-gray-900 rounded-xl border border-gray-800 p-6 hover:border-gray-600 transition shadow-lg flex flex-col sm:flex-row gap-6">
                       <div className="flex-1">
                          <div className="flex justify-between items-start mb-4">
                             <div>
                                <p className="text-vinyl-accent text-xs font-bold uppercase tracking-widest">Vendedor</p>
                                <p className="text-lg font-bold text-white">{res.sellerName}</p>
                             </div>
                             <div className="text-right">
                                <p className="text-2xl font-bold text-white">R$ {res.price.toFixed(2)}</p>
                                <span className="text-[10px] bg-gray-800 text-gray-400 px-2 py-0.5 rounded border border-gray-700">{res.condition.split(' ')[0]}</span>
                             </div>
                          </div>
                          
                          <p className="text-gray-400 text-sm mb-6 bg-gray-800/30 p-3 rounded border border-gray-800 border-l-2 border-l-vinyl-accent italic">"{res.message}"</p>
                          
                          <div className="flex gap-2">
                             {res.listingId ? (
                               <Link to={`/listing/${res.listingId}`} className="flex-1 bg-vinyl-accent hover:bg-yellow-600 text-black font-bold py-2 rounded text-center text-sm shadow-lg">Ver Anúncio e Comprar</Link>
                             ) : (
                               <div className="flex-1 bg-gray-800 text-gray-500 font-bold py-2 rounded text-center text-sm border border-gray-700">Aguardando Postagem</div>
                             )}
                             <button className="px-4 bg-gray-800 hover:bg-gray-700 text-white rounded border border-gray-700">Chat 💬</button>
                          </div>
                       </div>
                    </div>
                  ))
                )}
             </div>
           )}
        </div>
      </div>
    </div>
  );
};
