'use client';

import { useEffect, useId, useRef, useState } from 'react';

type SearchableOption = {
  value: string;
  label: string;
};

function SearchableCombobox({
  name,
  options,
  value,
  onChange,
  placeholder,
  disabled = false,
}: {
  name: string;
  options: SearchableOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();
  const selectedOption = options.find((option) => option.value === value);
  const filteredOptions = options.filter((option) =>
    option.label.toLocaleLowerCase('id-ID').includes(query.toLocaleLowerCase('id-ID')),
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectOption = (option: SearchableOption) => {
    onChange(option.value);
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <input type="hidden" name={name} value={selectedOption?.value || ''} />
      <input
        type="text"
        value={isOpen ? query : selectedOption?.label || ''}
        onFocus={() => {
          setQuery('');
          setActiveIndex(0);
          setIsOpen(true);
        }}
        onChange={(event) => {
          setQuery(event.target.value);
          setActiveIndex(0);
          setIsOpen(true);
          onChange('');
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            setIsOpen(false);
          } else if (event.key === 'ArrowDown' && isOpen && filteredOptions.length > 0) {
            event.preventDefault();
            setActiveIndex((index) => (index + 1) % filteredOptions.length);
          } else if (event.key === 'ArrowUp' && isOpen && filteredOptions.length > 0) {
            event.preventDefault();
            setActiveIndex((index) => (index - 1 + filteredOptions.length) % filteredOptions.length);
          } else if (event.key === 'Enter' && isOpen && filteredOptions[activeIndex]) {
            event.preventDefault();
            selectOption(filteredOptions[activeIndex]);
          }
        }}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-activedescendant={isOpen && filteredOptions[activeIndex]
          ? `${listboxId}-option-${activeIndex}`
          : undefined}
        autoComplete="off"
        required
        disabled={disabled}
        placeholder={placeholder}
        className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a4b8c] focus:border-transparent disabled:bg-slate-50 disabled:text-slate-400"
      />
      {isOpen && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-52 overflow-y-auto text-sm"
        >
          {filteredOptions.length > 0 ? filteredOptions.map((option, index) => (
            <li
              id={`${listboxId}-option-${index}`}
              key={option.value}
              role="option"
              aria-selected={option.value === value}
              onMouseDown={(event) => {
                event.preventDefault();
                selectOption(option);
              }}
              onMouseEnter={() => setActiveIndex(index)}
              className={`px-4 py-2 cursor-pointer hover:bg-slate-100 ${
                option.value === value || index === activeIndex
                  ? 'bg-blue-50 text-[#1a4b8c] font-semibold'
                  : 'text-slate-700'
              }`}
            >
              {option.label}
            </li>
          )) : (
            <li className="px-4 py-2 text-slate-400">Pilihan tidak ditemukan</li>
          )}
        </ul>
      )}
    </div>
  );
}

export type JabatanOption = {
  id: string;
  namaJabatan: string;
};

export type PangkatGolonganOption = {
  id: string;
  jenisKepegawaian: 'PNS' | 'PPPK' | 'NON-ASN' | null;
  pangkat: string | null;
  golongan: string;
};

export function ComboboxJabatan({
  options,
  defaultValue = '',
}: {
  options: JabatanOption[];
  defaultValue?: string;
}) {
  const [jabatan, setJabatan] = useState(defaultValue);

  return (
    <SearchableCombobox
      name="namaJabatan"
      options={options.map((option) => ({ value: option.namaJabatan, label: option.namaJabatan }))}
      value={jabatan}
      onChange={setJabatan}
      placeholder="Pilih atau ketik nama jabatan..."
    />
  );
}

export function ComboboxPangkatGolongan({
  options,
  defaultJenis = '',
  defaultPangkat = '',
  defaultGolongan = '',
}: {
  options: PangkatGolonganOption[];
  defaultJenis?: string;
  defaultPangkat?: string;
  defaultGolongan?: string;
}) {
  const initialJenis = options.some((option) => option.jenisKepegawaian === defaultJenis)
    ? defaultJenis
    : '';
  const initialOptionsByJenis = options.filter((option) => option.jenisKepegawaian === initialJenis);
  const initialPangkatOptions = [...new Set(
    initialOptionsByJenis.flatMap((option) => option.pangkat ? [option.pangkat] : []),
  )];
  const initialPangkat = initialPangkatOptions.includes(defaultPangkat)
    ? defaultPangkat
    : initialPangkatOptions[0] || '';
  const initialGolonganOptions = initialOptionsByJenis.filter((option) => option.pangkat === initialPangkat);
  const initialGolongan = initialGolonganOptions.some((option) => option.golongan === defaultGolongan)
    ? defaultGolongan
    : initialGolonganOptions[0]?.golongan || '';

  const [jenis, setJenis] = useState(initialJenis);
  const [pangkat, setPangkat] = useState(initialPangkat);
  const [golongan, setGolongan] = useState(initialGolongan);

  const optionsByJenis = options.filter((option) => option.jenisKepegawaian === jenis);
  const pangkatOptions = [...new Set(
    optionsByJenis.flatMap((option) => option.pangkat ? [option.pangkat] : []),
  )];
  const golonganOptions = optionsByJenis.filter((option) =>
    option.pangkat === pangkat && option.pangkat !== null,
  );

  return (
    <>
      <div>
        <label className="block text-xs font-bold text-slate-600 mb-1">Jenis Kepegawaian *</label>
        <select
          name="jenisKepegawaian"
          value={jenis}
          onChange={(event) => {
            const nextJenis = event.target.value;
            setJenis(nextJenis);
            setPangkat('');
            setGolongan('');
          }}
          required
          className="w-full px-4 py-2 border rounded-lg text-sm bg-white"
        >
          <option value="">-- Pilih Jenis Kepegawaian --</option>
          <option value="PNS">PNS</option>
          <option value="PPPK">PPPK</option>
          <option value="NON-ASN">NON-ASN</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-600 mb-1">Pangkat *</label>
        <SearchableCombobox
          name="pangkat"
          options={pangkatOptions.map((option) => ({ value: option, label: option }))}
          value={pangkat}
          onChange={(nextPangkat) => {
            setPangkat(nextPangkat);
            setGolongan('');
          }}
          placeholder={jenis ? 'Pilih atau ketik nama pangkat...' : 'Pilih jenis kepegawaian terlebih dahulu'}
          disabled={!jenis || pangkatOptions.length === 0}
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-600 mb-1">Golongan *</label>
        <SearchableCombobox
          name="golongan"
          options={golonganOptions.map((option) => ({ value: option.golongan, label: option.golongan }))}
          value={golongan}
          onChange={setGolongan}
          placeholder={pangkat ? 'Pilih atau ketik golongan...' : 'Pilih pangkat terlebih dahulu'}
          disabled={!pangkat || golonganOptions.length === 0}
        />
      </div>
    </>
  );
}
