'use client';

import { useEffect, useRef } from 'react';
import Script from 'next/script';

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: { sitekey: string; callback: (token: string) => void; 'expired-callback'?: () => void }) => string;
      reset: (widgetId?: string) => void;
    };
  }
}

// Cloudflare Turnstile widget for the login form — renders nothing (and blocks nothing)
// unless NEXT_PUBLIC_TURNSTILE_SITE_KEY is set, mirroring the backend's verifyTurnstile
// no-op when TURNSTILE_SECRET_KEY is unset. Sign up free at
// https://dash.cloudflare.com/?to=/:account/turnstile to get a real site+secret key pair.
export function TurnstileWidget({ onToken }: { onToken: (token: string | null) => void }) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);

  const renderWidget = () => {
    if (!siteKey || !containerRef.current || !window.turnstile || widgetId.current) return;
    widgetId.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      callback: (token) => onToken(token),
      'expired-callback': () => onToken(null),
    });
  };

  useEffect(() => {
    if (window.turnstile) renderWidget();
  }, []);

  if (!siteKey) return null;

  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer onLoad={renderWidget} />
      <div ref={containerRef} />
    </>
  );
}
