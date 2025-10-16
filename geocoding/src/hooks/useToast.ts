import { toast } from 'sonner';

interface ToastOptions {
  title?: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

class ToastManager {
  private static instance: ToastManager;
  private defaultDuration = 4000;

  private constructor() {}

  public static getInstance(): ToastManager {
    if (!ToastManager.instance) {
      ToastManager.instance = new ToastManager();
    }
    return ToastManager.instance;
  }

  public success(message: string, options?: ToastOptions) {
    toast.success(options?.title || 'Success', {
      description: options?.description || message,
      duration: options?.duration || this.defaultDuration,
      action: options?.action,
    });
  }

  public error(message: string, options?: ToastOptions) {
    toast.error(options?.title || 'Error', {
      description: options?.description || message,
      duration: options?.duration || this.defaultDuration,
      action: options?.action,
    });
  }

  public warning(message: string, options?: ToastOptions) {
    toast.warning(options?.title || 'Warning', {
      description: options?.description || message,
      duration: options?.duration || this.defaultDuration,
      action: options?.action,
    });
  }

  public info(message: string, options?: ToastOptions) {
    toast.info(options?.title || 'Info', {
      description: options?.description || message,
      duration: options?.duration || this.defaultDuration,
      action: options?.action,
    });
  }

  public loading(message: string, id?: string) {
    return toast.loading(message, { id });
  }

  public dismiss(id?: string) {
    toast.dismiss(id);
  }

  public promise<T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    }
  ) {
    return toast.promise(promise, messages);
  }
}

export const toastManager = ToastManager.getInstance();

// Hook for React components
export const useToast = () => {
  return {
    success: toastManager.success.bind(toastManager),
    error: toastManager.error.bind(toastManager),
    warning: toastManager.warning.bind(toastManager),
    info: toastManager.info.bind(toastManager),
    loading: toastManager.loading.bind(toastManager),
    dismiss: toastManager.dismiss.bind(toastManager),
    promise: toastManager.promise.bind(toastManager),
  };
};

