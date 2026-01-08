'use client';

import { useAuthStore } from '../../../store/auth-store';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { usePlayers } from '../../../use-cases/usePlayers';
import Link from 'next/link';
import { AppHeader } from '../../../components/AppHeader';
import { SubscriptionBlockedBanner } from '../../../components/SubscriptionBlockedBanner';
import { AxiosApiClient } from '../../../adapters/api/AxiosApiClient';
import { useAuthStore as useAuth } from '../../../store/auth-store';
import { useMySubscription } from '../../../use-cases/useMySubscription';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const apiClient = new AxiosApiClient(API_URL);

const playerSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  positions: z.array(z.string()).min(1, 'Debes seleccionar al menos una posición'),
  age: z.number().int().min(0).max(150, 'La edad debe estar entre 0 y 150'),
  height: z.number().positive().optional().nullable(),
  weight: z.number().positive().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email('Email inválido').optional().nullable().or(z.literal('')),
  eps: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  emergencyContactName: z.string().optional().nullable(),
  emergencyContactPhone: z.string().optional().nullable(),
  emergencyContactRelation: z.string().optional().nullable(),
});

type PlayerFormData = z.infer<typeof playerSchema>;

export default function NewPlayerPage() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { createPlayer, isLoading, error } = usePlayers();
  const token = useAuth((state) => state.token);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const { subscription } = useMySubscription();
  const isSubscriptionActive = subscription?.status === 'ACTIVE';

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PlayerFormData>({
    resolver: zodResolver(playerSchema),
    defaultValues: {
      positions: [],
      height: null,
      weight: null,
      phone: null,
      email: null,
      eps: null,
      address: null,
      emergencyContactName: null,
      emergencyContactPhone: null,
      emergencyContactRelation: null,
    },
  });

  const positions = watch('positions');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.push('/login');
    }
  }, [mounted, isAuthenticated, router]);

  // Limpiar object URL cuando el componente se desmonte o cambie la foto
  useEffect(() => {
    return () => {
      if (photoPreview && photoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  const availablePositions = [
    'Portero',
    'Defensor Central',
    'Lateral Izquierdo',
    'Lateral Derecho',
    'Mediocampista Defensivo',
    'Mediocampista Central',
    'Mediocampista Ofensivo',
    'Extremo Izquierdo',
    'Extremo Derecho',
    'Delantero Centro',
    'Segundo Delantero',
  ];

  const handlePositionToggle = (position: string) => {
    const currentPositions = positions || [];
    const newPositions = currentPositions.includes(position)
      ? currentPositions.filter((p) => p !== position)
      : [...currentPositions, position];
    setValue('positions', newPositions, { shouldValidate: true });
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de archivo (incluyendo HEIC de iPhone)
      const validTypes = [
        'image/jpeg', 
        'image/jpg', 
        'image/png', 
        'image/webp', 
        'image/gif',
        'image/heic',
        'image/heif'
      ];
      
      // También verificar por extensión de archivo para HEIC
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      const validExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'heif'];
      
      if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension || '')) {
        alert('Formato de archivo no válido. Por favor selecciona una imagen (JPEG, PNG, WEBP, GIF, HEIC)');
        e.target.value = ''; // Limpiar el input
        return;
      }

      // Validar tamaño (20MB para fotos de iPhone en alta calidad)
      if (file.size > 20 * 1024 * 1024) {
        alert('El archivo es demasiado grande. El tamaño máximo es 20MB');
        e.target.value = ''; // Limpiar el input
        return;
      }

      // Limpiar el object URL anterior si existe
      if (photoPreview && photoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(photoPreview);
      }
      
      setPhotoFile(file);
      
      // Para HEIC/HEIF, los navegadores no pueden mostrarlos directamente
      // Usar createObjectURL para otros formatos, pero para HEIC mostrar un placeholder
      const isHeic = ['heic', 'heif'].includes(fileExtension || '') || 
                     ['image/heic', 'image/heif'].includes(file.type);
      
      if (isHeic) {
        // Para HEIC, mostrar un placeholder ya que el navegador no puede renderizarlo
        // El backend lo convertirá a JPEG al subirlo
        setPhotoPreview('heic-placeholder');
      } else {
        // Para otros formatos, usar createObjectURL
        try {
          const objectUrl = URL.createObjectURL(file);
          setPhotoPreview(objectUrl);
        } catch (error) {
          console.error('Error al crear object URL:', error);
          // Si falla, intentar con FileReader como fallback
          const reader = new FileReader();
          reader.onload = (event) => {
            const result = event.target?.result;
            if (result && typeof result === 'string') {
              setPhotoPreview(result);
            }
          };
          reader.onerror = () => {
            alert('Error al leer el archivo. Por favor intenta con otra imagen.');
            setPhotoFile(null);
            setPhotoPreview(null);
            e.target.value = '';
          };
          reader.readAsDataURL(file);
        }
      }
    } else {
      // Si no hay archivo, limpiar el preview
      if (photoPreview && photoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(photoPreview);
      }
      setPhotoFile(null);
      setPhotoPreview(null);
    }
  };

  const onSubmit = async (data: PlayerFormData) => {
    let photoUrl: string | null = null;

    // Subir foto si hay una seleccionada
    if (photoFile) {
      setIsUploadingPhoto(true);
      try {
        if (token) {
          apiClient.setToken(token);
        }
        const uploadResponse = await apiClient.uploadPlayerPhoto(photoFile);
        if (uploadResponse.success && uploadResponse.data) {
          photoUrl = uploadResponse.data.photoUrl;
        } else {
          alert('Error al subir la foto: ' + (uploadResponse.error || 'Error desconocido'));
          setIsUploadingPhoto(false);
          return;
        }
      } catch (err: any) {
        alert('Error al subir la foto: ' + (err.message || 'Error desconocido'));
        setIsUploadingPhoto(false);
        return;
      } finally {
        setIsUploadingPhoto(false);
      }
    }

    try {
      const result = await createPlayer({
        name: data.name,
        positions: data.positions,
        age: data.age,
        height: data.height,
        weight: data.weight,
        photoUrl,
        phone: data.phone || null,
        email: data.email || null,
        eps: data.eps || null,
        address: data.address || null,
        emergencyContactName: data.emergencyContactName || null,
        emergencyContactPhone: data.emergencyContactPhone || null,
        emergencyContactRelation: data.emergencyContactRelation || null,
      });

      if (result) {
        router.push('/players');
      }
    } catch (err: any) {
      console.error('Error al crear jugador:', err);
      // El error ya está manejado en usePlayers y se muestra en el estado error
    }
  };

  if (!mounted || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-white">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Header */}
      <AppHeader title="Scouta" subtitle="Nuevo Jugador" showBackButton={true} backUrl="/players" backLabel="Volver a Jugadores" />

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 max-w-2xl">
        <SubscriptionBlockedBanner />
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-1 h-8 bg-gradient-primary rounded-full"></div>
            <div>
              <h2 className="text-4xl font-bold text-white mb-1.5">
                Nuevo Jugador
              </h2>
              <p className="text-dark-text-secondary font-light">
                Agrega un nuevo jugador al sistema
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-error/20 border border-error/30 text-error-light px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {/* Form */}
        <div className="bg-dark-surface/80 backdrop-blur-xl border border-dark-border/50 rounded-3xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" style={{ pointerEvents: !isSubscriptionActive ? 'none' : 'auto', opacity: !isSubscriptionActive ? 0.5 : 1 }}>
            {/* Foto */}
            <div>
              <label htmlFor="photo" className="block text-sm font-medium text-white mb-2">
                Foto del Jugador
              </label>
              <div className="flex items-center gap-4">
                {photoPreview ? (
                  <div className="relative flex-shrink-0">
                    {photoPreview === 'heic-placeholder' ? (
                      <div className="w-24 h-24 rounded-xl bg-dark-elevated border-2 border-success/50 flex flex-col items-center justify-center shadow-lg">
                        <svg className="w-8 h-8 text-success mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-xs text-success font-semibold">HEIC</span>
                        <span className="text-xs text-dark-text-tertiary">Se convertirá</span>
                      </div>
                    ) : (
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="w-24 h-24 rounded-xl object-cover border-2 border-dark-border shadow-lg"
                        onError={(e) => {
                          console.error('Error al cargar preview de imagen');
                          // Limpiar el estado si hay un error real
                          if (photoPreview && photoPreview.startsWith('blob:')) {
                            URL.revokeObjectURL(photoPreview);
                          }
                          setPhotoPreview(null);
                          setPhotoFile(null);
                          const fileInput = document.getElementById('photo') as HTMLInputElement;
                          if (fileInput) {
                            fileInput.value = '';
                          }
                        }}
                        onLoad={() => {
                        }}
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        // Revocar el object URL para liberar memoria
                        if (photoPreview && photoPreview.startsWith('blob:')) {
                          URL.revokeObjectURL(photoPreview);
                        }
                        setPhotoPreview(null);
                        setPhotoFile(null);
                        // Limpiar el input file
                        const fileInput = document.getElementById('photo') as HTMLInputElement;
                        if (fileInput) {
                          fileInput.value = '';
                        }
                      }}
                      className="absolute -top-2 -right-2 bg-error text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-error/80 transition-colors shadow-lg z-10"
                      title="Eliminar foto"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-xl bg-dark-elevated border-2 border-dashed border-dark-border flex items-center justify-center flex-shrink-0">
                    <svg className="w-8 h-8 text-dark-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                <div className="flex-1">
                  <input
                    type="file"
                    id="photo"
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/heic,image/heif,.heic,.heif"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="photo"
                    className="inline-block px-4 py-2 bg-dark-elevated hover:bg-dark-hover text-white rounded-xl cursor-pointer transition-all border border-dark-border"
                  >
                    {photoPreview ? 'Cambiar Foto' : 'Seleccionar Foto'}
                  </label>
                  <p className="mt-1 text-xs text-dark-text-tertiary">
                    Formatos: JPEG, PNG, WEBP, GIF, HEIC (máx. 20MB)
                  </p>
                </div>
              </div>
            </div>

            {/* Nombre */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-white mb-2">
                Nombre Completo *
              </label>
              <input
                {...register('name')}
                type="text"
                id="name"
                className="w-full px-4 py-3 bg-dark-elevated border border-dark-border rounded-xl text-white placeholder-dark-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="Ej: Juan Pérez"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-error-light">{errors.name.message}</p>
              )}
            </div>

            {/* Posiciones */}
            <div>
              <label className="block text-sm font-medium text-white mb-3">
                Posiciones *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {availablePositions.map((position) => {
                  const isSelected = (positions || []).includes(position);
                  return (
                    <label
                      key={position}
                      className={`
                        flex items-center gap-3 px-4 py-3 rounded-xl border transition-all cursor-pointer
                        ${
                          isSelected
                            ? 'bg-primary-500/20 border-primary-500/50 text-primary-400'
                            : 'bg-dark-elevated border-dark-border text-white hover:bg-dark-hover'
                        }
                      `}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handlePositionToggle(position)}
                        className="w-5 h-5 rounded border-dark-border bg-dark-elevated text-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-bg cursor-pointer"
                      />
                      <span className="text-sm font-medium">{position}</span>
                    </label>
                  );
                })}
              </div>
              <input
                type="hidden"
                {...register('positions')}
              />
              {errors.positions && (
                <p className="mt-2 text-sm text-error-light">{errors.positions.message}</p>
              )}
              {(positions || []).length > 0 && (
                <p className="mt-2 text-sm text-dark-text-secondary">
                  {positions.length} posición{(positions || []).length !== 1 ? 'es' : ''} seleccionada{(positions || []).length !== 1 ? 's' : ''}
                </p>
              )}
            </div>

            {/* Edad */}
            <div>
              <label htmlFor="age" className="block text-sm font-medium text-white mb-2">
                Edad *
              </label>
              <input
                {...register('age', { valueAsNumber: true })}
                type="number"
                id="age"
                min="0"
                max="150"
                className="w-full px-4 py-3 bg-dark-elevated border border-dark-border rounded-xl text-white placeholder-dark-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="Ej: 22"
              />
              {errors.age && (
                <p className="mt-1 text-sm text-error-light">{errors.age.message}</p>
              )}
            </div>

            {/* Altura */}
            <div>
              <label htmlFor="height" className="block text-sm font-medium text-white mb-2">
                Altura (metros)
              </label>
              <input
                {...register('height', { valueAsNumber: true })}
                type="number"
                id="height"
                step="0.01"
                min="0"
                className="w-full px-4 py-3 bg-dark-elevated border border-dark-border rounded-xl text-white placeholder-dark-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="Ej: 1.75"
              />
              {errors.height && (
                <p className="mt-1 text-sm text-error-light">{errors.height.message}</p>
              )}
            </div>

            {/* Peso */}
            <div>
              <label htmlFor="weight" className="block text-sm font-medium text-white mb-2">
                Peso (kilogramos)
              </label>
              <input
                {...register('weight', { valueAsNumber: true })}
                type="number"
                id="weight"
                step="0.1"
                min="0"
                className="w-full px-4 py-3 bg-dark-elevated border border-dark-border rounded-xl text-white placeholder-dark-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="Ej: 70.5"
              />
              {errors.weight && (
                <p className="mt-1 text-sm text-error-light">{errors.weight.message}</p>
              )}
            </div>

            {/* Separador - Información de Contacto */}
            <div className="pt-4 border-t border-dark-border/50">
              <h3 className="text-lg font-semibold text-white mb-4">Información de Contacto</h3>
            </div>

            {/* Teléfono */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-white mb-2">
                Teléfono
              </label>
              <input
                {...register('phone')}
                type="tel"
                id="phone"
                className="w-full px-4 py-3 bg-dark-elevated border border-dark-border rounded-xl text-white placeholder-dark-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="Ej: +57 300 123 4567"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-error-light">{errors.phone.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                Email
              </label>
              <input
                {...register('email')}
                type="email"
                id="email"
                className="w-full px-4 py-3 bg-dark-elevated border border-dark-border rounded-xl text-white placeholder-dark-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="Ej: jugador@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-error-light">{errors.email.message}</p>
              )}
            </div>

            {/* EPS */}
            <div>
              <label htmlFor="eps" className="block text-sm font-medium text-white mb-2">
                EPS
              </label>
              <input
                {...register('eps')}
                type="text"
                id="eps"
                className="w-full px-4 py-3 bg-dark-elevated border border-dark-border rounded-xl text-white placeholder-dark-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="Ej: Sura, Coomeva, etc."
              />
              {errors.eps && (
                <p className="mt-1 text-sm text-error-light">{errors.eps.message}</p>
              )}
            </div>

            {/* Dirección */}
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-white mb-2">
                Dirección
              </label>
              <textarea
                {...register('address')}
                id="address"
                rows={3}
                className="w-full px-4 py-3 bg-dark-elevated border border-dark-border rounded-xl text-white placeholder-dark-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                placeholder="Ej: Calle 123 #45-67, Medellín, Antioquia"
              />
              {errors.address && (
                <p className="mt-1 text-sm text-error-light">{errors.address.message}</p>
              )}
            </div>

            {/* Separador - Contacto de Emergencia */}
            <div className="pt-4 border-t border-dark-border/50">
              <h3 className="text-lg font-semibold text-white mb-4">Contacto de Emergencia</h3>
            </div>

            {/* Nombre del Contacto de Emergencia */}
            <div>
              <label htmlFor="emergencyContactName" className="block text-sm font-medium text-white mb-2">
                Nombre del Contacto
              </label>
              <input
                {...register('emergencyContactName')}
                type="text"
                id="emergencyContactName"
                className="w-full px-4 py-3 bg-dark-elevated border border-dark-border rounded-xl text-white placeholder-dark-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="Ej: María Pérez"
              />
              {errors.emergencyContactName && (
                <p className="mt-1 text-sm text-error-light">{errors.emergencyContactName.message}</p>
              )}
            </div>

            {/* Teléfono del Contacto de Emergencia */}
            <div>
              <label htmlFor="emergencyContactPhone" className="block text-sm font-medium text-white mb-2">
                Teléfono del Contacto
              </label>
              <input
                {...register('emergencyContactPhone')}
                type="tel"
                id="emergencyContactPhone"
                className="w-full px-4 py-3 bg-dark-elevated border border-dark-border rounded-xl text-white placeholder-dark-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="Ej: +57 300 123 4567"
              />
              {errors.emergencyContactPhone && (
                <p className="mt-1 text-sm text-error-light">{errors.emergencyContactPhone.message}</p>
              )}
            </div>

            {/* Relación del Contacto de Emergencia */}
            <div>
              <label htmlFor="emergencyContactRelation" className="block text-sm font-medium text-white mb-2">
                Relación
              </label>
              <select
                {...register('emergencyContactRelation')}
                id="emergencyContactRelation"
                className="w-full px-4 py-3 bg-dark-elevated border border-dark-border rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all [&>option]:bg-dark-elevated [&>option]:text-white"
              >
                <option value="">Seleccionar relación</option>
                <option value="Padre">Padre</option>
                <option value="Madre">Madre</option>
                <option value="Hermano/a">Hermano/a</option>
                <option value="Tío/a">Tío/a</option>
                <option value="Abuelo/a">Abuelo/a</option>
                <option value="Otro">Otro</option>
              </select>
              {errors.emergencyContactRelation && (
                <p className="mt-1 text-sm text-error-light">{errors.emergencyContactRelation.message}</p>
              )}
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 pt-4">
              <button
                type="submit"
                disabled={isLoading || isUploadingPhoto || !isSubscriptionActive}
                className="flex-1 bg-gradient-success hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 px-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-success/30 transform hover:scale-[1.01] active:scale-[0.99]"
                title={!isSubscriptionActive ? 'Suscripción inactiva' : ''}
              >
                {isLoading || isUploadingPhoto ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Guardando...</span>
                  </span>
                ) : (
                  'Crear Jugador'
                )}
              </button>
              <Link
                href="/players"
                className="px-6 py-3.5 bg-dark-elevated hover:bg-dark-hover text-white font-semibold rounded-xl transition-all duration-200 text-center"
              >
                Cancelar
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

