import Link from "next/link";

export default function AlbumCard({ title, image, artist, id, desc, lang }) {
  if (!image) {
    return (
      <div className="h-fit w-[160px] sm:w-[180px] flex-shrink-0">
        <div className="w-full h-[160px] sm:h-[180px] rounded-xl remix-shimmer" />
        <div className="mt-3 space-y-1.5">
          <div className="remix-shimmer h-3.5 w-3/4 rounded" />
          <div className="remix-shimmer h-2.5 w-1/2 rounded" />
        </div>
      </div>
    );
  }

  return (
    <Link href={`/${id}`} className="remix-card h-fit w-[160px] sm:w-[180px] flex-shrink-0 group block">
      {/* Image */}
      <div className="relative overflow-hidden rounded-xl">
        <img
          src={image}
          alt={title}
          className="blurz w-full h-[160px] sm:h-[180px] object-cover transition-transform duration-500 group-hover:scale-110"
          style={{ background: 'rgba(18,18,32,0.6)' }}
        />
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 50%)' }}
        />
        {/* Album icon */}
        <div
          className="absolute bottom-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100"
          style={{ background: 'rgba(139,0,0,0.9)', boxShadow: '0 0 12px rgba(255,0,60,0.5)' }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle cx="6" cy="6" r="5" stroke="white" strokeWidth="1.2" />
            <circle cx="6" cy="6" r="2" fill="white" />
          </svg>
        </div>

        {/* Language badge */}
        {lang && (
          <div
            className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest"
            style={{
              background: 'rgba(139,0,0,0.85)',
              border: '1px solid rgba(255,0,60,0.3)',
              color: '#ffaaaa',
              fontFamily: 'Orbitron, sans-serif',
              backdropFilter: 'blur(4px)',
            }}
          >
            {lang}
          </div>
        )}
      </div>

      {/* Meta */}
      <div className="mt-2.5 px-0.5">
        <h3
          className="text-sm font-semibold truncate leading-tight transition-colors duration-200 group-hover:text-hellfire"
          style={{ color: '#ccccee', fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.02em' }}
        >
          {title}
        </h3>
        {desc && (
          <p className="text-xs mt-0.5 truncate" style={{ color: '#8888aa' }}>{desc}</p>
        )}
        <p className="text-xs mt-0.5 truncate" style={{ color: '#8888aa' }}>{artist}</p>
      </div>
    </Link>
  );
}
