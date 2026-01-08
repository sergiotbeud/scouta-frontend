'use client';

import { useAuthStore } from '../../store/auth-store';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useEvaluators } from '../../use-cases/useEvaluators';
import { useMyClub } from '../../use-cases/useMyClub';
import { AppHeader } from '../../components/AppHeader';
import { SubscriptionBlockedBanner } from '../../components/SubscriptionBlockedBanner';
import { User, CreateEvaluatorRequest, UpdateEvaluatorRequest } from '../../ports/IApiClient';
import { UserRole } from '../../domain/entities/User';
import Link from 'next/link';
import { AxiosApiClient } from '../../adapters/api/AxiosApiClient';
import { useMySubscription } from '../../use-cases/useMySubscription';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const apiClient = new AxiosApiClient(API_URL);

export default function EvaluatorsPage() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { evaluators, isLoading, error, createEvaluator, updateEvaluator, deleteEvaluator } = useEvaluators();
  const { club } = useMyClub();
  const { subscription } = useMySubscription();
  const isSubscriptionActive = subscription?.status === 'ACTIVE';
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEvaluator, setSelectedEvaluator] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.push('/login');
    }
  }, [mounted, isAuthenticated, router]);

  useEffect(() => {
    if (mounted && user && user.role !== UserRole.ADMIN) {
      router.push('/dashboard');
    }
  }, [mounted, user, router]);

  // Limpiar object URL cuando el componente se desmonte o cambie la foto
  useEffect(() => {
    return () => {
      if (photoPreview && photoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  if (!mounted || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-white">Cargando...</div>
      </div>
    );
  }

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isSubscriptionActive) {
      alert('No puedes crear evaluadores porque tu suscripción no está activa. Por favor, contacta al Super Admin para activar tu suscripción.');
      return;
    }
    if (!club) {
      alert('No se pudo obtener la información del club');
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    let photoUrl: string | null = null;
    if (photoFile) {
      setIsUploadingPhoto(true);
      try {
        if (token) {
          apiClient.setToken(token);
        }
        const uploadResponse = await apiClient.uploadUserPhoto(photoFile);
        if (uploadResponse.success && uploadResponse.data) {
          photoUrl = uploadResponse.data.photoUrl;
        } else {
          alert('Error al subir la foto: ' + (uploadResponse.error || 'Error desconocido'));
          setIsUploadingPhoto(false);
          setIsSubmitting(false);
          return;
        }
      } catch (err: any) {
        alert('Error al subir la foto: ' + (err.message || 'Error desconocido'));
        setIsUploadingPhoto(false);
        setIsSubmitting(false);
        return;
      } finally {
        setIsUploadingPhoto(false);
      }
    }

    const evaluatorData: CreateEvaluatorRequest = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      photoUrl,
      clubId: club.id,
    };

    const result = await createEvaluator(evaluatorData);
    if (result) {
      setShowCreateModal(false);
      setPhotoFile(null);
      setPhotoPreview(null);
      (e.target as HTMLFormElement).reset();
    }
    setIsSubmitting(false);
  };

  const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedEvaluator) return;

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    let photoUrl: string | null | undefined = selectedEvaluator.photoUrl || null;
    if (photoFile) {
      setIsUploadingPhoto(true);
      try {
        if (token) {
          apiClient.setToken(token);
        }
        const uploadResponse = await apiClient.uploadUserPhoto(photoFile);
        if (uploadResponse.success && uploadResponse.data) {
          photoUrl = uploadResponse.data.photoUrl;
        } else {
          alert('Error al subir la foto: ' + (uploadResponse.error || 'Error desconocido'));
          setIsUploadingPhoto(false);
          setIsSubmitting(false);
          return;
        }
      } catch (err: any) {
        alert('Error al subir la foto: ' + (err.message || 'Error desconocido'));
        setIsUploadingPhoto(false);
        setIsSubmitting(false);
        return;
      } finally {
        setIsUploadingPhoto(false);
      }
    }

    const evaluatorData: UpdateEvaluatorRequest = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      password: formData.get('password') as string || undefined,
      photoUrl,
      isActive: formData.get('isActive') === 'true',
    };

    const result = await updateEvaluator(selectedEvaluator.id, evaluatorData);
    if (result) {
      setShowEditModal(false);
      setSelectedEvaluator(null);
      setPhotoFile(null);
      setPhotoPreview(null);
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este evaluador?')) {
      return;
    }

    await deleteEvaluator(id);
  };

  return (
    <div className="min-h-screen bg-dark-bg">
      <AppHeader title="Scouta" subtitle="Evaluadores" showBackButton={true} backUrl="/dashboard" backLabel="Volver al Dashboard" />

      <main className="container mx-auto px-6 py-8 max-w-6xl">
        <SubscriptionBlockedBanner />
        {/* Header con botón de crear */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Evaluadores</h2>
            <p className="text-dark-text-secondary">
              Gestiona los evaluadores de tu club
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            disabled={!isSubscriptionActive}
            className={`inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-success text-white font-semibold rounded-xl transition-all duration-200 shadow-lg text-sm sm:text-base w-full sm:w-auto ${
              !isSubscriptionActive 
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:opacity-95 hover:shadow-xl hover:shadow-success/30'
            }`}
            title={!isSubscriptionActive ? 'Suscripción inactiva' : ''}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Evaluador
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-error/20 border border-error/30 text-error-light px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {/* Lista de Evaluadores */}
        {isLoading ? (
          <div className="bg-dark-surface/80 backdrop-blur-xl border border-dark-border/50 rounded-3xl p-12 shadow-2xl text-center">
            <div className="text-dark-text-secondary">Cargando evaluadores...</div>
          </div>
        ) : evaluators.length === 0 ? (
          <div className="bg-dark-surface/80 backdrop-blur-xl border border-dark-border/50 rounded-3xl p-12 shadow-2xl text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-dark-elevated flex items-center justify-center">
              <svg className="w-10 h-10 text-dark-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-dark-text-secondary mb-4">
              Aún no hay evaluadores registrados
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              disabled={!isSubscriptionActive}
              className={`inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-success text-white font-semibold rounded-xl transition-all duration-200 shadow-lg text-sm sm:text-base ${
                !isSubscriptionActive 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:opacity-95 hover:shadow-xl hover:shadow-success/30'
              }`}
              title={!isSubscriptionActive ? 'Suscripción inactiva' : ''}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Crear Primer Evaluador
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {evaluators.map((evaluator) => (
              <div
                key={evaluator.id}
                className="bg-dark-surface/80 backdrop-blur-xl border border-dark-border/50 rounded-2xl p-6 shadow-2xl hover:border-primary-500/50 transition-all duration-200"
              >
                <div className="flex items-start gap-4 mb-4">
                  {evaluator.photoUrl ? (
                    <img
                      src={evaluator.photoUrl.startsWith('/') 
                        ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}${evaluator.photoUrl}`
                        : evaluator.photoUrl}
                      alt={evaluator.name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-primary-500/50"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-dark-elevated border-2 border-primary-500/50 flex items-center justify-center flex-shrink-0">
                      <svg className="w-8 h-8 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-white truncate">{evaluator.name}</h3>
                    <p className="text-sm text-dark-text-secondary truncate">{evaluator.email}</p>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold mt-2 ${
                      evaluator.isActive 
                        ? 'bg-success/20 text-success-light border border-success/30' 
                        : 'bg-error/20 text-error-light border border-error/30'
                    }`}>
                      {evaluator.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedEvaluator(evaluator);
                      setShowEditModal(true);
                    }}
                    disabled={!isSubscriptionActive}
                    className={`flex-1 px-4 py-2 text-sm rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                      !isSubscriptionActive
                        ? 'opacity-50 cursor-not-allowed bg-dark-elevated text-dark-text-tertiary border border-dark-border'
                        : 'bg-primary-500/20 hover:bg-primary-500/30 text-primary-400 border border-primary-500/50'
                    }`}
                    title={!isSubscriptionActive ? 'Suscripción inactiva' : ''}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(evaluator.id)}
                    disabled={!isSubscriptionActive}
                    className={`px-4 py-2 text-sm rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                      !isSubscriptionActive
                        ? 'opacity-50 cursor-not-allowed bg-dark-elevated text-dark-text-tertiary border border-dark-border'
                        : 'bg-error/20 hover:bg-error/30 text-error-light border border-error/50'
                    }`}
                    title={!isSubscriptionActive ? 'Suscripción inactiva' : ''}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal Crear Evaluador */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-dark-surface border border-dark-border rounded-3xl p-6 sm:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">Nuevo Evaluador</h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setPhotoFile(null);
                    setPhotoPreview(null);
                  }}
                  className="text-dark-text-tertiary hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleCreate} className="space-y-4" style={{ pointerEvents: !isSubscriptionActive ? 'none' : 'auto', opacity: !isSubscriptionActive ? 0.5 : 1 }}>
                <div>
                  <label className="block text-sm font-medium text-dark-text-secondary mb-2">
                    Foto del Evaluador (opcional)
                  </label>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-24 h-24 rounded-full bg-dark-elevated flex items-center justify-center flex-shrink-0 overflow-hidden border border-dark-border/50">
                      {photoPreview && photoPreview !== 'heic-placeholder' ? (
                        <img src={photoPreview} alt="Foto Preview" className="w-full h-full object-cover" />
                      ) : photoPreview === 'heic-placeholder' ? (
                        <span className="text-dark-text-secondary text-xs text-center p-2">HEIC (se convertirá)</span>
                      ) : (
                        <svg className="w-10 h-10 text-dark-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      )}
                    </div>
                    <input
                      type="file"
                      name="photo"
                      accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const fileExtension = file.name.toLowerCase().split('.').pop();
                          const isHeic = ['heic', 'heif'].includes(fileExtension || '');
                          
                          if (isHeic) {
                            setPhotoPreview('heic-placeholder');
                          } else {
                            const objectUrl = URL.createObjectURL(file);
                            setPhotoPreview(objectUrl);
                          }
                          setPhotoFile(file);
                        } else {
                          setPhotoFile(null);
                          setPhotoPreview(null);
                        }
                      }}
                      className="block w-full text-sm text-dark-text-secondary
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-xl file:border-0
                        file:text-sm file:font-semibold
                        file:bg-primary-500/20 file:text-primary-400
                        hover:file:bg-primary-500/30 file:cursor-pointer"
                    />
                  </div>
                  <p className="text-xs text-dark-text-tertiary mt-1">
                    Formatos soportados: JPEG, PNG, WEBP, GIF, HEIC (máx. 20MB)
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-text-secondary mb-2">
                    Nombre
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="w-full px-4 py-3 bg-dark-elevated border border-dark-border/50 rounded-xl text-white focus:outline-none focus:border-primary-500"
                    placeholder="Nombre del evaluador"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-text-secondary mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    className="w-full px-4 py-3 bg-dark-elevated border border-dark-border/50 rounded-xl text-white focus:outline-none focus:border-primary-500"
                    placeholder="evaluador@club.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-text-secondary mb-2">
                    Contraseña
                  </label>
                  <input
                    type="password"
                    name="password"
                    required
                    minLength={6}
                    className="w-full px-4 py-3 bg-dark-elevated border border-dark-border/50 rounded-xl text-white focus:outline-none focus:border-primary-500"
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
                <div className="flex items-center gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-3 bg-dark-elevated hover:bg-dark-hover text-white font-semibold rounded-xl transition-all duration-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || isUploadingPhoto}
                    className="flex-1 px-4 py-3 bg-gradient-success hover:opacity-95 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50"
                  >
                    {isUploadingPhoto ? 'Subiendo foto...' : isSubmitting ? 'Creando...' : 'Crear'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Editar Evaluador */}
        {showEditModal && selectedEvaluator && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-dark-surface border border-dark-border rounded-3xl p-6 sm:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">Editar Evaluador</h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedEvaluator(null);
                    setPhotoFile(null);
                    setPhotoPreview(null);
                  }}
                  className="text-dark-text-tertiary hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleEdit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark-text-secondary mb-2">
                    Foto del Evaluador (opcional)
                  </label>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-24 h-24 rounded-full bg-dark-elevated flex items-center justify-center flex-shrink-0 overflow-hidden border border-dark-border/50">
                      {photoPreview && photoPreview !== 'heic-placeholder' ? (
                        <img src={photoPreview} alt="Foto Preview" className="w-full h-full object-cover" />
                      ) : photoPreview === 'heic-placeholder' ? (
                        <span className="text-dark-text-secondary text-xs text-center p-2">HEIC (se convertirá)</span>
                      ) : selectedEvaluator.photoUrl ? (
                        <img
                          src={selectedEvaluator.photoUrl.startsWith('/') 
                            ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}${selectedEvaluator.photoUrl}`
                            : selectedEvaluator.photoUrl}
                          alt="Foto actual"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <svg className="w-10 h-10 text-dark-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      )}
                    </div>
                    <input
                      type="file"
                      name="photo"
                      accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const fileExtension = file.name.toLowerCase().split('.').pop();
                          const isHeic = ['heic', 'heif'].includes(fileExtension || '');
                          
                          if (isHeic) {
                            setPhotoPreview('heic-placeholder');
                          } else {
                            const objectUrl = URL.createObjectURL(file);
                            setPhotoPreview(objectUrl);
                          }
                          setPhotoFile(file);
                        } else {
                          setPhotoFile(null);
                          setPhotoPreview(null);
                        }
                      }}
                      className="block w-full text-sm text-dark-text-secondary
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-xl file:border-0
                        file:text-sm file:font-semibold
                        file:bg-primary-500/20 file:text-primary-400
                        hover:file:bg-primary-500/30 file:cursor-pointer"
                    />
                  </div>
                  <p className="text-xs text-dark-text-tertiary mt-1">
                    Formatos soportados: JPEG, PNG, WEBP, GIF, HEIC (máx. 20MB). Dejar vacío para mantener la foto actual.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-text-secondary mb-2">
                    Nombre
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    defaultValue={selectedEvaluator.name}
                    className="w-full px-4 py-3 bg-dark-elevated border border-dark-border/50 rounded-xl text-white focus:outline-none focus:border-primary-500"
                    placeholder="Nombre del evaluador"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-text-secondary mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    defaultValue={selectedEvaluator.email}
                    className="w-full px-4 py-3 bg-dark-elevated border border-dark-border/50 rounded-xl text-white focus:outline-none focus:border-primary-500"
                    placeholder="evaluador@club.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-text-secondary mb-2">
                    Nueva Contraseña (opcional)
                  </label>
                  <input
                    type="password"
                    name="password"
                    minLength={6}
                    className="w-full px-4 py-3 bg-dark-elevated border border-dark-border/50 rounded-xl text-white focus:outline-none focus:border-primary-500"
                    placeholder="Dejar vacío para mantener la actual"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-text-secondary mb-2">
                    Estado
                  </label>
                  <select
                    name="isActive"
                    defaultValue={selectedEvaluator.isActive ? 'true' : 'false'}
                    className="w-full px-4 py-3 bg-dark-elevated border border-dark-border/50 rounded-xl text-white focus:outline-none focus:border-primary-500"
                  >
                    <option value="true">Activo</option>
                    <option value="false">Inactivo</option>
                  </select>
                </div>
                <div className="flex items-center gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedEvaluator(null);
                    }}
                    className="flex-1 px-4 py-3 bg-dark-elevated hover:bg-dark-hover text-white font-semibold rounded-xl transition-all duration-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || isUploadingPhoto}
                    className="flex-1 px-4 py-3 bg-gradient-success hover:opacity-95 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50"
                  >
                    {isUploadingPhoto ? 'Subiendo foto...' : isSubmitting ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

