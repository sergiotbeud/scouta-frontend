interface ScoutaLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showGrid?: boolean; // Por defecto true para mantener consistencia visual
}

export function ScoutaLogo({ size = 'md', className = '', showGrid = true }: ScoutaLogoProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  return (
    <svg 
      className={`${sizeClasses[size]} ${className}`} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Líneas del grid radial (opcional) */}
      {showGrid && (
        <>
          <line x1="50" y1="0" x2="50" y2="100" stroke="currentColor" strokeWidth="1.5" opacity="0.3"/>
          <line x1="50" y1="0" x2="13.4" y2="25" stroke="currentColor" strokeWidth="1.5" opacity="0.3"/>
          <line x1="50" y1="0" x2="86.6" y2="25" stroke="currentColor" strokeWidth="1.5" opacity="0.3"/>
          <line x1="50" y1="0" x2="13.4" y2="75" stroke="currentColor" strokeWidth="1.5" opacity="0.3"/>
          <line x1="50" y1="0" x2="86.6" y2="75" stroke="currentColor" strokeWidth="1.5" opacity="0.3"/>
          {/* Círculos concéntricos */}
          <circle cx="50" cy="50" r="20" stroke="currentColor" strokeWidth="1.5" opacity="0.3" fill="none"/>
          <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="1.5" opacity="0.3" fill="none"/>
        </>
      )}
      {/* Forma de estrella/radar (6 puntas) */}
      <path 
        d="M 50 10 L 60 35 L 86.6 35 L 68.3 50 L 86.6 65 L 60 65 L 50 90 L 40 65 L 13.4 65 L 31.7 50 L 13.4 35 L 40 35 Z" 
        fill="currentColor" 
        opacity={showGrid ? "0.8" : "1"}
        stroke="currentColor" 
        strokeWidth="2"
      />
    </svg>
  );
}

