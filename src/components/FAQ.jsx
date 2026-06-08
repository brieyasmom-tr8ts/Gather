import { useState } from 'react';

export default function FAQ({ items }) {
  const [open, setOpen] = useState(null);
  return (
    <div className="space-y-3">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden transition">
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              className="w-full flex items-center justify-between text-left px-5 py-4 hover:bg-gray-50 transition"
              aria-expanded={isOpen}
            >
              <span className="font-semibold text-gray-900">{item.q}</span>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
            <div className={`overflow-hidden transition-all ${isOpen ? 'max-h-96' : 'max-h-0'}`}>
              <div className="px-5 pb-5 pt-0 text-gray-600 leading-relaxed whitespace-pre-line">
                {item.a}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
