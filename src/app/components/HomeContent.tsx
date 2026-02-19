'use client';

import type React from 'react';
import { useTheme } from '../context/ThemeContext';

export default function HomeContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentTheme } = useTheme();
  return <main key={currentTheme}>{children}</main>;
}
