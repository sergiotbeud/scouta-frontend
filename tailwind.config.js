/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e3f2fd',
          100: '#bbdefb',
          200: '#90caf9',
          300: '#64b5f6',
          400: '#42a5f5',
          500: '#2196f3',
          600: '#1976d2',
          700: '#1565c0',
          800: '#0d47a1',
          900: '#0a3d91',
        },
        'primary-dark': '#42a5f5',
        success: {
          DEFAULT: '#4caf50',
          light: '#66bb6a',
          dark: '#388e3c',
        },
        warning: {
          DEFAULT: '#ff9800',
          light: '#ffb74d',
          dark: '#f57c00',
        },
        error: {
          DEFAULT: '#f44336',
          light: '#ef5350',
          dark: '#d32f2f',
        },
        dark: {
          bg: '#000000',
          surface: '#1a1a1a',
          elevated: '#252525',
          hover: '#2a2a2a',
          border: '#333333',
          text: '#ffffff',
          'text-secondary': '#b3b3b3',
          'text-tertiary': '#808080',
        },
      },
      fontFamily: {
        sans: ['Segoe UI', 'Tahoma', 'Geneva', 'Verdana', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
        'gradient-success': 'linear-gradient(90deg, #4caf50 0%, #388e3c 100%)',
      },
      backgroundColor: {
        'success-20': 'rgba(76, 175, 80, 0.2)',
      },
      boxShadow: {
        'glow-primary': '0 0 20px rgba(33, 150, 243, 0.3)',
      },
    },
  },
  plugins: [],
}

