import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  breakpoints: {
    sm: '320px',
    md: '768px',
    lg: '960px',
    xl: '1200px',
    '2xl': '1600px',
  },
  colors: {
    brand: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280', // Primary grey
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
    gray: {
      50: '#ffffff',
      100: '#f9fafb',
      200: '#f3f4f6',
      300: '#e5e7eb',
      400: '#d1d5db',
      500: '#9ca3af',
      600: '#6b7280',
      700: '#4b5563',
      800: '#374151',
      900: '#1f2937',
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
    chatBg: '#ffffff',
    messageBg: '#f3f4f6',
    myMessageBg: '#e5e7eb',
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
  space: {
    // Mobile-optimized spacing
    'mobile-xs': '0.25rem',
    'mobile-sm': '0.5rem',
    'mobile-md': '0.75rem',
    'mobile-lg': '1rem',
    'mobile-xl': '1.25rem',
    'mobile-2xl': '1.5rem',
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: '600',
        borderRadius: '8px',
        _focus: {
          boxShadow: '0 0 0 3px rgba(107, 114, 128, 0.1)'
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
            bg: 'gray.100'
          }
        },
        outline: {
          borderColor: 'gray.300',
          color: 'brand.600',
          _hover: {
            bg: 'gray.50',
            borderColor: 'gray.400'
          }
        },
        // Mobile-optimized button variant
        mobile: {
          minH: '44px', // Touch-friendly minimum height
          px: '16px',
          py: '12px',
          fontSize: '16px', // Prevent zoom on iOS
          borderRadius: '12px',
          _active: {
            transform: 'scale(0.98)'
          }
        }
      },
      sizes: {
        // Mobile-optimized sizes
        mobile: {
          h: '44px',
          minW: '44px',
          fontSize: '16px',
        }
      }
    },
    Input: {
      variants: {
        outline: {
          field: {
            borderColor: 'gray.300',
            bg: 'white',
            _hover: {
              borderColor: 'gray.400'
            },
            _focus: {
              borderColor: 'brand.500',
              boxShadow: '0 0 0 1px rgba(107, 114, 128, 0.2)'
            }
          }
        },
        // Mobile-optimized input variant
        mobile: {
          field: {
            minH: '44px',
            fontSize: '16px', // Prevent zoom on iOS
            borderRadius: '12px',
            borderColor: 'gray.300',
            bg: 'white',
            _focus: {
              borderColor: 'brand.500',
              boxShadow: '0 0 0 2px rgba(107, 114, 128, 0.2)'
            }
          }
        }
      },
      sizes: {
        mobile: {
          field: {
            h: '44px',
            fontSize: '16px',
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
          borderColor: 'gray.200'
        }
      }
    },
    // Mobile-optimized IconButton
    IconButton: {
      variants: {
        mobile: {
          minW: '44px',
          minH: '44px',
          borderRadius: '12px',
          _active: {
            transform: 'scale(0.95)'
          }
        }
      },
      sizes: {
        mobile: {
          w: '44px',
          h: '44px',
        }
      }
    }
  },
  styles: {
    global: {
      body: {
        bg: 'white',
        color: 'gray.800'
      },
      '*': {
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(156, 163, 175, 0.5) transparent'
      },
      '*::-webkit-scrollbar': {
        width: '4px'
      },
      '*::-webkit-scrollbar-track': {
        background: 'transparent'
      },
      '*::-webkit-scrollbar-thumb': {
        background: 'rgba(156, 163, 175, 0.5)',
        borderRadius: '20px'
      },
      // Mobile-specific global styles
      '@media (max-width: 768px)': {
        body: {
          fontSize: '16px', // Prevent zoom on iOS
          lineHeight: '1.5',
        },
        // Disable text selection on mobile for better UX
        '.no-select': {
          WebkitTouchCallout: 'none',
          WebkitUserSelect: 'none',
          KhtmlUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none',
          userSelect: 'none',
        },
        // Improve touch targets
        'button, [role="button"]': {
          minHeight: '44px',
          minWidth: '44px',
        }
      }
    },
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    // Mobile-specific shadows
    mobile: '0 2px 8px rgba(0, 0, 0, 0.15)',
    'mobile-lg': '0 4px 16px rgba(0, 0, 0, 0.2)',
  }
});

export default theme; 