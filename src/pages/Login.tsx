import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { FlaskConical } from 'lucide-react';
import { toast } from 'sonner';
import { Turnstile } from '@marsidev/react-turnstile';

export default function Login() {
  const { login, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!turnstileToken) {
      toast.error('Por favor, completa el CAPTCHA.');
      return;
    }

    try {
      setIsLoading(true);
      // Pasamos el token del CAPTCHA a nuestro AuthContext
      await login(email, password, turnstileToken);
      toast.success('Sesión iniciada correctamente');
    } catch (error: any) {
      console.error('Error logging in:', error);
      toast.error('Error al iniciar sesión: Usuario o contraseña incorrectos.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto bg-blue-100 p-3 rounded-full w-fit">
            <FlaskConical className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">ChemStock FP</CardTitle>
          <CardDescription>
            Introduce tus credenciales para acceder al inventario
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="ejemplo@chemstock.edu" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input 
                id="password" 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            
            <div className="flex justify-center pt-2">
              {window.location.hostname === 'localhost' ? (
                <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded w-full text-center border border-amber-200">
                  ⚠️ CAPTCHA desactivado en localhost.
                  {/* Auto-set token for local dev immediately */}
                  {setTimeout(() => { if (!turnstileToken) setTurnstileToken('local-bypass-token') }, 100)}
                </div>
              ) : (
                <Turnstile
                  siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
                  onSuccess={(token) => setTurnstileToken(token)}
                  onExpire={() => setTurnstileToken(null)}
                  onError={() => setTurnstileToken(null)}
                />
              )}
            </div>

            <Button 
              type="submit"
              className="w-full" 
              size="lg" 
              disabled={isLoading || (!turnstileToken && window.location.hostname !== 'localhost')}
            >
              {isLoading ? 'Iniciando sesión...' : 'Entrar'}
            </Button>
          </form>
          
        </CardContent>
      </Card>
    </div>
  );
}
