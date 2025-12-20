
import React, { useState } from 'react';

export const Calculator: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [display, setDisplay] = useState('0');
  const [history, setHistory] = useState('');

  const handleNumber = (num: string) => {
    setDisplay(prev => prev === '0' ? num : prev + num);
  };

  const handleOperator = (op: string) => {
    setDisplay(prev => prev + op);
  };

  const calculate = () => {
    try {
      // eslint-disable-next-line no-eval
      const result = eval(display.replace(/[^-()\d/*+.]/g, ''));
      setHistory(display + ' =');
      setDisplay(String(Number(result.toFixed(2))));
    } catch (e) {
      setDisplay('Erro');
      setTimeout(() => setDisplay('0'), 1000);
    }
  };

  const clear = () => {
    setDisplay('0');
    setHistory('');
  };

  const handlePercent = () => {
    setDisplay(prev => {
      return prev.replace(/(\d+(\.\d+)?)$/, (match) => String(parseFloat(match) / 100));
    });
  };

  // CALCULA O QUANTO SOBRA (PREÇO -> LÍQUIDO)
  const handleFee = () => {
    try {
      // eslint-disable-next-line no-eval
      const currentValue = eval(display.replace(/[^-()\d/*+.]/g, ''));
      const result = currentValue * 0.93; // 100% - 7% = 93%
      setHistory(`${currentValue} - 7% (Taxa) =`);
      setDisplay(String(Number(result.toFixed(2))));
    } catch (e) {
      setDisplay('Erro');
    }
  };

  // CALCULA POR QUANTO ANUNCIAR (LÍQUIDO -> PREÇO)
  const handlePriceSuggestion = () => {
    try {
      // eslint-disable-next-line no-eval
      const targetValue = eval(display.replace(/[^-()\d/*+.]/g, ''));
      // Para sobrar X, o anúncio deve ser X / 0.93
      const result = targetValue / 0.93;
      setHistory(`${targetValue} / 0.93 (Sugestão) =`);
      setDisplay(String(Number(result.toFixed(2))));
    } catch (e) {
      setDisplay('Erro');
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-50 flex flex-col items-start font-sans">
      
      {isOpen && (
        <div className="mb-4 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl p-4 w-72 animate-[fadeIn_0.2s_ease-out]">
          <div className="flex justify-between items-center mb-3 border-b border-gray-800 pb-2">
            <span className="text-vinyl-accent font-bold text-sm uppercase tracking-wider">Calculadora do Vendedor</span>
            <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white">✕</button>
          </div>

          {/* Display */}
          <div className="bg-black/50 rounded p-3 mb-4 text-right border border-gray-800">
            <div className="text-gray-500 text-[10px] h-4 font-mono truncate">{history}</div>
            <div className="text-white text-2xl font-mono truncate">R$ {display}</div>
          </div>

          {/* Keypad */}
          <div className="grid grid-cols-4 gap-2">
            
            {/* Atalhos Rápidos */}
            <button onClick={handleFee} className="col-span-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 p-2.5 rounded-lg font-black text-[9px] border border-red-900/30 uppercase tracking-tighter transition">
               Calcular Lucro <br/> (-7% Taxa)
            </button>
            <button onClick={handlePriceSuggestion} className="col-span-2 bg-vinyl-accent/10 hover:bg-vinyl-accent/20 text-vinyl-accent p-2.5 rounded-lg font-black text-[9px] border border-vinyl-accent/30 uppercase tracking-tighter transition">
               Preço Sugerido <br/> (+7% Ajuste)
            </button>

            <button onClick={clear} className="bg-gray-800 hover:bg-red-900/50 text-red-500 p-3 rounded-lg font-bold transition">C</button>
            <button onClick={handlePercent} className="bg-gray-800 hover:bg-gray-700 text-vinyl-accent p-3 rounded-lg font-bold transition">%</button>
            <button onClick={() => handleOperator('/')} className="bg-gray-700 text-white p-3 rounded-lg font-bold transition">÷</button>
            <button onClick={() => handleOperator('*')} className="bg-gray-700 text-white p-3 rounded-lg font-bold transition">×</button>

            {['7', '8', '9'].map(btn => (
              <button key={btn} onClick={() => handleNumber(btn)} className="bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-lg font-bold transition">{btn}</button>
            ))}
            <button onClick={() => handleOperator('-')} className="bg-gray-700 text-white p-3 rounded-lg font-bold transition">-</button>
            
            {['4', '5', '6'].map(btn => (
              <button key={btn} onClick={() => handleNumber(btn)} className="bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-lg font-bold transition">{btn}</button>
            ))}
            <button onClick={() => handleOperator('+')} className="bg-gray-700 text-white p-3 rounded-lg font-bold transition">+</button>

            <div className="col-span-3 grid grid-cols-3 gap-2">
               {['1', '2', '3'].map(btn => (
                 <button key={btn} onClick={() => handleNumber(btn)} className="bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-lg font-bold transition">{btn}</button>
               ))}
               <button onClick={() => handleNumber('.')} className="bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-lg font-bold transition">.</button>
               <button onClick={() => handleNumber('0')} className="bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-lg font-bold transition">0</button>
               <button onClick={calculate} className="bg-vinyl-accent hover:bg-yellow-600 text-black p-3 rounded-lg font-black transition shadow-lg shadow-yellow-900/20">=</button>
            </div>
            
            <div className="flex flex-col gap-2">
               {/* Espaçador para manter o grid alinhado */}
            </div>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`bg-gray-800 hover:bg-gray-700 text-vinyl-accent p-3 rounded-full shadow-lg border border-gray-700 transition-all transform hover:scale-110 flex items-center justify-center ${isOpen ? 'rotate-180' : ''}`}
        title="Abrir Calculadora de Vendedor"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      </button>
    </div>
  );
};
