/**
 * Construye la URL completa de una imagen desde el backend
 * @param photoUrl - URL relativa de la foto (ej: "/uploads/players/photo.jpg")
 * @returns URL completa para usar en el frontend
 */
export function getImageUrl(photoUrl: string | null | undefined): string | null {
  if (!photoUrl) {
    return null;
  }

  // Si ya es una URL completa (http:// o https://), devolverla tal cual
  if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://')) {
    return photoUrl;
  }

  // Si empieza con /, construir URL completa con el API URL
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  
  // Asegurar que photoUrl empiece con /
  const normalizedPhotoUrl = photoUrl.startsWith('/') ? photoUrl : `/${photoUrl}`;
  
  return `${apiUrl}${normalizedPhotoUrl}`;
}

