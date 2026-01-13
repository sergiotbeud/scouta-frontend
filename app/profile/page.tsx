'use client';

import { useState } from 'react';
import { useAuthStore } from '../../store/auth-store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { AppHeader } from '../../components/AppHeader';
import { ChangePasswordModal } from '../../components/auth/ChangePasswordModal';
import { getImageUrl } from '../../utils/imageUtils';
import { AxiosApiClient } from '../../adapters/api/AxiosApiClient';
import { UserRole } from '../../domain/entities/User';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const setAuth = useAuthStore((state) => state.setAuth);
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const token = useAuthStore((state) => state.token);
  const apiClient = new AxiosApiClient(API_URL);
  const isPlayer = user?.role === UserRole.PLAYER;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.push('/login');
    }
  }, [mounted, isAuthenticated, router]);

  useEffect(() => {
    if (token) {
      apiClient.setToken(token);
    }
  }, [token]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadPhoto = async () => {
    if (!photoFile || !token) return;
    
    setIsUploadingPhoto(true);
    try {
      apiClient.setToken(token);
      const response = await apiClient.uploadUserPhoto(photoFile);
      if (response.success && response.data) {
        const updatedUser = { ...user!, photoUrl: response.data.photoUrl };
        setAuth(updatedUser, token);
        setPhotoFile(null);
        setPhotoPreview(null);
        alert('Foto actualizada correctamente');
      } else {
        alert('Error al subir la foto');
      }
    } catch (error) {
      console.error('Error al subir la foto:', error);
      alert('Error al subir la foto');
    } finally {
      setIsUploadingPhoto(false);
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
      <AppHeader title="Scouta" subtitle="Mi Perfil" showBackButton={true} backUrl="/dashboard" backLabel="Volver al Dashboard" />

      <main className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="bg-dark-surface/80 backdrop-blur-xl border border-dark-border/50 rounded-3xl p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-white">
              Información del Perfil
            </h2>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-6 pb-6 border-b border-dark-border/30">
              <div className="relative">
                {photoPreview || user.photoUrl ? (
                  <img
                    src={photoPreview || getImageUrl(user.photoUrl) || ''}
                    alt={user.name}
                    className="w-24 h-24 rounded-2xl object-cover border-2 border-dark-border"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-2xl bg-primary-500/20 flex items-center justify-center border-2 border-dark-border">
                    <svg className="w-12 h-12 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
                {!isPlayer && (
                  <label className="absolute bottom-0 right-0 bg-success p-2 rounded-full cursor-pointer hover:bg-success/80 transition-colors shadow-lg">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </label>
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-white mb-1">{user.name}</h3>
                <p className="text-dark-text-secondary">{user.email}</p>
                <span className="inline-block mt-2 px-3 py-1 rounded-lg bg-primary-500/20 text-primary-400 text-sm font-medium">
                  {user.role}
                </span>
                {photoFile && (
                  <div className="mt-3">
                    <button
                      onClick={handleUploadPhoto}
                      disabled={isUploadingPhoto}
                      className="px-4 py-2 bg-success text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity text-sm font-medium"
                    >
                      {isUploadingPhoto ? 'Subiendo...' : 'Guardar foto'}
                    </button>
                    <button
                      onClick={() => {
                        setPhotoFile(null);
                        setPhotoPreview(null);
                      }}
                      className="ml-2 px-4 py-2 bg-dark-elevated text-white rounded-lg hover:bg-dark-hover transition-colors text-sm font-medium"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-4 px-4 rounded-xl hover:bg-dark-elevated/50 transition-colors duration-200 border-b border-dark-border/30 last:border-0">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-dark-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="text-dark-text-secondary font-medium">Nombre</span>
                </div>
                <span className="text-white font-medium">{user.name}</span>
              </div>

              <div className="flex items-center justify-between py-4 px-4 rounded-xl hover:bg-dark-elevated/50 transition-colors duration-200 border-b border-dark-border/30 last:border-0">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-dark-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-dark-text-secondary font-medium">Correo electrónico</span>
                </div>
                <span className="text-white font-medium">{user.email}</span>
              </div>

              <div className="flex items-center justify-between py-4 px-4 rounded-xl hover:bg-dark-elevated/50 transition-colors duration-200 border-b border-dark-border/30 last:border-0">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-dark-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span className="text-dark-text-secondary font-medium">Rol</span>
                </div>
                <span className="text-white font-medium">{user.role}</span>
              </div>
            </div>

            <div className="pt-6 border-t border-dark-border/30">
              <button
                onClick={() => setShowChangePasswordModal(true)}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-success hover:opacity-95 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-success/30 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                Cambiar contraseña
              </button>
            </div>
          </div>
        </div>
      </main>

      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        requiresCurrentPassword={true}
        isRequired={false}
        onSuccess={() => setShowChangePasswordModal(false)}
        onClose={() => setShowChangePasswordModal(false)}
      />
    </div>
  );
}

