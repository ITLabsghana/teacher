import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const CLASS_LEVELS = [
  'KG 1', 'KG 2',
  'Basic 1', 'Basic 2', 'Basic 3', 'Basic 4', 'Basic 5', 'Basic 6',
  'JHS 1', 'JHS 2', 'JHS 3',
  'SHS 1', 'SHS 2', 'SHS 3'
];

export function sortClassLevels(levels: string[]): string[] {
  return levels.sort((a, b) => {
    const indexA = CLASS_LEVELS.indexOf(a);
    const indexB = CLASS_LEVELS.indexOf(b);

    // if one is not in the list, it goes to the end
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    
    return indexA - indexB;
  });
}
