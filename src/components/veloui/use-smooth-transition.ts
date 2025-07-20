import { useState, useEffect, useRef, useCallback } from 'react';

interface TransitionConfig {
  duration: number;
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'cubic-bezier';
  cubicBezier?: [number, number, number, number];
}

interface TransitionState {
  opacity: number;
  blur: number;
  brightness: number;
  contrast: number;
  saturation: number;
  transform: {
    x: number;
    y: number;
    scaleX: number;
    scaleY: number;
    rotation: number;
  };
  tint: { r: number; g: number; b: number; a: number };
}

type EasingFunction = (t: number) => number;

const easingFunctions: Record<string, EasingFunction> = {
  linear: (t: number) => t,
  'ease-in': (t: number) => t * t,
  'ease-out': (t: number) => 1 - (1 - t) * (1 - t),
  'ease-in-out': (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
};

function createCubicBezierEasing(p1: number, p2: number, p3: number, p4: number): EasingFunction {
  return (t: number) => {
    // Simplified cubic bezier implementation
    const cx = 3 * p1;
    const bx = 3 * (p3 - p1) - cx;
    const ax = 1 - cx - bx;
    
    const cy = 3 * p2;
    const by = 3 * (p4 - p2) - cy;
    const ay = 1 - cy - by;
    
    const sampleCurveX = (t: number) => ((ax * t + bx) * t + cx) * t;
    const sampleCurveY = (t: number) => ((ay * t + by) * t + cy) * t;
    
    // Binary search to find t for given x
    let t2 = t;
    for (let i = 0; i < 8; i++) {
      const x2 = sampleCurveX(t2) - t;
      if (Math.abs(x2) < 0.000001) break;
      const d2 = (3 * ax * t2 + 2 * bx) * t2 + cx;
      if (Math.abs(d2) < 0.000001) break;
      t2 = t2 - x2 / d2;
    }
    
    return sampleCurveY(t2);
  };
}

function interpolate(start: number, end: number, progress: number): number {
  return start + (end - start) * progress;
}

function interpolateTransform(
  start: TransitionState['transform'],
  end: TransitionState['transform'],
  progress: number
): TransitionState['transform'] {
  return {
    x: interpolate(start.x, end.x, progress),
    y: interpolate(start.y, end.y, progress),
    scaleX: interpolate(start.scaleX, end.scaleX, progress),
    scaleY: interpolate(start.scaleY, end.scaleY, progress),
    rotation: interpolate(start.rotation, end.rotation, progress),
  };
}

function interpolateTint(
  start: TransitionState['tint'],
  end: TransitionState['tint'],
  progress: number
): TransitionState['tint'] {
  return {
    r: interpolate(start.r, end.r, progress),
    g: interpolate(start.g, end.g, progress),
    b: interpolate(start.b, end.b, progress),
    a: interpolate(start.a, end.a, progress),
  };
}

export function useSmoothTransition(
  targetState: Partial<TransitionState>,
  config: TransitionConfig = { duration: 300, easing: 'ease-out' }
) {
  const [currentState, setCurrentState] = useState<TransitionState>({
    opacity: 1,
    blur: 0,
    brightness: 0,
    contrast: 1,
    saturation: 1,
    transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 },
    tint: { r: 0, g: 0, b: 0, a: 0 },
    ...targetState,
  });
  
  const [isTransitioning, setIsTransitioning] = useState(false);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const startStateRef = useRef<TransitionState>(currentState);
  const targetStateRef = useRef<TransitionState>(currentState);

  const getEasingFunction = useCallback((config: TransitionConfig): EasingFunction => {
    if (config.easing === 'cubic-bezier' && config.cubicBezier) {
      return createCubicBezierEasing(...config.cubicBezier);
    }
    return easingFunctions[config.easing] || easingFunctions.linear;
  }, []);

  const animate = useCallback((timestamp: number) => {
    const elapsed = timestamp - startTimeRef.current;
    const progress = Math.min(elapsed / config.duration, 1);
    
    const easingFunction = getEasingFunction(config);
    const easedProgress = easingFunction(progress);
    
    const newState: TransitionState = {
      opacity: interpolate(startStateRef.current.opacity, targetStateRef.current.opacity, easedProgress),
      blur: interpolate(startStateRef.current.blur, targetStateRef.current.blur, easedProgress),
      brightness: interpolate(startStateRef.current.brightness, targetStateRef.current.brightness, easedProgress),
      contrast: interpolate(startStateRef.current.contrast, targetStateRef.current.contrast, easedProgress),
      saturation: interpolate(startStateRef.current.saturation, targetStateRef.current.saturation, easedProgress),
      transform: interpolateTransform(startStateRef.current.transform, targetStateRef.current.transform, easedProgress),
      tint: interpolateTint(startStateRef.current.tint, targetStateRef.current.tint, easedProgress),
    };
    
    setCurrentState(newState);
    
    if (progress < 1) {
      animationRef.current = requestAnimationFrame(animate);
    } else {
      setIsTransitioning(false);
      animationRef.current = null;
    }
  }, [config, getEasingFunction]);

  const startTransition = useCallback((newTargetState: Partial<TransitionState>) => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    startStateRef.current = { ...currentState };
    targetStateRef.current = {
      ...currentState,
      ...newTargetState,
    };
    
    startTimeRef.current = performance.now();
    setIsTransitioning(true);
    animationRef.current = requestAnimationFrame(animate);
  }, [currentState, animate]);

  useEffect(() => {
    startTransition(targetState);
  }, [targetState]);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return {
    currentState,
    isTransitioning,
    startTransition,
  };
}

// Predefined transition presets
export const transitionPresets = {
  fadeIn: {
    from: { opacity: 0 },
    to: { opacity: 1 },
    config: { duration: 300, easing: 'ease-out' as const },
  },
  fadeOut: {
    from: { opacity: 1 },
    to: { opacity: 0 },
    config: { duration: 300, easing: 'ease-in' as const },
  },
  slideInFromLeft: {
    from: { transform: { x: -100, y: 0, scaleX: 1, scaleY: 1, rotation: 0 }, opacity: 0 },
    to: { transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 }, opacity: 1 },
    config: { duration: 400, easing: 'ease-out' as const },
  },
  slideInFromRight: {
    from: { transform: { x: 100, y: 0, scaleX: 1, scaleY: 1, rotation: 0 }, opacity: 0 },
    to: { transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 }, opacity: 1 },
    config: { duration: 400, easing: 'ease-out' as const },
  },
  scaleIn: {
    from: { transform: { x: 0, y: 0, scaleX: 0.8, scaleY: 0.8, rotation: 0 }, opacity: 0 },
    to: { transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 }, opacity: 1 },
    config: { duration: 300, easing: 'ease-out' as const },
  },
  blur: {
    from: { blur: 0 },
    to: { blur: 5 },
    config: { duration: 200, easing: 'ease-in-out' as const },
  },
};