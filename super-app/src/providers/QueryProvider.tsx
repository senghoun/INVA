import React, { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { authService } from '../services/auth.service';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: {
    staleTime: 30_000,
    retry: (attempt, error) => attempt < 1 && ![401, 403, 429].includes((error as Error & { status?: number }).status || 0),
    refetchOnWindowFocus: false,
  }, mutations: { retry: false } } }));
  useEffect(() => {
    let accountId = authService.getCurrentUser()?.id;
    const clear = () => { void client.cancelQueries(); client.clear(); };
    window.addEventListener('inva:session-cleared', clear);
    window.addEventListener('inva:company-changed', clear);
    const unsubscribe = authService.subscribe(user => {
      if (user?.id !== accountId) { accountId = user?.id; clear(); }
    });
    return () => { unsubscribe(); window.removeEventListener('inva:session-cleared', clear); window.removeEventListener('inva:company-changed', clear); };
  }, [client]);
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
