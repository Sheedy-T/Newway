const listAllRoutes = (app) => {
    try {
      if (!app || !app._router || !Array.isArray(app._router.stack)) {
        console.warn('Router stack not found. Are routes mounted correctly?');
        return;
      }
  
      app._router.stack.forEach((middleware) => {
        if (middleware.route) {
          const methods = Object.keys(middleware.route.methods || {})
            .map((m) => m.toUpperCase())
            .join(', ');
          console.log(`Mounted Path: ${middleware.route.path} - Methods: ${methods}`);
        } else if (middleware.name === 'router' && middleware.handle?.stack) {
          middleware.handle.stack.forEach((handler) => {
            const route = handler.route;
            if (route) {
              const methods = Object.keys(route.methods || {})
                .map((m) => m.toUpperCase())
                .join(', ');
              console.log(`Mounted Path: ${route.path} - Methods: ${methods}`);
            }
          });
        }
      });
    } catch (err) {
      console.error('Error listing routes:', err?.stack || err || 'Unknown error');
    }
  };
  
  module.exports = listAllRoutes;
  