export const CATEGORY_COLORS = {
  green: {
    bg: 'bg-green-100',
    text: 'text-green-600'
  },
  blue: {
    bg: 'bg-blue-100',
    text: 'text-blue-600'
  },
  purple: {
    bg: 'bg-purple-100',
    text: 'text-purple-600'
  },
  yellow: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-700'
  },
  red: {
    bg: 'bg-red-100',
    text: 'text-red-600'
  },
  gray: {
    bg: 'bg-gray-100',
    text: 'text-gray-600'
  }
} as const;

export type CategoryColorKey = keyof typeof CATEGORY_COLORS;
