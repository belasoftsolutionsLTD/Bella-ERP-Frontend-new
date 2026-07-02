'use client';

import { useEffect, useState } from 'react';
import { API_BASE_URL } from '@/configs/constants';
import { Mail, Phone, MapPin, Globe, ExternalLink } from 'lucide-react';

interface CompanyInfo {
  companyName: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  facebook: string;
  twitter: string;
  linkedin: string;
  instagram: string;
  youtube: string;
  tiktok: string;
}

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
    <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.791-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.268h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
  </svg>
);
const TwitterXIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);
const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);
const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
  </svg>
);
const YouTubeIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);
const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.75a8.17 8.17 0 0 0 4.78 1.52V6.82a4.85 4.85 0 0 1-1.01-.13z" />
  </svg>
);

const SOCIALS = [
  { key: 'facebook',  label: 'Facebook',  Icon: FacebookIcon  },
  { key: 'twitter',   label: 'X',         Icon: TwitterXIcon  },
  { key: 'linkedin',  label: 'LinkedIn',  Icon: LinkedInIcon  },
  { key: 'instagram', label: 'Instagram', Icon: InstagramIcon },
  { key: 'youtube',   label: 'YouTube',   Icon: YouTubeIcon   },
  { key: 'tiktok',    label: 'TikTok',    Icon: TikTokIcon    },
] as const;

export function Footer() {
  const [info, setInfo] = useState<CompanyInfo | null>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/public/company-info`)
      .then(r => r.json())
      .then(r => { if (r.success) setInfo(r.data); })
      .catch(() => {});
  }, []);

  const year = new Date().getFullYear();
  const name = info?.companyName || 'Bella ERP';
  const activeSocials = SOCIALS.filter(s => info?.[s.key]);
  const hasContact = info?.email || info?.phone || info?.address || info?.website;

  return (
    <footer className="bg-primary text-white/80 shrink-0">
      {/* Top accent line */}
      <div className="h-0.5 bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      <div className="px-8 md:px-12 py-10">
        <div className="flex flex-col md:flex-row gap-10">

          {/* ── Brand ── */}
          <div className="md:w-56 shrink-0 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0 overflow-hidden">
                <img
                  src={`${API_BASE_URL}/public/company-logo`}
                  alt={name}
                  className="h-full w-full object-contain"
                  onError={e => {
                    const img = e.currentTarget as HTMLImageElement;
                    img.style.display = 'none';
                    if (img.parentElement) {
                      img.parentElement.innerHTML = `<span class="text-white font-bold text-sm">${name.charAt(0)}</span>`;
                    }
                  }}
                />
              </div>
              <span className="font-bold text-white text-base leading-tight">{name}</span>
            </div>
            <p className="text-xs text-white/40 leading-relaxed">
              Modern HR &amp; school management — powering your institution from one place.
            </p>

            {/* Social pills */}
            {activeSocials.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {activeSocials.map(({ key, label, Icon }) => (
                  <a
                    key={key}
                    href={info![key]}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="h-8 w-8 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center text-white/50 hover:bg-white/20 hover:text-white transition-all"
                  >
                    <Icon />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* ── Divider ── */}
          <div className="hidden md:block w-px bg-white/10 self-stretch" />

          {/* ── Contact ── */}
          {hasContact && (
            <div className="flex-1 space-y-3">
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.15em]">Get in Touch</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2.5">
                {info?.email && (
                  <a href={`mailto:${info.email}`}
                    className="flex items-center gap-2.5 group">
                    <span className="h-7 w-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0 group-hover:bg-white/20 transition-colors">
                      <Mail className="h-3.5 w-3.5 text-white/60" />
                    </span>
                    <span className="text-xs text-white/60 group-hover:text-white transition-colors truncate">{info.email}</span>
                  </a>
                )}
                {info?.phone && (
                  <a href={`tel:${info.phone}`}
                    className="flex items-center gap-2.5 group">
                    <span className="h-7 w-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0 group-hover:bg-white/20 transition-colors">
                      <Phone className="h-3.5 w-3.5 text-white/60" />
                    </span>
                    <span className="text-xs text-white/60 group-hover:text-white transition-colors">{info.phone}</span>
                  </a>
                )}
                {info?.address && (
                  <div className="flex items-start gap-2.5">
                    <span className="h-7 w-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin className="h-3.5 w-3.5 text-white/60" />
                    </span>
                    <span className="text-xs text-white/60 leading-relaxed">{info.address}</span>
                  </div>
                )}
                {info?.website && (
                  <a href={info.website} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2.5 group">
                    <span className="h-7 w-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0 group-hover:bg-white/20 transition-colors">
                      <Globe className="h-3.5 w-3.5 text-white/60" />
                    </span>
                    <span className="text-xs text-white/60 group-hover:text-white transition-colors flex items-center gap-1">
                      {info.website.replace(/^https?:\/\//, '')}
                      <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* ── Divider ── */}
          {activeSocials.length > 0 && hasContact && (
            <div className="hidden md:block w-px bg-white/10 self-stretch" />
          )}

          {/* ── Follow us (named links) ── */}
          {activeSocials.length > 0 && (
            <div className="space-y-3">
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.15em]">Follow Us</p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                {activeSocials.map(({ key, label, Icon }) => (
                  <a key={key} href={info![key]} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-white/50 hover:text-white transition-colors group">
                    <span className="text-white/30 group-hover:text-white/80 transition-colors">
                      <Icon />
                    </span>
                    {label}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="border-t border-white/10">
        <div className="px-8 md:px-12 py-3 flex flex-col sm:flex-row items-center justify-between gap-1.5">
          <p className="text-[11px] text-white/30">
            © {year} <span className="text-white/50">{name}</span>. All rights reserved.
          </p>
          <p className="text-[11px] text-white/20">Powered by Bella ERP</p>
        </div>
      </div>
    </footer>
  );
}
