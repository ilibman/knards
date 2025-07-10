import { useCallback, useRef } from "react";

export function useIntersection(onIntersect: () => void) {
  const unsubscribe = useRef(() => {});

  return useCallback((element: HTMLDivElement | null) => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((_) => {
        if (_.isIntersecting) {
          onIntersect();
        }
      })
    });

    if (element) {
      observer.observe(element);
      unsubscribe.current = () => observer.disconnect();
    } else {
      unsubscribe.current();
    }
  }, []);
}