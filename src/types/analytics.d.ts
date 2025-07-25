// Google Analytics Types
export interface GAEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
}

export interface GAConfig {
  measurementId: string;
  enabled: boolean;
}

export interface GAPageView {
  page_title: string;
  page_location: string;
}

export interface GACustomEvent {
  event_name: string;
  event_parameters?: Record<string, string | number | boolean>;
}

declare global {
  interface Window {
    gtag: (
      command: "config" | "event" | "js",
      targetId: string | Date,
      config?: Record<string, any>,
    ) => void;
    dataLayer: Record<string, any>[];
  }
}
