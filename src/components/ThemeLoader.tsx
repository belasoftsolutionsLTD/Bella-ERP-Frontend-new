'use client';

import { useEffect } from 'react';

const PUBLIC_THEME_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api') + '/public/theme';

function hexToChannels(hex: string): string {
  const c = hex.replace('#', '').padEnd(6, '0');
  return `${parseInt(c.slice(0, 2), 16)} ${parseInt(c.slice(2, 4), 16)} ${parseInt(c.slice(4, 6), 16)}`;
}

export function ThemeLoader() {
  useEffect(() => {
    fetch(PUBLIC_THEME_URL)
      .then(r => r.json())
      .then(({ data }) => {
        if (!data) return;
        const root = document.documentElement;
        if (data.primaryColor)     root.style.setProperty('--color-primary',      hexToChannels(data.primaryColor));
        if (data.gradientEndColor) root.style.setProperty('--color-gradient-end', hexToChannels(data.gradientEndColor));
        if (data.gradientEndColor) root.style.setProperty('--color-accent',       hexToChannels(data.gradientEndColor));
      })
      .catch(() => {/* keep CSS defaults */});
  }, []);

  return null;
}
