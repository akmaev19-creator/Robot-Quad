interface ShowPromiseResult {
    done: boolean;
    description: string;
    state: 'load' | 'render' | 'playing' | 'destroy';
    error: boolean;
}

interface Window {
    Adsgram?: {
        init: (config: { blockId: string; debug?: boolean; }) => {
            show: () => Promise<ShowPromiseResult>;
        };
    };
    Telegram?: {
        WebApp?: {
            version: string;
            isVersionAtLeast: (version: string) => boolean;
            CloudStorage?: {
                getItem: (key: string, callback: (err: any, value: string) => void) => void;
                setItem: (key: string, value: string, callback?: (err: any, stored: boolean) => void) => void;
            };
            ready: () => void;
            expand: () => void;
        }
    }
}

declare module '*.svg' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.jpeg' {
  const content: string;
  export default content;
}

declare module '*.gif' {
  const content: string;
  export default content;
}

declare module '*.webp' {
  const content: string;
  export default content;
}