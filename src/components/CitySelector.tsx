"use client";

import { useState, useRef, useEffect } from "react";

interface CitySelectorCity {
  id: string;
  nameKo: string;
  nameEn: string;
  country: string;
}

interface CitySelectorProps {
  cities: CitySelectorCity[];
  selectedCityId?: string;
  onSelect: (cityId: string) => void;
}

export function CitySelector({
  cities,
  selectedCityId,
  onSelect,
}: CitySelectorProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedCity = cities.find((c) => c.id === selectedCityId);

  const filtered = query.trim()
    ? cities.filter(
        (c) =>
          c.nameKo.includes(query) ||
          c.nameEn.toLowerCase().includes(query.toLowerCase())
      )
    : cities;

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(cityId: string) {
    onSelect(cityId);
    setQuery("");
    setIsOpen(false);
    inputRef.current?.blur();
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      {/* Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg
            className="w-5 h-5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
            />
          </svg>
        </div>
        <input
          ref={inputRef}
          type="text"
          value={isOpen ? query : selectedCity ? `${selectedCity.country} ${selectedCity.nameKo}` : query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => {
            setIsOpen(true);
            if (selectedCity) setQuery("");
          }}
          placeholder="도시 검색 (예: 도쿄, Tokyo)"
          className="w-full pl-10 pr-10 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls="city-selector-listbox"
          aria-haspopup="listbox"
        />
        {selectedCityId && (
          <button
            type="button"
            onClick={() => {
              onSelect("");
              setQuery("");
              setIsOpen(false);
            }}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            aria-label="선택 해제"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <ul
          id="city-selector-listbox"
          role="listbox"
          className="absolute z-50 mt-1 w-full max-h-60 overflow-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg py-1"
        >
          {filtered.length === 0 ? (
            <li className="px-4 py-3 text-sm text-gray-500">
              검색 결과가 없습니다
            </li>
          ) : (
            filtered.map((city) => (
              <li
                key={city.id}
                role="option"
                aria-selected={city.id === selectedCityId}
                onClick={() => handleSelect(city.id)}
                className={`
                  flex items-center gap-3 px-4 py-2.5 text-sm cursor-pointer
                  transition-colors duration-100
                  ${city.id === selectedCityId ? "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300" : "text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800"}
                `}
              >
                <span className="text-lg flex-shrink-0" aria-hidden="true">
                  {city.country}
                </span>
                <span className="font-medium">{city.nameKo}</span>
                <span className="text-gray-400 dark:text-gray-500 text-xs">
                  {city.nameEn}
                </span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
