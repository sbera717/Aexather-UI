'use client';

import { useEffect } from 'react';
import { usePlatformStore } from '@/store/platformStore';

/**
 * Loads the platform's data once, on mount.
 *
 * Renders nothing. It connects to the backend when one is reachable and otherwise runs against the
 * bundled fixtures through the demo runtime — which reproduces the real thing rather than faking
 * it: investigations stream their decision graph, the suite replays case by case, and the promotion
 * gates still refuse a candidate they have no evidence for.
 *
 * There is deliberately no badge. Which of the two is answering is an operational detail, and a
 * marker for it sits on top of every screen for the sake of a distinction nobody watching is being
 * asked to make.
 */
export default function DataSourceGate() {
  const hydrate = usePlatformStore((state) => state.hydrate);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  return null;
}
