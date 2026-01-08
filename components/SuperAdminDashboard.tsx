'use client';

import { useState } from 'react';
import { useClubs } from '../use-cases/useClubs';
import { useSubscription } from '../use-cases/useSubscriptions';
import { AxiosApiClient } from '../adapters/api/AxiosApiClient';
import { useAuthStore } from '../store/auth-store';
import { Club, Subscription, CreateSubscriptionRequest } from '../ports/IApiClient';
import { UserRole } from '../domain/entities/User';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const apiClient = new AxiosApiClient(API_URL);

export function SuperAdminDashboard() {
  const { clubs, isLoading: clubsLoading, error: clubsError, fetchClubs } = useClubs();
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);

  const { subscription, isLoading: subscriptionLoading, error: subscriptionError, fetchSubscription, createSubscription, updateSubscription } = useSubscription(
    selectedClub?.id || ''
  );

  const handleSelectClub = async (club: Club) => {
    setSelectedClub(club);
    // Limpiar la suscripción anterior antes de cargar la nueva
    // Esto fuerza a que se recargue correctamente
    await fetchSubscription();
  };

  const handleCreateClub = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget);
      const name = formData.get('name') as string;
      const adminEmail = formData.get('adminEmail') as string;
      const adminName = formData.get('adminName') as string;
      const adminPassword = formData.get('adminPassword') as string;

      if (token) {
        apiClient.setToken(token);
      }

      let logoUrl: string | null = null;

      // Subir logo si hay uno seleccionado
      if (logoFile) {
        setIsUploadingLogo(true);
        try {
          const uploadResponse = await apiClient.uploadClubLogo(logoFile);
          if (uploadResponse.success && uploadResponse.data) {
            logoUrl = uploadResponse.data.photoUrl;
          } else {
            alert('Error al subir el logo: ' + (uploadResponse.error || 'Error desconocido'));
            setIsUploadingLogo(false);
            setIsSubmitting(false);
            return;
          }
        } catch (err: any) {
          alert('Error al subir el logo: ' + (err.message || 'Error desconocido'));
          setIsUploadingLogo(false);
          setIsSubmitting(false);
          return;
        } finally {
          setIsUploadingLogo(false);
        }
      }

      const response = await apiClient.createClub({
        name,
        logoUrl,
        adminEmail,
        adminName,
        adminPassword,
      });

      if (response.success) {
        // Reset form antes de cerrar el modal
        e.currentTarget.reset();
        setShowCreateModal(false);
        setLogoFile(null);
        setLogoPreview(null);
        await fetchClubs();
        // Si se seleccionó un club, refrescar la suscripción
        if (selectedClub) {
          await fetchSubscription();
        }
      } else {
        alert(response.error || 'Error al crear club');
      }
    } catch (error: any) {
      alert(error.message || 'Error al crear club');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateClub = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedClub) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget);
      const name = formData.get('name') as string;
      const isActive = formData.get('isActive') === 'true';

      if (token) {
        apiClient.setToken(token);
      }

      let logoUrl: string | null = selectedClub.logoUrl || null;

      // Subir logo si hay uno nuevo seleccionado
      if (logoFile) {
        setIsUploadingLogo(true);
        try {
          const uploadResponse = await apiClient.uploadClubLogo(logoFile);
          if (uploadResponse.success && uploadResponse.data) {
            logoUrl = uploadResponse.data.photoUrl;
          } else {
            alert('Error al subir el logo: ' + (uploadResponse.error || 'Error desconocido'));
            setIsUploadingLogo(false);
            setIsSubmitting(false);
            return;
          }
        } catch (err: any) {
          alert('Error al subir el logo: ' + (err.message || 'Error desconocido'));
          setIsUploadingLogo(false);
          setIsSubmitting(false);
          return;
        } finally {
          setIsUploadingLogo(false);
        }
      }

      const response = await apiClient.updateClub(selectedClub.id, {
        name,
        logoUrl,
        isActive,
      });

      if (response.success) {
        setShowEditModal(false);
        setLogoFile(null);
        setLogoPreview(null);
        await fetchClubs();
        if (selectedClub) {
          setSelectedClub({ ...selectedClub, ...response.data });
        }
      } else {
        // Mostrar detalles de validación si están disponibles
        const errorMessage = response.details 
          ? `${response.error}\n\nDetalles: ${JSON.stringify(response.details, null, 2)}`
          : response.error || 'Error al actualizar club';
        alert(errorMessage);
      }
    } catch (error: any) {
      console.error('Error updating club:', error);
      alert(error.message || 'Error al actualizar club');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClub = async (clubId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este club?')) {
      return;
    }

    try {
      if (token) {
        apiClient.setToken(token);
      }

      const response = await apiClient.deleteClub(clubId);
      if (response.success) {
        fetchClubs();
        if (selectedClub?.id === clubId) {
          setSelectedClub(null);
        }
      } else {
        alert(response.error || 'Error al eliminar club');
      }
    } catch (error: any) {
      alert(error.message || 'Error al eliminar club');
    }
  };

  const handleUpdateSubscription = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedClub) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget);
      const status = formData.get('status') as Subscription['status'];
      const planType = formData.get('planType') as Subscription['planType'];
      const maxPlayers = parseInt(formData.get('maxPlayers') as string);
      const maxEvaluators = parseInt(formData.get('maxEvaluators') as string);

      const success = await updateSubscription({
        status,
        planType,
        maxPlayers,
        maxEvaluators,
      });

      if (success) {
        // Recargar la suscripción desde el servidor para asegurar sincronización
        await fetchSubscription();
        setShowSubscriptionModal(false);
      } else {
        alert('Error al actualizar la suscripción');
      }
    } catch (error: any) {
      alert(error.message || 'Error al actualizar suscripción');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSubscriptionStatus = async (newStatus: Subscription['status']) => {
    if (!selectedClub || !subscription) return;

    const success = await updateSubscription({ status: newStatus });
    if (success) {
      // Recargar la suscripción desde el servidor para asegurar sincronización
      await fetchSubscription();
      alert(`Suscripción ${newStatus === 'ACTIVE' ? 'activada' : 'desactivada'} exitosamente`);
    } else {
      alert('Error al actualizar la suscripción');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Gestión de Clubes</h2>
          <p className="text-dark-text-secondary">Administra clubes y sus suscripciones</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-3 bg-success hover:bg-success/80 text-white rounded-xl font-semibold transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Club
        </button>
      </div>

      {/* Clubs List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Clubes */}
        <div className="lg:col-span-2">
          <div className="bg-dark-surface/80 backdrop-blur-xl border border-dark-border/50 rounded-3xl p-6 shadow-2xl">
            <h3 className="text-xl font-semibold text-white mb-4">Clubes</h3>
            
            {clubsLoading ? (
              <div className="text-center py-8 text-dark-text-secondary">Cargando...</div>
            ) : clubsError ? (
              <div className="text-center py-8 text-error-light">{clubsError}</div>
            ) : clubs.length === 0 ? (
              <div className="text-center py-8 text-dark-text-secondary">No hay clubes registrados</div>
            ) : (
              <div className="space-y-3">
                {clubs.map((club) => (
                  <div
                    key={club.id}
                    onClick={() => handleSelectClub(club)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      selectedClub?.id === club.id
                        ? 'bg-primary-500/20 border-primary-500/50'
                        : 'bg-dark-elevated/50 border-dark-border/50 hover:border-primary-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        {/* Logo del club */}
                        {club.logoUrl ? (
                          <img
                            src={club.logoUrl.startsWith('/') 
                              ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}${club.logoUrl}`
                              : club.logoUrl}
                            alt={`${club.name} logo`}
                            className="w-12 h-12 rounded-lg object-cover border border-dark-border/50"
                            onError={(e) => {
                              // Si falla la carga, ocultar la imagen
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-dark-elevated border border-dark-border/50 flex items-center justify-center">
                            <svg className="w-6 h-6 text-dark-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-semibold truncate">{club.name}</h4>
                          <p className="text-sm text-dark-text-secondary mt-1">
                            {club.isActive ? (
                              <span className="text-success-light">Activo</span>
                            ) : (
                              <span className="text-error-light">Inactivo</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedClub(club);
                            setShowEditModal(true);
                          }}
                          className="p-2 text-primary-400 hover:bg-primary-500/20 rounded-lg transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClub(club.id);
                          }}
                          className="p-2 text-error-light hover:bg-error/20 rounded-lg transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Detalles del Club y Suscripción */}
        <div className="space-y-6">
          {selectedClub ? (
            <>
              {/* Detalles del Club */}
              <div className="bg-dark-surface/80 backdrop-blur-xl border border-dark-border/50 rounded-3xl p-6 shadow-2xl">
                <h3 className="text-xl font-semibold text-white mb-4">Detalles del Club</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-dark-text-secondary">Nombre</p>
                    <p className="text-white font-semibold">{selectedClub.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-dark-text-secondary">Estado</p>
                    <p className={selectedClub.isActive ? 'text-success-light' : 'text-error-light'}>
                      {selectedClub.isActive ? 'Activo' : 'Inactivo'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-dark-text-secondary">Creado</p>
                    <p className="text-white">{new Date(selectedClub.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Suscripción */}
              <div className="bg-dark-surface/80 backdrop-blur-xl border border-dark-border/50 rounded-3xl p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-white">Suscripción</h3>
                  <button
                    onClick={() => setShowSubscriptionModal(true)}
                    className="text-primary-400 hover:text-primary-300 text-sm"
                  >
                    Editar
                  </button>
                </div>
                
                {subscriptionLoading ? (
                  <div className="text-center py-4 text-dark-text-secondary">Cargando...</div>
                ) : subscriptionError && !subscription ? (
                  <div className="text-center py-4 space-y-3">
                    <p className="text-error-light mb-3">
                      {subscriptionError}
                    </p>
                    <button
                      onClick={async () => {
                        await fetchSubscription();
                      }}
                      className="px-4 py-2 bg-primary-500/20 hover:bg-primary-500/30 text-primary-400 rounded-lg transition-colors text-sm font-semibold"
                    >
                      Reintentar
                    </button>
                  </div>
                ) : subscription ? (
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-dark-text-secondary">Estado</p>
                      <p className={`font-semibold ${
                        subscription.status === 'ACTIVE' ? 'text-success-light' :
                        subscription.status === 'SUSPENDED' ? 'text-warning-light' :
                        'text-error-light'
                      }`}>
                        {subscription.status}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-dark-text-secondary">Plan</p>
                      <p className="text-white font-semibold">{subscription.planType}</p>
                    </div>
                    {subscription.startDate && (
                      <div>
                        <p className="text-sm text-dark-text-secondary">Fecha de inicio</p>
                        <p className="text-white">
                          {new Date(subscription.startDate).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    )}
                    {subscription.nextPaymentDate && (
                      <div>
                        <p className="text-sm text-dark-text-secondary">Próxima renovación</p>
                        <p className="text-white font-semibold">
                          {new Date(subscription.nextPaymentDate).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    )}
                    {subscription.lastPaymentDate && (
                      <div>
                        <p className="text-sm text-dark-text-secondary">Último pago</p>
                        <p className="text-white">
                          {new Date(subscription.lastPaymentDate).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-dark-text-secondary">Máx. Jugadores</p>
                      <p className="text-white">{subscription.maxPlayers}</p>
                    </div>
                    <div>
                      <p className="text-sm text-dark-text-secondary">Máx. Evaluadores</p>
                      <p className="text-white">{subscription.maxEvaluators}</p>
                    </div>
                    <div className="pt-3 border-t border-dark-border/50 flex gap-2">
                      {subscription.status === 'ACTIVE' ? (
                        <button
                          onClick={() => toggleSubscriptionStatus('INACTIVE')}
                          className="flex-1 px-4 py-2 bg-error/20 hover:bg-error/30 text-error-light rounded-lg transition-colors text-sm font-semibold"
                        >
                          Desactivar
                        </button>
                      ) : (
                        <button
                          onClick={() => toggleSubscriptionStatus('ACTIVE')}
                          className="flex-1 px-4 py-2 bg-success/20 hover:bg-success/30 text-success-light rounded-lg transition-colors text-sm font-semibold"
                        >
                          Activar
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 space-y-3">
                    <p className="text-dark-text-secondary mb-3">
                      Este club no tiene suscripción
                    </p>
                    <button
                      onClick={async () => {
                        if (!selectedClub) return;
                        try {
                          const success = await createSubscription({
                            planType: 'STANDARD',
                            status: 'ACTIVE',
                            maxPlayers: 30,
                            maxEvaluators: 2,
                          });
                          if (success) {
                            await fetchSubscription(); // Refrescar la suscripción
                            alert('Suscripción creada exitosamente');
                          } else {
                            // El error ya está en el estado error del hook
                            const errorMessage = subscriptionError || 'Error al crear suscripción';
                            alert(errorMessage);
                          }
                        } catch (err: any) {
                          alert(err.message || 'Error al crear suscripción');
                        }
                      }}
                      disabled={isSubmitting || subscriptionLoading}
                      className="px-4 py-2 bg-success/20 hover:bg-success/30 text-success-light rounded-lg transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {subscriptionLoading ? 'Creando...' : 'Crear Suscripción'}
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-dark-surface/80 backdrop-blur-xl border border-dark-border/50 rounded-3xl p-6 shadow-2xl">
              <p className="text-dark-text-secondary text-center py-8">
                Selecciona un club para ver sus detalles
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modales */}
      {showCreateModal && (
        <ClubModal
          title="Crear Club"
          onSubmit={handleCreateClub}
          onClose={() => {
            setShowCreateModal(false);
            setLogoFile(null);
            setLogoPreview(null);
          }}
          isSubmitting={isSubmitting || isUploadingLogo}
          logoFile={logoFile}
          logoPreview={logoPreview}
          onLogoChange={(file, preview) => {
            setLogoFile(file);
            setLogoPreview(preview);
          }}
        />
      )}

      {showEditModal && selectedClub && (
        <ClubModal
          title="Editar Club"
          club={selectedClub}
          onSubmit={handleUpdateClub}
          onClose={() => {
            setShowEditModal(false);
            setLogoFile(null);
            setLogoPreview(null);
          }}
          isSubmitting={isSubmitting || isUploadingLogo}
          logoFile={logoFile}
          logoPreview={logoPreview}
          onLogoChange={(file, preview) => {
            setLogoFile(file);
            setLogoPreview(preview);
          }}
        />
      )}

      {showSubscriptionModal && selectedClub && subscription && (
        <SubscriptionModal
          subscription={subscription}
          onSubmit={handleUpdateSubscription}
          onClose={() => setShowSubscriptionModal(false)}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}

// Componente Modal para Club
function ClubModal({
  title,
  club,
  onSubmit,
  onClose,
  isSubmitting,
  logoFile,
  logoPreview,
  onLogoChange,
}: {
  title: string;
  club?: Club;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
  isSubmitting: boolean;
  logoFile?: File | null;
  logoPreview?: string | null;
  onLogoChange?: (file: File | null, preview: string | null) => void;
}) {
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de archivo
      const validTypes = [
        'image/jpeg', 
        'image/jpg', 
        'image/png', 
        'image/webp', 
        'image/gif',
        'image/heic',
        'image/heif'
      ];
      
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      const validExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'heif'];
      
      if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension || '')) {
        alert('Formato de archivo no válido. Por favor selecciona una imagen (JPEG, PNG, WEBP, GIF, HEIC)');
        e.target.value = '';
        return;
      }

      // Validar tamaño (20MB)
      if (file.size > 20 * 1024 * 1024) {
        alert('El archivo es demasiado grande. El tamaño máximo es 20MB');
        e.target.value = '';
        return;
      }

      // Limpiar preview anterior
      if (logoPreview && logoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(logoPreview);
      }
      
      const isHeic = ['heic', 'heif'].includes(fileExtension || '') || 
                     ['image/heic', 'image/heif'].includes(file.type);
      
      if (isHeic) {
        onLogoChange?.(file, 'heic-placeholder');
      } else {
        try {
          const objectUrl = URL.createObjectURL(file);
          onLogoChange?.(file, objectUrl);
        } catch (error) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const result = event.target?.result;
            if (result && typeof result === 'string') {
              onLogoChange?.(file, result);
            }
          };
          reader.readAsDataURL(file);
        }
      }
    } else {
      if (logoPreview && logoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(logoPreview);
      }
      onLogoChange?.(null, null);
    }
  };

  const displayPreview = logoPreview || club?.logoUrl || null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-dark-surface border border-dark-border/50 rounded-3xl p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-white">{title}</h3>
          <button
            onClick={onClose}
            className="text-dark-text-secondary hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-text-secondary mb-2">
              Nombre del Club
            </label>
            <input
              type="text"
              name="name"
              defaultValue={club?.name}
              required
              className="w-full px-4 py-3 bg-dark-elevated border border-dark-border/50 rounded-xl text-white focus:outline-none focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-text-secondary mb-2">
              Logo del Club
            </label>
            
            {/* Preview del logo */}
            {displayPreview && displayPreview !== 'heic-placeholder' && (
              <div className="mb-3">
                <img
                  src={displayPreview.startsWith('/') ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}${displayPreview}` : displayPreview}
                  alt="Logo preview"
                  className="w-32 h-32 object-cover rounded-xl border border-dark-border/50"
                />
              </div>
            )}
            
            {displayPreview === 'heic-placeholder' && (
              <div className="mb-3 w-32 h-32 bg-dark-elevated border border-dark-border/50 rounded-xl flex items-center justify-center">
                <span className="text-dark-text-secondary text-sm">Imagen HEIC</span>
              </div>
            )}

            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/heic,image/heif"
              onChange={handleLogoChange}
              className="w-full px-4 py-3 bg-dark-elevated border border-dark-border/50 rounded-xl text-white focus:outline-none focus:border-primary-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-500 file:text-white hover:file:bg-primary-600"
            />
            <p className="text-xs text-dark-text-tertiary mt-1">
              Formatos soportados: JPEG, PNG, WEBP, GIF, HEIC (máx. 20MB)
            </p>
          </div>

          {club && (
            <div>
              <label className="block text-sm font-medium text-dark-text-secondary mb-2">
                Estado
              </label>
              <select
                name="isActive"
                defaultValue={club.isActive ? 'true' : 'false'}
                className="w-full px-4 py-3 bg-dark-elevated border border-dark-border/50 rounded-xl text-white focus:outline-none focus:border-primary-500"
              >
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </select>
            </div>
          )}

          {!club && (
            <>
              <div>
                <label className="block text-sm font-medium text-dark-text-secondary mb-2">
                  Nombre del Admin
                </label>
                <input
                  type="text"
                  name="adminName"
                  required
                  className="w-full px-4 py-3 bg-dark-elevated border border-dark-border/50 rounded-xl text-white focus:outline-none focus:border-primary-500"
                  placeholder="Nombre completo del administrador"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-text-secondary mb-2">
                  Email del Admin
                </label>
                <input
                  type="email"
                  name="adminEmail"
                  required
                  className="w-full px-4 py-3 bg-dark-elevated border border-dark-border/50 rounded-xl text-white focus:outline-none focus:border-primary-500"
                  placeholder="admin@club.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-text-secondary mb-2">
                  Contraseña del Admin
                </label>
                <input
                  type="password"
                  name="adminPassword"
                  required
                  minLength={6}
                  className="w-full px-4 py-3 bg-dark-elevated border border-dark-border/50 rounded-xl text-white focus:outline-none focus:border-primary-500"
                  placeholder="Mínimo 6 caracteres"
                />
                <p className="text-xs text-dark-text-tertiary mt-1">
                  Si el usuario ya existe, se usará el existente. Si no, se creará con esta contraseña.
                </p>
              </div>
            </>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-dark-elevated hover:bg-dark-elevated/80 text-white rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 bg-success hover:bg-success/80 text-white rounded-xl transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Componente Modal para Suscripción
function SubscriptionModal({
  subscription,
  onSubmit,
  onClose,
  isSubmitting,
}: {
  subscription: Subscription;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
  isSubmitting: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-dark-surface border border-dark-border/50 rounded-3xl p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-white">Editar Suscripción</h3>
          <button
            onClick={onClose}
            className="text-dark-text-secondary hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-text-secondary mb-2">
              Estado
            </label>
            <select
              name="status"
              defaultValue={subscription.status}
              className="w-full px-4 py-3 bg-dark-elevated border border-dark-border/50 rounded-xl text-white focus:outline-none focus:border-primary-500"
            >
              <option value="ACTIVE">Activa</option>
              <option value="INACTIVE">Inactiva</option>
              <option value="SUSPENDED">Suspendida</option>
              <option value="CANCELLED">Cancelada</option>
              <option value="GRACE_PERIOD">Período de Gracia</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-text-secondary mb-2">
              Tipo de Plan
            </label>
            <select
              name="planType"
              defaultValue={subscription.planType}
              className="w-full px-4 py-3 bg-dark-elevated border border-dark-border/50 rounded-xl text-white focus:outline-none focus:border-primary-500"
            >
              <option value="FOUNDER">Founder</option>
              <option value="STANDARD">Standard</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-text-secondary mb-2">
              Máximo de Jugadores
            </label>
            <input
              type="number"
              name="maxPlayers"
              defaultValue={subscription.maxPlayers}
              min="1"
              required
              className="w-full px-4 py-3 bg-dark-elevated border border-dark-border/50 rounded-xl text-white focus:outline-none focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-text-secondary mb-2">
              Máximo de Evaluadores
            </label>
            <input
              type="number"
              name="maxEvaluators"
              defaultValue={subscription.maxEvaluators}
              min="1"
              required
              className="w-full px-4 py-3 bg-dark-elevated border border-dark-border/50 rounded-xl text-white focus:outline-none focus:border-primary-500"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-dark-elevated hover:bg-dark-elevated/80 text-white rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 bg-success hover:bg-success/80 text-white rounded-xl transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

