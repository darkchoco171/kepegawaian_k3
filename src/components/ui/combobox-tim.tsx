'use client';

import React, { useState, useRef, useEffect } from 'react';
import { DAFTAR_TIM } from '@/lib/constants';

interface ComboboxTimProps {
  name: string;
  defaultValue?: string;
  placeholder?: string;
}

export default function ComboboxTim({
  name,
  defaultValue = '',
  placeholder = 'Pilih atau ketik nama tim...',
}: ComboboxTimProps) {
  const [inputValue, setInputValue] = useState(defaultValue);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Tutup dropdown kalau klik di luar
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = inputValue
    ? DAFTAR_TIM.filter(t => t.toLowerCase().includes(inputValue.toLowerCase()))
    : DAFTAR_TIM;

  return (
    <div ref={containerRef} className="relative">
      {/* Input tersembunyi untuk form submission */}
      <input type="hidden" name={name} value={inputValue} />

      {/* Input tampilan */}
      <input
        type="text"
        value={inputValue}
        onChange={e => { setInputValue(e.target.value); setIsOpen(true); }}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a4b8c] focus:border-transparent"
      />

      {/* Dropdown putih */}
      {isOpen && filtered.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-52 overflow-y-auto overflow-x-hidden text-sm text-left">
          {filtered.map(tim => (
            <li
              key={tim}
              onMouseDown={e => {
                e.preventDefault();
                setInputValue(tim);
                setIsOpen(false);
              }}
              className={`px-4 py-2 cursor-pointer hover:bg-slate-100 truncate ${
                inputValue === tim ? 'bg-blue-50 text-[#1a4b8c] font-semibold' : 'text-slate-700'
              }`}
              title={tim}
            >
              {tim}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
