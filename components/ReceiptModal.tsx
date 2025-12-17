
import React from 'react';
import { EnrichedListing } from '../types';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: EnrichedListing;
  viewerRole: 'BUYER' | 'SELLER';
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ isOpen, onClose, listing, viewerRole }) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    const printContent = document.getElementById('receipt-content');
    if (printContent) {
      const originalContents = document.body.innerHTML;
      document.body.innerHTML = printContent.innerHTML;
      window.print();
      document.body.innerHTML = originalContents;
      window.location.reload(); 
    }
  };

  const transactionDate = new Date(listing.createdAt).toLocaleDateString('pt-BR');
  const transactionId = listing.id.toUpperCase().replace('L-', 'TRX-');
  const shippingCost = listing.finalShippingCost || 0;
  const totalPrice = listing.finalTotalPrice || listing.price;
  
  const serviceFee = listing.price * 0.07; 
  const sellerReceive = (listing.price - serviceFee) + shippingCost;

  const maskDocument = (doc?: string) => {
    if (!doc) return 'N/A';
    const clean = doc.replace(/\D/g, '');
    if (clean.length < 4) return '***';
    const first = clean.substring(0, 1);
    const last3 = clean.substring(clean.length - 3);
    return `${first}**.***.**${last3}`;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 print:p-0 print:bg-white overflow-y-auto">
      <div className="relative w-full max-w-lg my-auto animate-[fadeIn_0.2s]">
        
        {/* Botão Superior para fechar (Fora do Recibo) */}
        <button 
          onClick={onClose}
          className="absolute -top-12 right-0 flex items-center gap-2 text-white/70 hover:text-white font-bold text-sm uppercase tracking-widest transition print:hidden"
        >
          <span>Fechar</span>
          <span className="w-8 h-8 rounded-full border border-white/30 flex items-center justify-center">✕</span>
        </button>

        {/* Corpo do Recibo (Papel) */}
        <div className="bg-white text-black rounded-xl shadow-2xl overflow-hidden print:shadow-none print:rounded-none">
          <div id="receipt-content" className="p-8 font-mono text-sm relative">
            {/* Marca d'água Vinil D'oro */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
              <svg viewBox="0 0 100 100" className="w-64 h-64">
                <circle cx="50" cy="50" r="42" fill="currentColor" />
              </svg>
            </div>

            <div className="relative z-10">
              {/* Cabeçalho */}
              <div className="text-center border-b-2 border-black pb-4 mb-4 border-dashed">
                <h1 className="text-2xl font-bold uppercase tracking-widest">Vinil D'oro</h1>
                <p className="text-[10px] uppercase font-bold mt-1">Comprovante de Operação</p>
              </div>

              {/* Detalhes da Transação */}
              <div className="space-y-2 mb-6 border-b border-gray-100 pb-4">
                <div className="flex justify-between">
                  <span className="text-gray-500 uppercase text-[10px] font-bold">ID Transação:</span>
                  <span className="font-bold">{transactionId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 uppercase text-[10px] font-bold">Data:</span>
                  <span>{transactionDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 uppercase text-[10px] font-bold">Entrega:</span>
                  <span className="font-bold uppercase">{listing.selectedDeliveryMethod === 'PICKUP' ? 'Retirada em Mãos' : 'Envio via Correios'}</span>
                </div>
              </div>

              {/* Participantes */}
              <div className="mb-6 grid grid-cols-2 gap-4 border-b border-black pb-4 border-dashed">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Vendedor</p>
                  <p className="font-bold text-xs">{listing.sellerName}</p>
                  <p className="text-[10px] text-gray-500">CPF: {maskDocument(listing.sellerDocument)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Comprador</p>
                  <p className="font-bold text-xs">{listing.buyerName || 'N/A'}</p>
                  <p className="text-[10px] text-gray-500">CPF: {maskDocument(listing.buyerDocument)}</p>
                </div>
              </div>

              {/* Item */}
              <div className="mb-6">
                <p className="text-[10px] text-gray-400 uppercase font-bold mb-2">Item Negociado</p>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1 pr-4">
                    <p className="font-bold text-sm uppercase">{listing.catalogItem.title}</p>
                    <p className="text-xs text-gray-600">{listing.catalogItem.artist}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{listing.condition}</p>
                  </div>
                  <span className="font-bold">R$ {listing.price.toFixed(2)}</span>
                </div>
                
                {shippingCost > 0 && (
                  <div className="flex justify-between items-center text-gray-600 text-xs">
                     <span>Custo de Envio (Reembolso)</span>
                     <span>R$ {shippingCost.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* Totais Finos */}
              <div className="bg-gray-50 p-4 rounded border border-gray-100 mb-6">
                {viewerRole === 'BUYER' ? (
                  <>
                    <div className="flex justify-between text-lg font-bold">
                      <span>VALOR TOTAL PAGO</span>
                      <span>R$ {totalPrice.toFixed(2)}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between text-gray-600 text-xs">
                      <span>Subtotal Item</span>
                      <span>R$ {listing.price.toFixed(2)}</span>
                    </div>
                    {shippingCost > 0 && (
                       <div className="flex justify-between text-gray-600 text-xs">
                         <span>Frete</span>
                         <span>+ R$ {shippingCost.toFixed(2)}</span>
                       </div>
                    )}
                    <div className="flex justify-between text-red-600 text-xs">
                      <span>Taxa de Serviço (7%)</span>
                      <span>- R$ {serviceFee.toFixed(2)}</span>
                    </div>
                    <div className="border-t border-gray-300 my-2"></div>
                    <div className="flex justify-between text-lg font-bold">
                      <span>LÍQUIDO A RECEBER</span>
                      <span>R$ {sellerReceive.toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Rodapé do Recibo */}
              <div className="text-center text-[9px] text-gray-400 uppercase tracking-tighter">
                <p>Comprovante digital Vinil D'oro - Processado via Sistema de Garantia</p>
                <p className="mt-1 font-mono">{listing.id}</p>
              </div>
            </div>
          </div>

          {/* Botões de Ação (No fundo do papel, mas fixos no modal) */}
          <div className="bg-gray-100 p-4 border-t border-gray-200 flex gap-3 print:hidden">
            <button 
              onClick={onClose}
              className="flex-1 bg-white border border-gray-300 text-gray-700 font-bold py-3 rounded-lg hover:bg-gray-50 transition"
            >
              FECHAR
            </button>
            <button 
              onClick={handlePrint}
              className="flex-[2] bg-vinyl-black text-vinyl-accent font-bold py-3 rounded-lg shadow-lg flex items-center justify-center gap-2 hover:bg-black transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
              </svg>
              IMPRIMIR / PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
