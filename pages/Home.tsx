
import React from 'react';
import { useStore } from '../store';
import { Link } from 'react-router-dom';
import { ItemType } from '../types';

export const Home: React.FC = () => {
  const { getEnrichedListings, currentUser, wantRequests, users } = useStore();
  
  const allActiveListings = getEnrichedListings()
    .filter(l => l.status === 'DISPONÍVEL')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const lotListings = allActiveListings.filter(l => l.catalogItem.itemType === ItemType.LOTE).slice(0, 4);
  const equipmentListings = allActiveListings.filter(l => l.catalogItem.itemType === ItemType.EQUIPMENT).slice(0, 5);
  const mediaListings = allActiveListings.filter(l => l.catalogItem.itemType !== ItemType.EQUIPMENT && l.catalogItem.itemType !== ItemType.LOTE).slice(0, 10);

  const latestWants = wantRequests.filter(r => r.status === 'ABERTO').slice(0, 4);

  const renderListingCard = (listing: any, highlight: boolean = false) => (
    <Link 
      to={`/listing/${listing.id}`} 
      key={listing.id} 
      className={`block group rounded-lg overflow-hidden border transition shadow-lg hover:scale-[1.02] duration-300 ${highlight ? 'bg-vinyl-accent/5 border-vinyl-accent/50' : 'bg-gray-800 border-gray-700 hover:border-vinyl-accent'}`}
    >
      <div className="relative pb-[100%] overflow-hidden bg-gray-900">
        <img src={listing.catalogItem.coverUrl} alt={listing.catalogItem.title} className="absolute h-full w-full object-cover group-hover:scale-105 transition-transform duration-700" />
        {listing.catalogItem.itemType === ItemType.LOTE && (
          <div className="absolute top-0 left-0 bg-vinyl-accent text-black text-[10px] font-black px-3 py-1 rounded-br z-10 shadow-lg">🎁 LOTE</div>
        )}
        <div className="absolute top-2 right-2 bg-black/70 px-2 py-1 rounded text-[10px] font-bold text-white z-10">
          {listing.condition.split(' ')[0]}
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-bold text-white truncate text-lg leading-tight">{listing.catalogItem.title}</h3>
        <p className="text-sm text-vinyl-accent truncate font-medium">{listing.catalogItem.artist}</p>
        <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-700">
          <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest">{listing.catalogItem.itemType.split(' ')[0]}</span>
          <span className="text-xl font-bold text-white">R$ {listing.price.toFixed(2)}</span>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="min-h-screen bg-vinyl-black pb-20">
      <div className="relative bg-gray-900 overflow-hidden border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-20 lg:py-32 flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 text-center lg:text-left space-y-6 animate-[fadeIn_0.5s]">
            <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tighter leading-none">
              O Som Autêntico <br/>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-vinyl-accent to-yellow-200">Em Suas Mãos.</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-lg mx-auto lg:mx-0">
               Grupo seleto para venda de Vinis, Laser Discs e Equipamentos raros. <span className="text-white">Negocie direto com colecionadores.</span>
            </p>
            <div className="flex flex-wrap justify-center lg:justify-start gap-4">
              <Link to="/catalog" className="bg-vinyl-accent hover:bg-yellow-600 text-black px-10 py-4 rounded-xl font-bold transition shadow-xl shadow-yellow-900/20">Explorar Loja</Link>
              <Link to="/procuro-por" className="border-2 border-vinyl-accent text-vinyl-accent hover:bg-vinyl-accent hover:text-black px-10 py-4 rounded-xl font-bold transition">Estou Procurando...</Link>
            </div>
          </div>
          <div className="flex-1 w-full max-w-lg relative group">
             <img src="https://images.unsplash.com/photo-1603048588665-791ca8aea617?q=80&w=2070&auto=format&fit=crop" className="w-full h-full object-cover rounded-3xl grayscale group-hover:grayscale-0 transition duration-1000 shadow-2xl border border-gray-700" alt="Vinyl" />
             <div className="absolute -bottom-6 -right-6 bg-vinyl-groove border border-gray-700 p-6 rounded-2xl shadow-2xl animate-bounce">
                <span className="text-4xl">💿</span>
             </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20 space-y-24">
        <section className="bg-gray-900/30 p-8 rounded-3xl border border-gray-800 animate-[fadeIn_0.5s]">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <span className="bg-vinyl-accent/10 p-2 rounded-xl text-vinyl-accent text-xl">🔍</span> Pedidos de Compra
              </h2>
              <p className="text-gray-400 text-sm mt-1">Veja o que o mercado está buscando e faça sua oferta.</p>
            </div>
            <Link to="/procuro-por" className="text-vinyl-accent hover:text-white text-xs font-bold uppercase tracking-widest bg-gray-800 px-4 py-2 rounded-lg transition border border-gray-700">Ver Todos</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {latestWants.map(req => (
              <Link to={`/procuro-por/${req.id}`} key={req.id} className="bg-gray-800 hover:bg-gray-750 rounded-2xl border border-gray-700 p-4 flex gap-4 transition shadow-md group hover:border-vinyl-accent">
                 <img src={req.imageUrl} className="w-16 h-16 bg-black rounded-xl object-contain group-hover:scale-105 transition" />
                 <div className="min-w-0 flex-1 flex flex-col justify-center">
                    <p className="text-white font-bold text-sm truncate">{req.title}</p>
                    <p className="text-vinyl-accent text-[10px] truncate font-bold uppercase tracking-tighter">{req.artist || 'Raridade'}</p>
                 </div>
              </Link>
            ))}
          </div>
        </section>

        {lotListings.length > 0 && (
          <section className="animate-[fadeIn_0.6s]">
            <div className="flex justify-between items-end mb-8 border-b border-vinyl-accent/30 pb-4">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-3 uppercase tracking-tighter">
                   🎁 Super Lotes Promocionais
                </h2>
                <p className="text-gray-500 text-sm mt-1">Pacotes especiais com descontos exclusivos.</p>
              </div>
              <Link to="/catalog" className="text-vinyl-accent font-bold text-xs uppercase hover:underline">Ver Mais</Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {lotListings.map(l => renderListingCard(l, true))}
            </div>
          </section>
        )}

        <section className="animate-[fadeIn_0.7s]">
          <div className="flex justify-between items-end mb-8 border-b border-gray-800 pb-4">
            <div>
              <h2 className="text-2xl font-bold text-white uppercase tracking-tighter flex items-center gap-3">
                <span className="text-xl">💿</span> Mídias & Colecionáveis
              </h2>
              <p className="text-gray-500 text-sm mt-1">Recém adicionados ao catálogo de raridades.</p>
            </div>
            <Link to="/catalog" className="text-vinyl-accent font-bold text-xs uppercase hover:underline">Ir para Loja</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {mediaListings.map(l => renderListingCard(l))}
          </div>
        </section>

        {equipmentListings.length > 0 && (
          <section className="animate-[fadeIn_0.8s]">
            <div className="flex justify-between items-end mb-8 border-b border-gray-800 pb-4">
              <div>
                <h2 className="text-2xl font-bold text-white uppercase tracking-tighter flex items-center gap-3">
                  <span className="text-xl">🎛️</span> Equipamentos de Som
                </h2>
                <p className="text-gray-500 text-sm mt-1">Aparelhos revisados e acessórios HI-FI.</p>
              </div>
              <Link to="/catalog" className="text-vinyl-accent font-bold text-xs uppercase hover:underline">Ver Todos</Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              {equipmentListings.map(l => renderListingCard(l))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
