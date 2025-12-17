
import React, { useState } from 'react';
import { useStore } from '../store';
import { WantRequest, VinylCondition } from '../types';
import { Link } from 'react-router-dom';

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

export const LookingFor: React.FC = () => {
  const { wantRequests, currentUser, addWantRequest, deleteWantRequest, wantResponses } = useStore();
  const [isPosting, setIsPosting] = useState(false);
  const [form, setForm] = useState({ title: '', artist: '', description: '', image: '' as string });
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return alert("Faça login para postar.");
    if (!form.title || (!file && !form.image)) return alert("Preencha o título e adicione uma imagem.");

    let finalImg = form.image;
    if (file) {
      finalImg = await fileToBase64(file);
    }

    const newReq: WantRequest = {
      id: `wr-${Date.now()}`,
      buyerId: currentUser.id,
      buyerName: currentUser.nickname,
      title: form.title,
      artist: form.artist,
      description: form.description,
      imageUrl: finalImg,
      createdAt: new Date().toISOString(),
      status: 'ABERTO'
    };

    addWantRequest(newReq);
    setForm({ title: '', artist: '', description: '', image: '' });
    setFile(null);
    setIsPosting(false);
  };

  return (
    <div className="min-h-screen bg-vinyl-black py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <span className="text-vinyl-accent">🔍</span> Procuro Por...
            </h1>
            <p className="text-gray-400">Poste o que você deseja e receba propostas dos vendedores.</p>
          </div>
          <button 
            onClick={() => setIsPosting(!isPosting)}
            className="bg-vinyl-accent hover:bg-yellow-600 text-black font-bold px-6 py-2 rounded shadow-lg transition"
          >
            {isPosting ? 'Cancelar' : '+ Postar Pedido'}
          </button>
        </div>

        {isPosting && (
          <form onSubmit={handleSubmit} className="bg-gray-900 p-6 rounded-xl border border-vinyl-accent/30 mb-8 animate-[fadeIn_0.3s]">
            <h2 className="text-xl font-bold text-white mb-4">O que você está procurando?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <input type="text" placeholder="Título do Disco / Equipamento" required className="w-full bg-gray-800 text-white p-3 rounded border border-gray-700" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
                <input type="text" placeholder="Artista / Marca" className="w-full bg-gray-800 text-white p-3 rounded border border-gray-700" value={form.artist} onChange={e => setForm({...form, artist: e.target.value})} />
                <textarea placeholder="Descrição (ex: Procuro prensagem original, aceito com capa gasta...)" className="w-full bg-gray-800 text-white p-3 rounded border border-gray-700 h-32" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              </div>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-700 rounded-xl h-48 flex flex-col items-center justify-center relative overflow-hidden group">
                   {file ? (
                     <img src={URL.createObjectURL(file)} className="absolute inset-0 w-full h-full object-contain bg-black" />
                   ) : form.image ? (
                     <img src={form.image} className="absolute inset-0 w-full h-full object-contain bg-black" />
                   ) : (
                     <div className="text-center text-gray-500">
                        <span className="text-3xl block mb-2">📸</span>
                        <p className="text-xs">Arraste ou clique para subir uma foto de referência</p>
                     </div>
                   )}
                   <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setFile(e.target.files ? e.target.files[0] : null)} />
                </div>
                <input type="text" placeholder="Ou cole a URL de uma imagem..." className="w-full bg-gray-800 text-white p-2 rounded text-xs border border-gray-700" value={form.image} onChange={e => setForm({...form, image: e.target.value})} />
                <button type="submit" className="w-full bg-vinyl-accent hover:bg-yellow-600 text-black font-bold py-3 rounded text-lg shadow-xl shadow-yellow-900/20">Publicar Pedido</button>
              </div>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {wantRequests.length === 0 ? (
            <div className="col-span-full py-20 text-center text-gray-500 bg-gray-900 rounded-xl border border-dashed border-gray-800">
               Ainda não há pedidos de compra. Seja o primeiro a pedir algo!
            </div>
          ) : (
            wantRequests.map(req => {
              const responsesCount = wantResponses.filter(r => r.requestId === req.id).length;
              return (
                <div key={req.id} className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden hover:border-vinyl-accent transition group flex flex-col">
                   <div className="relative h-48 overflow-hidden bg-black flex items-center justify-center">
                      <img src={req.imageUrl} className="max-h-full max-w-full object-contain group-hover:scale-110 transition duration-500" />
                      {responsesCount > 0 && (
                        <div className="absolute top-2 right-2 bg-green-600 text-white text-[10px] font-bold px-2 py-1 rounded-full animate-pulse shadow-lg">
                           {responsesCount} {responsesCount === 1 ? 'PROPOSTA' : 'PROPOSTAS'}
                        </div>
                      )}
                   </div>
                   <div className="p-4 flex-1 flex flex-col">
                      <h3 className="text-white font-bold truncate">{req.title}</h3>
                      <p className="text-vinyl-accent text-sm truncate mb-2">{req.artist || 'Artista não especificado'}</p>
                      <p className="text-gray-400 text-xs line-clamp-2 italic mb-4">"{req.description}"</p>
                      
                      <div className="mt-auto flex justify-between items-center pt-4 border-t border-gray-800">
                         <div className="text-[10px] text-gray-500">
                            Por: <span className="text-gray-300 font-bold">{req.buyerName}</span>
                         </div>
                         <div className="flex gap-2">
                            {currentUser?.id === req.buyerId && (
                               <button onClick={() => deleteWantRequest(req.id)} className="text-red-500 hover:text-red-400 p-2 rounded hover:bg-red-900/10">🗑️</button>
                            )}
                            <Link to={`/procuro-por/${req.id}`} className="bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold px-4 py-2 rounded border border-gray-700">
                               {currentUser?.id === req.buyerId ? 'Ver Propostas' : 'Eu Tenho!'}
                            </Link>
                         </div>
                      </div>
                   </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
