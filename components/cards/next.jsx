import Link from "next/link";
import { IoPlay } from "react-icons/io5";

export default function Next({ name, artist, image, id, next = true }) {
  return (
    <Link href={`/${id}`} className="group block">
      <div
        className="flex items-center gap-3 p-2.5 rounded-xl transition-all duration-250 cursor-pointer"
        style={{
          background: 'rgba(18,18,32,0.6)',
          border: '1px solid rgba(255,0,60,0.07)',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'rgba(24,24,40,0.9)';
          e.currentTarget.style.borderColor = 'rgba(255,0,60,0.2)';
          e.currentTarget.style.boxShadow = '0 0 20px rgba(255,0,60,0.08)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'rgba(18,18,32,0.6)';
          e.currentTarget.style.borderColor = 'rgba(255,0,60,0.07)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        <img
          src={image}
          alt={name}
          className="aspect-square w-10 h-10 rounded-lg object-cover flex-shrink-0"
          style={{ background: 'rgba(18,18,32,0.8)' }}
        />
        <div className="overflow-hidden flex-1 min-w-0">
          <p
            className="text-sm font-semibold truncate transition-colors duration-200 group-hover:text-hellfire"
            style={{ color: '#ccccee', fontFamily: 'Rajdhani, sans-serif' }}
          >
            {name}
          </p>
          <p className="text-xs truncate mt-0.5" style={{ color: '#8888aa' }}>
            {artist}
          </p>
        </div>

        {next ? (
          <span
            className="text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded flex-shrink-0"
            style={{
              background: 'rgba(139,0,0,0.4)',
              border: '1px solid rgba(255,0,60,0.25)',
              color: '#FF003C',
              fontFamily: 'Orbitron, sans-serif',
            }}
          >
            NEXT
          </span>
        ) : (
          <div
            className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100"
            style={{ background: 'rgba(255,0,60,0.9)', boxShadow: '0 0 10px rgba(255,0,60,0.5)' }}
          >
            <IoPlay className="w-3 h-3 text-white -mr-px" />
          </div>
        )}
      </div>
    </Link>
  );
}
