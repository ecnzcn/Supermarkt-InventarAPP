import { useEffect, useState } from 'react';
import { getPersistenceStatus, type PersistenceStatus } from '@/services/dataSafetyService';

export function usePersistenceStatus(): PersistenceStatus | undefined {
  const [status, setStatus] = useState<PersistenceStatus>();
  useEffect(() => {
    let active = true;
    getPersistenceStatus().then((s) => active && setStatus(s));
    return () => {
      active = false;
    };
  }, []);
  return status;
}
