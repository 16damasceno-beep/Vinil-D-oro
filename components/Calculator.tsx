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
      // Note: In a production app, use a safer math parser than eval
      // Restricting input to numbers and operators minimizes risk here
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
      // Replace the last number in the string with its value / 100
      // Regex matches a number (integer or decimal) at the end of the string
      return prev.replace(/(\d+(\.\d+)?)$/, (match) => String(parseFloat(match) / 100));
    });
  };

  const handleFee = () => {
    try {
      // Calculates current expression first to get the total, then deducts 7%
      // eslint-disable-next-line no-eval
      const currentValue = eval(display.replace(/[^-()\d/*+.]/g, ''));
      const result = currentValue * 0.93; // 100% - 7% = 93%
      setHistory(`${currentValue} - 7% (Taxa) =`);
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
            <span className="text-vinyl-accent font-bold text-sm uppercase tracking-wider">Calculadora</span>
            <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white">✕</button>
          </div>

          {/* Display */}
          <div className="bg-black/50 rounded p-3 mb-4 text-right">
            <div className="text-gray-500 text-xs h-4">{history}</div>
            <div className="text-white text-2xl font-mono truncate">{display}</div>
          </div>

          {/* Keypad */}
          <div className="grid grid-cols-4 gap-2">
            {/* Top Row: Clear, Generic %, and Platform Fee */}
            <button onClick={clear} className="bg-red-900/50 hover:bg-red-900 text-red-200 p-3 rounded font-bold transition">C</button>
            <button onClick={handlePercent} className="bg-gray-700 hover:bg-gray-600 text-vinyl-accent p-3 rounded font-bold transition">%</button>
            <button onClick={handleFee} className="col-span-2 bg-green-900/30 hover:bg-green-800 text-green-400 p-3 rounded font-bold transition text-xs border border-green-900/50">
              Lucro (-7%)
            </button>

            {['7', '8', '9', '/'].map(btn => (
              <button key={btn} onClick={() => ['/'].includes(btn) ? handleOperator(btn) : handleNumber(btn)} 
                className={`p-3 rounded font-bold transition ${['/'].includes(btn) ? 'bg-gray-700 text-vinyl-accent' : 'bg-gray-800 hover:bg-gray-700 text-white'}`}>
                {btn}
              </button>
            ))}
            
            {['4', '5', '6', '*'].map(btn => (
              <button key={btn} onClick={() => ['*'].includes(btn) ? handleOperator(btn) : handleNumber(btn)} 
                className={`p-3 rounded font-bold transition ${['*'].includes(btn) ? 'bg-gray-700 text-vinyl-accent' : 'bg-gray-800 hover:bg-gray-700 text-white'}`}>
                {btn === '*' ? '×' : btn}
              </button>
            ))}

            {['1', '2', '3', '-'].map(btn => (
              <button key={btn} onClick={() => ['-'].includes(btn) ? handleOperator(btn) : handleNumber(btn)} 
                className={`p-3 rounded font-bold transition ${['-'].includes(btn) ? 'bg-gray-700 text-vinyl-accent' : 'bg-gray-800 hover:bg-gray-700 text-white'}`}>
                {btn}
              </button>
            ))}

            <button onClick={() => handleNumber('.')} className="bg-gray-800 hover:bg-gray-700 text-white p-3 rounded font-bold transition">.</button>
            <button onClick={() => handleNumber('0')} className="bg-gray-800 hover:bg-gray-700 text-white p-3 rounded font-bold transition">0</button>
            <button onClick={calculate} className="bg-vinyl-accent hover:bg-yellow-600 text-black p-3 rounded font-bold transition shadow-lg shadow-yellow-900/20">=</button>
            <button onClick={() => handleOperator('+')} className="bg-gray-700 text-vinyl-accent hover:bg-gray-600 p-3 rounded font-bold transition">+</button>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gray-800 hover:bg-gray-700 text-vinyl-accent p-3 rounded-full shadow-lg border border-gray-700 transition-transform hover:scale-110 flex items-center justify-center"
        title="Abrir Calculadora"
      >
        {isOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        )}
      </button>
    </div>
  );
};