import { LoginForm } from '../../components/auth/LoginForm';
import { ScoutaLogo } from '../../components/ScoutaLogo';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo y Branding */}
        <div className="flex items-center justify-center gap-3 mb-12">
          <div className="w-14 h-14 rounded-2xl bg-success/20 flex items-center justify-center">
            <ScoutaLogo size="md" className="text-success" showGrid={true} />
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight">
            Scouta
          </h1>
        </div>

        {/* Título de Bienvenida */}
        <div className="text-center mb-10">
          <h2 className="text-4xl font-bold text-white mb-2">
            Bienvenido de vuelta
          </h2>
          <p className="text-dark-text-secondary text-base">
            Ingresa tus credenciales para continuar
          </p>
        </div>

        {/* Formulario */}
        <div className="space-y-6">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}

