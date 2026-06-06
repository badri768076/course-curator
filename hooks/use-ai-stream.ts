import { useState, useCallback } from 'react';

interface AIStreamState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useAIStream<T, Args extends any[]>() {
  const [state, setState] = useState<AIStreamState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(async (action: (...args: Args) => Promise<T>, ...args: Args) => {
    setState({ data: null, loading: true, error: null });
    try {
      const result = await action(...args);
      setState({ data: result, loading: false, error: null });
      return result;
    } catch (err: any) {
      const errMsg = err?.message || 'Something went wrong during AI generation';
      setState({ data: null, loading: false, error: errMsg });
      throw err;
    }
  }, []);

  return {
    ...state,
    execute,
  };
}
