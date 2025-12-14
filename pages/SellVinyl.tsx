import React, { useState } from 'react';
import { useStore } from '../store';
import { CatalogItem, Genre, VinylCondition, Listing } from '../types';
import { getAlbumDetails } from '../services/geminiService';
import { useNavigate } from 'react-router-dom';

export const SellVinyl: React.FC = () => {
  const { catalog, addToCatalog, addListing, currentUser } = useStore();
  const navigate = useNavigate();

  // Step 1: Catalog Selection
  const [step, setStep] = useState<1 | 2>(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<CatalogItem | null>(null);
  const [isSearchingAI, setIsSearchingAI] = useState(false);

  // Step 2: Listing Details
  const [price, setPrice] = useState('');
  const [condition, setCondition] = useState<VinylCondition>(VinylCondition.VG);
  const [description, setDescription] = useState('');
  const [imageFiles, setImageFiles] = useState<FileList | null>(null);
  
  // Delivery Options
  const [allowPickup, setAllowPickup] = useState(true);
  const [allowShipping, setAllowShipping] = useState(true);
  const [shippingCost, setShippingCost] = useState('');

  if (!currentUser) {
    return <div className="p-8 text-center text-white">Por favor, faça login para vender.</div>;
  }

  // --- Handlers ---

  const handleCatalogSearch = async () => {
    setIsSearchingAI(true);
    // 1. Try to find in existing catalog
    const existing = catalog.find(c => c.title.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (existing) {
       // Just showing existing filter in UI below, but this is for specific AI Action
       alert("Encontrado localmente! Selecione na lista.");
    } else {
       // 2. Ask Gemini
       const aiResult = await getAlbumDetails(searchTerm);
       if (aiResult) {
         const newItem: CatalogItem = {
           id: `c-${Date.now()}`,
           ...aiResult,
           genre: aiResult.genre as Genre, // Casting assuming AI behaves or fallback
           coverUrl: `https://picsum.photos/seed/${searchTerm.replace(/\s/g,'')}/400/400` // Mock image for AI result
         };
         addToCatalog(newItem);
         setSelectedCatalogItem(newItem);
         setStep(2);
       } else {
         alert("Não foi possível encontrar detalhes do álbum. Tente inserir manualmente (Não implementado na demo).");
       }
    }
    setIsSearchingAI(false);
  };

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCatalogItem || !price) return;
    if (!allowPickup && !allowShipping) return alert("Selecione pelo menos uma forma de entrega.");
    if (allowShipping && !shippingCost) return alert("Defina o valor do frete para envio.");

    // Process images (Mocking file upload to URL)
    const mockImageUrls = imageFiles && imageFiles.length > 0 
      ? Array.from(imageFiles).map(() => `https://picsum.photos/id/${Math.floor(Math.random()*100)}/400/400`) // Random placeholders for demo
      : [selectedCatalogItem.coverUrl];

    const newListing: Listing = {
      id: `l-${Date.now()}`,
      sellerId: currentUser.id,
      catalogItemId: selectedCatalogItem.id,
      price: parseFloat(price),
      condition,
      description,
      userImages: mockImageUrls,
      status: 'DISPONÍVEL',
      createdAt: new Date().toISOString(),
      allowPickup,
      allowShipping,
      shippingCost: allowShipping ? parseFloat(shippingCost) : undefined
    };

    addListing(newListing);
    navigate('/profile');
  };

  const filteredCatalog = catalog.filter((item) => 
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.artist.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-vinyl-black py-8 px-4">
      <div className="max-w-3xl mx-auto bg-gray-900 rounded-lg p-6 shadow-xl border border-gray-800">
        <h1 className="text-2xl font-bold text-white mb-6">Vender seu Vinil</h1>
        
        {step === 1 && (
          <div className="space-y-6">
            <p className="text-gray-400">Passo 1: Encontre seu álbum em nosso catálogo mestre.</p>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar por Artista ou Título..."
                className="flex-1 bg-gray-800 text-white p-3 border border-gray-700 rounded focus:border-vinyl-accent outline-none"
              />
              <button 
                onClick={handleCatalogSearch} 
                disabled={isSearchingAI}
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 rounded font-medium disabled:opacity-50"
              >
                {isSearchingAI ? 'Perguntando à IA...' : 'IA Buscar'}
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
              {filteredCatalog.map(item => (
                <div 
                  key={item.id} 
                  onClick={() => { setSelectedCatalogItem(item); setStep(2); }}
                  className="cursor-pointer bg-gray-800 hover:bg-gray-700 p-2 rounded border border-gray-700 transition"
                >
                  <img src={item.coverUrl} className="w-full aspect-square object-cover rounded mb-2" />
                  <p className="font-bold text-white text-sm truncate">{item.title}</p>
                  <p className="text-gray-400 text-xs truncate">{item.artist}</p>
                </div>
              ))}
            </div>
            {filteredCatalog.length === 0 && !isSearchingAI && searchTerm && (
              <p className="text-center text-gray-500 mt-4">Não encontrado? Clique em "IA Buscar" para gerar a entrada no catálogo automaticamente.</p>
            )}
          </div>
        )}

        {step === 2 && selectedCatalogItem && (
          <form onSubmit={handlePublish} className="space-y-6">
            <div className="flex items-center gap-4 bg-gray-800 p-4 rounded border border-gray-700">
              <img src={selectedCatalogItem.coverUrl} className="w-16 h-16 object-cover rounded" />
              <div>
                <p className="font-bold text-white">{selectedCatalogItem.title}</p>
                <p className="text-gray-400 text-sm">{selectedCatalogItem.artist}</p>
                <button type="button" onClick={() => setStep(1)} className="text-xs text-vinyl-accent hover:underline mt-1">Mudar Álbum</button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Estado de Conservação</label>
              <select 
                value={condition} 
                onChange={(e) => setCondition(e.target.value as VinylCondition)}
                className="w-full bg-gray-800 text-white p-3 border border-gray-700 rounded focus:border-vinyl-accent outline-none"
              >
                {Object.values(VinylCondition).map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Preço do Vinil (R$)</label>
              <input 
                type="number" 
                step="0.01" 
                required
                value={price}
                onChange={e => setPrice(e.target.value)}
                className="w-full bg-gray-800 text-white p-3 border border-gray-700 rounded focus:border-vinyl-accent outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">Taxa de plataforma de 5% será deduzida apenas do valor do produto.</p>
            </div>

            {/* Delivery Options */}
            <div className="bg-gray-800 p-4 rounded border border-gray-700 space-y-4">
               <h3 className="font-bold text-white text-sm border-b border-gray-600 pb-2">Opções de Entrega</h3>
               
               <div className="flex items-center">
                 <input 
                   type="checkbox" 
                   id="pickup"
                   checked={allowPickup}
                   onChange={e => setAllowPickup(e.target.checked)}
                   className="h-4 w-4 text-vinyl-accent bg-gray-700 border-gray-600 rounded"
                 />
                 <label htmlFor="pickup" className="ml-2 text-sm text-gray-300">Aceito Retirada em Mãos (Grátis - Local a combinar)</label>
               </div>

               <div className="space-y-2">
                 <div className="flex items-center">
                   <input 
                     type="checkbox" 
                     id="shipping"
                     checked={allowShipping}
                     onChange={e => setAllowShipping(e.target.checked)}
                     className="h-4 w-4 text-vinyl-accent bg-gray-700 border-gray-600 rounded"
                   />
                   <label htmlFor="shipping" className="ml-2 text-sm text-gray-300">Faço Envio (Correios, Uber Flash, etc)</label>
                 </div>
                 
                 {allowShipping && (
                   <div className="ml-6 animate-[fadeIn_0.3s]">
                     <label className="block text-xs font-bold text-gray-500 mb-1">Valor do Frete / Envio (R$)</label>
                     <input 
                       type="number" 
                       step="0.01"
                       value={shippingCost}
                       onChange={e => setShippingCost(e.target.value)}
                       placeholder="Ex: 20.00"
                       className="w-full bg-gray-900 text-white p-2 border border-gray-600 rounded text-sm focus:border-vinyl-accent outline-none"
                     />
                     <p className="text-[10px] text-gray-500 mt-1">Defina um valor fixo ou estimado. Este valor será cobrado do comprador no checkout.</p>
                   </div>
                 )}
               </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Suas Fotos</label>
              <input 
                type="file" 
                multiple 
                accept="image/*"
                onChange={e => setImageFiles(e.target.files)}
                className="block w-full text-sm text-gray-400
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-vinyl-groove file:text-white
                  hover:file:bg-gray-700
                "
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Descrição / Notas</label>
              <textarea 
                rows={3}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Detalhes específicos sobre riscos, estado da capa, etc."
                className="w-full bg-gray-800 text-white p-3 border border-gray-700 rounded focus:border-vinyl-accent outline-none"
              />
            </div>

            <button type="submit" className="w-full bg-vinyl-accent hover:bg-yellow-600 text-black font-bold py-3 rounded transition">
              Publicar Anúncio
            </button>
          </form>
        )}
      </div>
    </div>
  );
};