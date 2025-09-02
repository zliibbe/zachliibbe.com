'use client';

import React from 'react';
import { useTheme } from '../context/ThemeContext';
import styles from '../page.module.css';

export default function HomeContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentTheme } = useTheme();
  return <main key={currentTheme}>{children}</main>;
}
