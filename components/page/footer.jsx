import Link from "next/link";

export default function Footer() {
  return (
    <footer
      className="py-6 px-6 md:px-8 lg:px-12 mt-8"
      style={{ borderTop: '1px solid rgba(255,0,60,0.06)' }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p
          className="text-xs"
          style={{ color: '#44445a', fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.04em' }}
        >
          RemiX — built for educational purposes. Powered by{' '}
          <a
            href="https://saavn.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-hellfire"
            style={{ color: '#8888aa' }}
          >
            JioSaavn API
          </a>
        </p>
        <div className="flex gap-4 items-center">
          {[
            { href: 'https://github.com/r2hu1/MusicHubx', label: 'Source' },
            { href: 'https://rahul.eu.org', label: 'Portfolio' },
          ].map(({ href, label }) => (
            <Link
              key={label}
              href={href}
              target="_blank"
              className="text-xs transition-colors duration-200 hover:text-hellfire"
              style={{ color: '#44445a', fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.06em' }}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
