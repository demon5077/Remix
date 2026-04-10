import Link from "next/link";

export default function ArtistCard({ image, name, id }) {
  return (
    <Link
      href={"/search/" + encodeURIComponent(name.toLowerCase().split(" ").join("+"))}
      className="group flex flex-col items-center gap-2.5 flex-shrink-0 w-[100px]"
    >
      {/* Circle image */}
      <div
        className="relative w-[100px] h-[100px] rounded-full overflow-hidden transition-all duration-300 group-hover:scale-105"
        style={{
          border: '2px solid rgba(255,0,60,0.1)',
          boxShadow: '0 0 0 0 rgba(255,0,60,0)',
        }}
        onMouseEnter={e => e.currentTarget.style.boxShadow = '0 0 20px rgba(255,0,60,0.4), 0 0 0 2px rgba(255,0,60,0.5)'}
        onMouseLeave={e => e.currentTarget.style.boxShadow = '0 0 0 0 rgba(255,0,60,0)'}
      >
        <img
          src={image}
          alt={name}
          className="blurz w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          style={{ background: 'rgba(18,18,32,0.8)' }}
        />
        {/* Overlay */}
        <div
          className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ background: 'radial-gradient(circle, rgba(255,0,60,0.15) 0%, transparent 70%)' }}
        />
      </div>

      {/* Name */}
      <p
        className="text-xs text-center font-semibold truncate w-full transition-colors duration-200 group-hover:text-hellfire"
        style={{ color: '#8888aa', fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.04em' }}
      >
        {name}
      </p>
    </Link>
  );
}
