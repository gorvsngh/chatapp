import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  colors: {
    brand: {
      50: '#f5f5f5',
      100: '#e8e8e8',
      200: '#d1d1d1',
      300: '#b4b4b4',
      400: '#888888',
      500: '#2D3748', // Primary dark
      600: '#1A202C',
      700: '#171923',
      800: '#1A1A1A',
      900: '#000000',
    },
    gray: {
      50: '#fafafa',
      100: '#f4f4f4',
      200: '#e8e8e8',
      300: '#d6d6d6',
      400: '#a8a8a8',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
    accent: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
    },
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    chatBg: '#f8f9fa',
    messageBg: '#ffffff',
    myMessageBg: '#2D3748',
  },
  fonts: {
    heading: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
    body: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
  },
  fontSizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    md: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: '600',
        borderRadius: '8px',
        _focus: {
          boxShadow: '0 0 0 3px rgba(45, 55, 72, 0.1)'
        }
      },
      variants: {
        solid: {
          bg: 'brand.500',
          color: 'white',
          _hover: {
            bg: 'brand.600',
            transform: 'translateY(-1px)',
            boxShadow: 'md'
          },
          _active: {
            bg: 'brand.700',
            transform: 'translateY(0)'
          }
        },
        ghost: {
          _hover: {
            bg: 'brand.50'
          }
        },
        outline: {
          borderColor: 'brand.300',
          color: 'brand.600',
          _hover: {
            bg: 'brand.50',
            borderColor: 'brand.400'
          }
        }
      },
    },
    Input: {
      variants: {
        outline: {
          field: {
            borderColor: 'gray.200',
            _hover: {
              borderColor: 'gray.300'
            },
            _focus: {
              borderColor: 'brand.500',
              boxShadow: '0 0 0 1px rgba(45, 55, 72, 0.2)'
            }
          }
        }
      }
    },
    Card: {
      baseStyle: {
        container: {
          bg: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          border: '1px solid',
          borderColor: 'gray.100'
        }
      }
    }
  },
  styles: {
    global: {
      body: {
        bg: 'gray.50',
        color: 'gray.800'
      },
      '*': {
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(155, 155, 155, 0.5) transparent'
      },
      '*::-webkit-scrollbar': {
        width: '4px'
      },
      '*::-webkit-scrollbar-track': {
        background: 'transparent'
      },
      '*::-webkit-scrollbar-thumb': {
        background: 'rgba(155, 155, 155, 0.5)',
        borderRadius: '20px'
      }
    },
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
  }
});

export default theme; 