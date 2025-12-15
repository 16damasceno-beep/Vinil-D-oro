
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
      window.location.reload(); // Reload to restore SPA state functionality after print
    }
  };

  const transactionDate = new Date(listing.createdAt).toLocaleDateString('pt-BR');
  const transactionId = listing.id.toUpperCase().replace('L-', 'TRX-');
  const shippingCost = listing.finalShippingCost || 0;
  const totalPrice = listing.finalTotalPrice || listing.price;
  const serviceFee = listing.price * 0.05; // Fee only on product
  const sellerReceive = (listing.price - serviceFee) + shippingCost;

  // Masking Logic: Show 1st char and last 3 chars. Hide rest.
  const maskDocument = (doc?: string) => {
    if (!doc) return 'N/A';
    const clean = doc.replace(/\D/g, '');
    if (clean.length < 4) return '***';
    const first = clean.substring(0, 1);
    const last3 = clean.substring(clean.length - 3);
    return `${first}**.***.**${last3}`;
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm p-4 print:p-0 print:bg-white print:absolute print:inset-0">
      <div className="relative w-full max-w-lg">
        {/* Close Button (Hidden on Print) */}
        <button 
          onClick={onClose}
          className="absolute -top-10 right-0 text-white hover:text-gray-300 print:hidden"
        >
          Fechar ✕
        </button>

        {/* Receipt Paper */}
        <div id="receipt-content" className="bg-white text-black p-8 rounded-lg shadow-2xl font-mono text-sm relative overflow-hidden">
          {/* Watermark */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
            <svg viewBox="0 0 100 100" className="w-64 h-64">
              <circle cx="50" cy="50" r="42" fill="currentColor" />
            </svg>
          </div>

          <div className="relative z-10">
            {/* Header */}
            <div className="text-center border-b-2 border-black pb-4 mb-4 border-dashed">
              <h1 className="text-2xl font-bold uppercase tracking-widest">Vinil D'oro</h1>
              <p className="text-xs">Marketplace de Discos de Vinil</p>
              <p className="text-xs mt-1">COMPROVANTE DE TRANSAÇÃO</p>
            </div>

            {/* Transaction Details */}
            <div className="space-y-2 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">ID da Transação:</span>
                <span className="font-bold">{transactionId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Data:</span>
                <span>{transactionDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="bg-gray-200 px-1 rounded text-xs font-bold">CONCLUÍDO</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Método de Entrega:</span>
                <span className="font-bold uppercase">{listing.selectedDeliveryMethod === 'PICKUP' ? 'Retirada' : 'Envio'}</span>
              </div>
            </div>

            {/* Participants */}
            <div className="mb-6 border-b border-black pb-4 border-dashed">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase">Vendedor</p>
                  <p className="font-bold">{listing.sellerName}</p>
                  <p className="text-xs text-gray-400">Doc: {maskDocument(listing.sellerDocument)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 uppercase">Comprador</p>
                  <p className="font-bold">{listing.buyerName || 'N/A'}</p>
                  <p className="text-xs text-gray-400">Doc: {maskDocument(listing.buyerDocument)}</p>
                </div>
              </div>
            </div>

            {/* Item Details */}
            <div className="mb-6">
              <p className="text-xs text-gray-500 uppercase mb-2">Item</p>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-bold text-lg">{listing.catalogItem.title}</p>
                  <p className="text-xs">{listing.catalogItem.artist}</p>
                  <p className="text-xs text-gray-500">{listing.condition}</p>
                </div>
                <span className="font-bold">R$ {listing.price.toFixed(2)}</span>
              </div>
              
              {shippingCost > 0 && (
                <div className="flex justify-between items-center text-gray-600">
                   <span>Frete / Envio</span>
                   <span>R$ {shippingCost.toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Totals Section */}
            <div className="bg-gray-100 p-4 rounded mb-6">
              {viewerRole === 'BUYER' ? (
                <>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total Pago</span>
                    <span>R$ {totalPrice.toFixed(2)}</span>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-2 text-center">* Valor pago via plataforma.</p>
                </>
              ) : (
                <>
                  <div className="flex justify-between text-gray-600">
                    <span>Valor do Item</span>
                    <span>R$ {listing.price.toFixed(2)}</span>
                  </div>
                  {shippingCost > 0 && (
                     <div className="flex justify-between text-gray-600">
                       <span>Reembolso Frete</span>
                       <span>+ R$ {shippingCost.toFixed(2)}</span>
                     </div>
                  )}
                  <div className="flex justify-between text-red-600">
                    <span>Taxa de Serviço (5% sobre Prod.)</span>
                    <span>- R$ {serviceFee.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-gray-400 my-2"></div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total Recebido</span>
                    <span>R$ {sellerReceive.toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="text-center text-[10px] text-gray-500">
              <p>Este documento serve como comprovante da operação realizada na plataforma Vinil D'oro.</p>
              <p className="mt-1 font-mono">{listing.id}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons (Hidden on Print) */}
        <div className="mt-4 flex gap-2 print:hidden">
          <button 
            onClick={handlePrint}
            className="flex-1 bg-vinyl-accent hover:bg-yellow-600 text-black font-bold py-3 rounded shadow-lg flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
            </svg>
            Imprimir Comprovante
          </button>
        </div>
      </div>
    </div>
  );
};
