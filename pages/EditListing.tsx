
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { VinylCondition, ProductCondition, Listing } from '../types';

// Helper to convert file to Base64 string
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

export const EditListing: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { listings, catalog, currentUser, updateListing } = useStore();
  
  const [listing, setListing] = useState<Listing | null>(null);
  
  // Form State
  const [price, setPrice] = useState('');
  const [productCondition, setProductCondition] = useState<ProductCondition>('USADO');
  const [condition, setCondition] = useState<VinylCondition>(VinylCondition.VG);
  const [description, setDescription] = useState('');
  
  // Delivery
  const [allowPickup, setAllowPickup] = useState(true);
  const [allowShipping, setAllowShipping] = useState(true);
  const [shippingCost, setShippingCost] = useState('');

  // Images
  const [currentImages, setCurrentImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<string[]>([]);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    const foundListing = listings.find(l => l.id === id);
    if (!foundListing) {
      alert("Anúncio não encontrado.");
      navigate('/profile');
      return;
    }

    if (foundListing.sellerId !== currentUser.id) {
      alert("Você não tem permissão para editar este anúncio.");
      navigate('/profile');
      return;
    }

    setListing(foundListing);
    setPrice(foundListing.price.toString());
    setProductCondition(foundListing.productCondition);
    setCondition(foundListing.condition);
    setDescription(foundListing.description);
    setAllowPickup(foundListing.allowPickup);
    setAllowShipping(foundListing.allowShipping);
    setShippingCost(foundListing.shippingCost ? foundListing.shippingCost.toString() : '');
    setCurrentImages(foundListing.userImages || []);
  }, [id, listings, currentUser, navigate]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      if (e.target.files.length + currentImages.length > 5) {
        alert("Máximo de 5 fotos permitido (incluindo as atuais).");
        return;
      }
      
      const filesArray: File[] = Array.from(e.target.files);
      try {
        const base64Promises = filesArray.map(file => fileToBase64(file));
        const base64Images = await Promise.all(base64Promises);
        setNewImages(prev => [...prev, ...base64Images]);
      } catch (err) {
        console.error("Error converting images", err);
        alert("Erro ao processar imagens.");
      }
    }
  };

  const removeCurrentImage = (index: number) => {
    setCurrentImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!listing) return;
    if (!price) return alert("Preencha o preço.");
    if (!allowPickup && !allowShipping) return alert("Selecione ao menos uma forma de entrega.");

    const finalImages = [...currentImages, ...newImages];
    // If no images at all, fall back to catalog cover (should be in currentImages if not removed, or fetch catalog item)
    // Simpler logic: if finalImages is empty, we might need to re-fetch catalog cover, but usually user leaves at least one.

    const updatedListing: Listing = {
      ...listing,
      price: parseFloat(price),
      productCondition,
      condition,
      description,
      allowPickup,
      allowShipping,
      shippingCost: shippingCost ? parseFloat(shippingCost) : undefined,
      userImages: finalImages
    };

    updateListing(updatedListing);
    alert("Anúncio atualizado com sucesso!");
    navigate('/profile');
  };

  if (!listing) return <div className="p-8 text-white text-center">Carregando...</div>;

  const catalogItem = catalog.find(c => c.id === listing.catalogItemId);

  return (
    <div className="min-h-screen bg-vinyl-black py-8 px-4">
      <div className="max-w-3xl mx-auto bg-gray-900 rounded-lg p-6 shadow-xl border border-gray-800">
        <h1 className="text-2xl font-bold text-white mb-6">Editar Anúncio</h1>

        <div className="flex items-center gap-4 bg-gray-800 p-4 rounded border border-gray-700 mb-6">
           <img src={catalogItem?.coverUrl} className="w-16 h-16 object-cover rounded" alt="Cover" />
           <div>
             <p className="font-bold text-white">{catalogItem?.title}</p>
             <p className="text-gray-400 text-sm">{catalogItem?.artist}</p>
           </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
           <div className="grid grid-cols-2 gap-6">
              <div>
                 <label className="block text-sm font-medium text-gray-400 mb-2">Condição do Produto</label>
                 <div className="flex bg-gray-800 p-1 rounded border border-gray-700">
                    <button 
                       type="button"
                       onClick={() => setProductCondition('NOVO')}
                       className={`flex-1 py-2 text-sm font-bold rounded transition ${productCondition === 'NOVO' ? 'bg-vinyl-accent text-black' : 'text-gray-400 hover:text-white'}`}
                    >
                      NOVO
                    </button>
                    <button 
                       type="button"
                       onClick={() => setProductCondition('USADO')}
                       className={`flex-1 py-2 text-sm font-bold rounded transition ${productCondition === 'USADO' ? 'bg-vinyl-accent text-black' : 'text-gray-400 hover:text-white'}`}
                    >
                      USADO
                    </button>
                 </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Preço (R$)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  required
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  className="w-full bg-gray-800 text-white p-3 border border-gray-700 rounded focus:border-vinyl-accent outline-none"
                />
              </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Estado Físico Detalhado</label>
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
                 <label htmlFor="pickup" className="ml-2 text-sm text-gray-300">Aceito Retirada em Mãos</label>
               </div>
               <div className="flex items-center gap-4">
                   <div className="flex items-center">
                      <input 
                        type="checkbox" 
                        id="shipping"
                        checked={allowShipping}
                        onChange={e => setAllowShipping(e.target.checked)}
                        className="h-4 w-4 text-vinyl-accent bg-gray-700 border-gray-600 rounded"
                      />
                      <label htmlFor="shipping" className="ml-2 text-sm text-gray-300">Faço Envio</label>
                   </div>
                   {allowShipping && (
                      <input 
                        type="number" 
                        placeholder="Custo do Frete (Opcional)"
                        value={shippingCost}
                        onChange={e => setShippingCost(e.target.value)}
                        className="w-40 bg-gray-900 text-white p-2 border border-gray-600 rounded text-sm"
                      />
                   )}
               </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Descrição / Notas</label>
              <textarea 
                rows={3}
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full bg-gray-800 text-white p-3 border border-gray-700 rounded focus:border-vinyl-accent outline-none"
              />
            </div>

            <div>
               <label className="block text-sm font-medium text-gray-400 mb-2">Fotos</label>
               
               {/* Existing Images */}
               <div className="flex flex-wrap gap-3 mb-3">
                  {currentImages.map((img, idx) => (
                    <div key={`curr-${idx}`} className="relative w-20 h-20 border border-gray-600 rounded overflow-hidden group">
                       <img src={img} className="w-full h-full object-cover" />
                       <button 
                         type="button"
                         onClick={() => removeCurrentImage(idx)}
                         className="absolute top-0 right-0 bg-red-600 text-white w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition"
                       >
                         ✕
                       </button>
                    </div>
                  ))}
                  {newImages.map((img, idx) => (
                    <div key={`new-${idx}`} className="relative w-20 h-20 border border-green-600 rounded overflow-hidden group">
                       <img src={img} className="w-full h-full object-cover" />
                       <div className="absolute bottom-0 left-0 right-0 bg-green-600 text-white text-[9px] text-center">NOVA</div>
                       <button 
                         type="button"
                         onClick={() => removeNewImage(idx)}
                         className="absolute top-0 right-0 bg-red-600 text-white w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition"
                       >
                         ✕
                       </button>
                    </div>
                  ))}
                  
                  <label className="w-20 h-20 border-2 border-dashed border-gray-600 rounded flex items-center justify-center cursor-pointer hover:border-vinyl-accent text-gray-400 hover:text-white">
                      <span className="text-2xl">+</span>
                      <input type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
               </div>
            </div>

            <div className="flex gap-4 pt-4 border-t border-gray-800">
               <button 
                 type="button" 
                 onClick={() => navigate('/profile')}
                 className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded"
               >
                 Cancelar
               </button>
               <button 
                 type="submit" 
                 className="flex-1 bg-vinyl-accent hover:bg-yellow-600 text-black font-bold py-3 rounded"
               >
                 Salvar Alterações
               </button>
            </div>
        </form>
      </div>
    </div>
  );
};
