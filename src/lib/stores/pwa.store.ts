import { create } from 'zustand';

// BeforeInstallPromptEvent is not a standard type in TypeScript DOM libs yet.
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAState {
  installPromptEvent: BeforeInstallPromptEvent | null;
  isInstallable: boolean;
  showInstallBanner: boolean;
  setInstallPromptEvent: (event: BeforeInstallPromptEvent | null) => void;
  triggerInstallPrompt: () => void;
  dismissInstallPrompt: () => void;
}

const PWA_DISMISSED_KEY = 'anonymous_assessment_pwa_dismissed_v1';

export const usePWAStore = create<PWAState>((set, get) => ({
  installPromptEvent: null,
  isInstallable: false,
  showInstallBanner: false,

  setInstallPromptEvent: (event) => {
    // Don't show if already running in standalone or if user has dismissed.
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const dismissed = localStorage.getItem(PWA_DISMISSED_KEY) === 'true';

    if (isStandalone || dismissed) {
      set({ installPromptEvent: null, isInstallable: false, showInstallBanner: false });
      return;
    }

    set({ installPromptEvent: event, isInstallable: !!event });
    // Automatically show the banner after a delay if the event is set.
    if (event) {
      setTimeout(() => {
        set({ showInstallBanner: true });
      }, 5000); // Show after 5 seconds of engagement
    }
  },

  triggerInstallPrompt: async () => {
    const { installPromptEvent } = get();
    if (!installPromptEvent) return;

    installPromptEvent.prompt();
    const { outcome } = await installPromptEvent.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the PWA installation prompt');
      localStorage.setItem(PWA_DISMISSED_KEY, 'true'); // Also mark as dismissed so it doesn't reappear
    } else {
      console.log('User dismissed the PWA installation prompt');
      localStorage.setItem(PWA_DISMISSED_KEY, 'true');
    }
    // The prompt can only be used once.
    set({ installPromptEvent: null, isInstallable: false, showInstallBanner: false });
  },

  dismissInstallPrompt: () => {
    localStorage.setItem(PWA_DISMISSED_KEY, 'true');
    set({ showInstallBanner: false });
  },
}));