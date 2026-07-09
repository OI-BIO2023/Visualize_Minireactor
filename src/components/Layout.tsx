import { useEffect, type ReactNode } from 'react';

export function Layout({ children }: { children: ReactNode }) {
  useEffect(() => {
    document.body.classList.add('app-loaded');
    return () => document.body.classList.remove('app-loaded');
  }, []);

  return <div className="app-shell">{children}</div>;
}
