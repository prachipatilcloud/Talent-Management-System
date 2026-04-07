/**
 * Round Labels and Types Configuration
 * This file centralizes all interview round naming and type mappings
 */

export const ROUND_LABELS = {
  1: 'Round 1',
  2: 'Round 2',
  3: 'Round 3',
  4: 'Round 4'
};

export const ROUND_TYPES = {
  1: 'technical',
  2: 'technical',
  3: 'client',
  4: 'hr'
};

// Round sequence array (for iteration)
export const ROUND_SEQUENCE = [
  'Round 1',
  'Round 2',
  'Round 3',
  'Round 4'
];

// Round names array for dropdowns
export const ROUND_NAMES = [
  'Round 1',
  'Round 2',
  'Round 3',
  'Round 4'
];

// Mapping from display label to type
export const ROUND_LABEL_TO_TYPE = {
  'Round 1': 'technical',
  'Round 2': 'technical',
  'Round 3': 'client',
  'Round 4': 'hr'
};

// Mapping from type to array of round labels
export const ROUND_TYPE_TO_LABELS = {
  technical: ['Round 1', 'Round 2'],
  client: ['Round 3'],
  hr: ['Round 4']
};

// Color configuration for different rounds
export const ROUND_COLOR_CONFIG = {
  'Round 1': { bg: '#eef2ff', color: '#4338ca' },
  'Round 2': { bg: '#eef2ff', color: '#4338ca' },
  'Round 3': { bg: '#faf5ff', color: '#7e22ce' },
  'Round 4': { bg: '#f0fdf4', color: '#15803d' }
};
