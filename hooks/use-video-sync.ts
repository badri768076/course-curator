import { useCallback, useRef } from 'react';
import { useLearningStore } from '@/store/use-learning-store';

export function useVideoSync(courseId: string, topicSlug: string) {
  const updateVideoTime = useLearningStore((state) => state.updateVideoTime);
  const lastSavedTime = useRef<number>(0);
  const throttleTimeout = useRef<NodeJS.Timeout | null>(null);

  const syncTime = useCallback((time: number) => {
    // Avoid redundant saves if time hasn't changed much
    if (Math.abs(time - lastSavedTime.current) < 2) return;

    if (throttleTimeout.current) {
      clearTimeout(throttleTimeout.current);
    }

    throttleTimeout.current = setTimeout(() => {
      updateVideoTime(courseId, topicSlug, time);
      lastSavedTime.current = time;
    }, 1000);
  }, [courseId, topicSlug, updateVideoTime]);

  return syncTime;
}
