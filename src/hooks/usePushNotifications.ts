import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PushNotificationHook {
  isSupported: boolean;
  permission: NotificationPermission;
  isSubscribed: boolean;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<void>;
  sendNotification: (userId: string, title: string, body: string) => Promise<void>;
}

export function usePushNotifications(): PushNotificationHook {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    // Verificar se o navegador suporta notificações push
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
      checkExistingSubscription();
    }
  }, []);

  const checkExistingSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error('Erro ao verificar inscrição:', error);
    }
  };

  const subscribe = async (): Promise<boolean> => {
    if (!isSupported) {
      toast.error('Notificações não suportadas neste navegador');
      return false;
    }

    try {
      // Solicitar permissão
      const permission = await Notification.requestPermission();
      setPermission(permission);

      if (permission !== 'granted') {
        toast.error('Permissão para notificações negada');
        return false;
      }

      // Registrar service worker se não estiver registrado
      let registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        registration = await navigator.serviceWorker.register('/sw.js');
      }

      // Aguardar o service worker estar ativo
      await navigator.serviceWorker.ready;

      // Criar inscrição push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlB64ToUint8Array(
          'BEl62iUYgUivxIkv69yViEuiBIa40HI8YlOu_vgSrj9DJ4zYC6l6BTZdmXhGpCFgrj2vnHD0UZWdcxtmL2F0l' // VAPID key pública
        )
      });

      // Salvar inscrição no banco de dados
      const sessionToken = localStorage.getItem('session_token');
      if (!sessionToken) {
        return false;
      }

      // Buscar dados do usuário atual
      const { data: userData } = await supabase.rpc('validate_session', { 
        p_session_token: sessionToken 
      });

      if (!userData || userData.length === 0) {
        return false;
      }

      const userId = (userData[0].user_data as any).id;

      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: userId,
          endpoint: subscription.endpoint,
          p256dh: arrayBufferToBase64(subscription.getKey('p256dh')!),
          auth: arrayBufferToBase64(subscription.getKey('auth')!)
        });

      if (error) {
        console.error('Erro ao salvar inscrição:', error);
        return false;
      }

      setIsSubscribed(true);
      toast.success('Notificações ativadas! 🔔');
      return true;
    } catch (error) {
      console.error('Erro ao inscrever-se para notificações:', error);
      toast.error('Erro ao ativar notificações');
      return false;
    }
  };

  const unsubscribe = async (): Promise<void> => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        
        // Remover do banco de dados
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('endpoint', subscription.endpoint);
      }

      setIsSubscribed(false);
      toast.success('Notificações desativadas');
    } catch (error) {
      console.error('Erro ao cancelar inscrição:', error);
      toast.error('Erro ao desativar notificações');
    }
  };

  const sendNotification = async (userId: string, title: string, body: string): Promise<void> => {
    try {
      // Esta função seria implementada via Edge Function para enviar notificações
      await supabase.functions.invoke('send-push-notification', {
        body: { userId, title, body }
      });
    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
    }
  };

  return {
    isSupported,
    permission,
    isSubscribed,
    subscribe,
    unsubscribe,
    sendNotification
  };
}

// Funções auxiliares
function urlB64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}