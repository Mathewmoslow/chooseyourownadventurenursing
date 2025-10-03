import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { postSimulation } from '../services/simApi';
import type { ActionLogEntry, SimulationPayload, SimulationSnapshot } from '../types/simulation';

export const useSimulation = () => {
  const [token, setToken] = useState<string>();
  const [snapshot, setSnapshot] = useState<SimulationSnapshot | null>(null);
  const [lastLog, setLastLog] = useState<ActionLogEntry | null>(null);

  const initialQuery = useQuery<SimulationPayload, Error>({
    queryKey: ['simulation', 'initial'],
    queryFn: () => postSimulation({}),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (initialQuery.data) {
      setToken(initialQuery.data.token);
      setSnapshot(initialQuery.data.state);
      setLastLog(initialQuery.data.logEntry);
    }
  }, [initialQuery.data]);

  const actionMutation = useMutation<SimulationPayload, Error, string>({
    mutationFn: async (action: string) => {
      if (!token) {
        throw new Error('Simulation session not ready yet.');
      }
      return postSimulation({ action, token });
    },
    onSuccess: (data) => {
      setToken(data.token);
      setSnapshot(data.state);
      setLastLog(data.logEntry);
    },
  });

  const status = useMemo(
    () => ({
      isInitialLoading: initialQuery.isLoading,
      isReady: Boolean(snapshot),
      isMutating: actionMutation.isPending,
      error: initialQuery.error || actionMutation.error,
      lastLog,
    }),
    [actionMutation.error, actionMutation.isPending, initialQuery.error, initialQuery.isLoading, lastLog, snapshot],
  );

  const sendAction = (action: string) => {
    actionMutation.mutate(action);
  };

  const resetSimulation = () => {
    setToken(undefined);
    setSnapshot(null);
    setLastLog(null);
    initialQuery.refetch();
  };

  return {
    state: snapshot,
    status,
    sendAction,
    resetSimulation,
  };
};
