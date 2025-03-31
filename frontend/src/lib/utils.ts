import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getEmailDomain(email: string): string | null {
  try {
    return email.split('@')[1].toLowerCase();
  } catch (error) {
    console.error('Invalid email format:', email);
    return null;
  }
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function generateAvatarUrl(name: string): string {
  // Simple utility to generate an avatar from initials using UI Avatars or similar service
  const encoded = encodeURIComponent(name);
  return `https://ui-avatars.com/api/?name=${encoded}&background=random`;
}