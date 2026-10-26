/**
 * Intelligent Route Preloading
 * Downloads page chunks ahead of user navigation (on hover, touch or during idle time)
 * ensuring instant (0ms) page transitions.
 */

const preloadedRoutes = new Set<string>();

export const preloadRoute = (path: string): void => {
  // Normalize path
  const normalizedPath = path.split('?')[0].split('#')[0];
  if (preloadedRoutes.has(normalizedPath)) return;
  preloadedRoutes.add(normalizedPath);

  switch (normalizedPath) {
    case '/':
      import('../pages/Feed');
      break;
    case '/explore':
      import('../pages/Explore');
      break;
    case '/watch':
      import('../pages/WatchParty');
      break;
    case '/encontros':
      import('../pages/Encontros');
      break;
    case '/jogar-agora':
      import('../pages/PlayNow');
      break;
    case '/profile':
      import('../pages/Profile');
      break;
    case '/chat':
      import('../pages/ChatList');
      break;
    case '/communities':
      import('../pages/Communities');
      break;
    case '/arcade':
      import('../pages/Arcade');
      break;
    case '/reels':
      import('../pages/Reels');
      break;
    case '/rankings':
      import('../pages/Rankings');
      break;
    default:
      break;
  }
};

/**
 * Preload high-traffic routes during browser idle time
 */
export const preloadCriticalRoutes = (): void => {
  if (typeof window === 'undefined') return;

  const runPreload = () => {
    preloadRoute('/');
    preloadRoute('/explore');
    preloadRoute('/profile');
  };

  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(runPreload, { timeout: 2000 });
  } else {
    setTimeout(runPreload, 1500);
  }
};
