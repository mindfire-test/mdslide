import { COMMAND_SEQUENCE } from '@site/src/constants/typingTerminal';
import React, { useEffect, useState } from 'react';

export default function TypingTerminal(): React.ReactElement {
  const [history, setHistory] = useState<Array<{ input: string; output: string }>>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [step, setStep] = useState(0);
  const [charIndex, setCharIndex] = useState(0);

  useEffect(() => {
    if (step >= COMMAND_SEQUENCE.length) {
      const resetTimeout = setTimeout(() => {
        setHistory([]);
        setCurrentInput('');
        setStep(0);
        setCharIndex(0);
      }, 5000);
      return () => clearTimeout(resetTimeout);
    }

    const currentCmd = COMMAND_SEQUENCE[step];

    if (charIndex < currentCmd.input.length) {
      const typingTimeout = setTimeout(() => {
        setCurrentInput(prev => prev + currentCmd.input[charIndex]);
        setCharIndex(prev => prev + 1);
      }, 40 + Math.random() * 40);
      return () => clearTimeout(typingTimeout);
    } else {
      const outputTimeout = setTimeout(() => {
        setHistory(prev => [...prev, { input: currentCmd.input, output: currentCmd.output }]);
        setCurrentInput('');
        setStep(prev => prev + 1);
        setCharIndex(0);
      }, 1000);
      return () => clearTimeout(outputTimeout);
    }
  }, [step, charIndex]);

  return (
    <div className="flex-[1.1] bg-[#0E0E0D] border border-app-border rounded-lg overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.4)] flex flex-col h-[280px] min-w-[320px]">
      <div className="h-9 bg-white/5 border-b border-app-border flex items-center px-4 relative">
        <div className="flex gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
        </div>
        <span className="absolute left-1/2 -translate-x-1/2 font-mono text-[11px] text-[#7A7A72]">
          bash - mdslide
        </span>
      </div>
      <div className="p-5 font-mono text-xs leading-relaxed text-[#F0EFE9] flex-1 flex flex-col justify-start overflow-y-auto">
        {history.map((h, i) => (
          <div key={i}>
            <div>
              <span className="text-[#4F7FD4] mr-2">$</span>
              <span className="text-[#F0EFE9]">{h.input}</span>
            </div>
            <div className="text-[#7A7A72] mt-1 mb-3 whitespace-pre-wrap">{h.output}</div>
          </div>
        ))}
        {step < COMMAND_SEQUENCE.length && (
          < div >
            <span className="text-[#4F7FD4] mr-2">$</span>
            <span className="text-[#F0EFE9]">{currentInput}</span>
            <span className="inline-block w-[6px] h-[13px] bg-[#F0EFE9] ml-[2px] align-middle animate-cursor-blink" />
          </div>
        )}
      </div>
    </div >
  );
}
