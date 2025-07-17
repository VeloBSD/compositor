import { serve } from "bun";
import index from "./shell/display/index.html";
import desktop from "./shell/desktop/index.html";

const server = serve({
  routes: {
    // Serve index.html for all unmatched routes.
    "/": index,
    "/desktop": desktop,

    "/api/hello": {
      async GET(req) {
        return Response.json({
          message: "Hello, world!",
          method: "GET",
        });
      },
      async PUT(req: Request) {
        return Response.json({
          message: "Hello, world!",
          method: "PUT",
        });
      },
    },

    "/api/hello/:name": async req => {
      const name = req.params.name;
      return Response.json({
        message: `Hello, ${name}!`,
      });
    },

    // WebSocket endpoint for real-time communication
    "/ws": {
      async GET(req) {
        // Proxy WebSocket connections to the C API server
        const url = new URL(req.url);
        const wsUrl = `ws://localhost:3001${url.pathname}${url.search}`;
        
        return new Response("WebSocket endpoint - use WebSocket client", {
          status: 426,
          headers: {
            "Upgrade": "websocket",
            "Connection": "Upgrade",
            "Sec-WebSocket-Accept": "",
          },
        });
      },
    },

    // Health check endpoint
    "/api/health": {
      async GET(req) {
        try {
          // Check if the C API server is running
          const response = await fetch('http://localhost:3001/health', {
            method: 'GET',
            signal: AbortSignal.timeout(5000),
          });
          
          return Response.json({
            status: "healthy",
            vldwmapi: response.ok ? "connected" : "disconnected",
            timestamp: new Date().toISOString(),
          });
        } catch (error) {
          return Response.json({
            status: "degraded",
            vldwmapi: "disconnected",
            error: error instanceof Error ? error.message : "Unknown error",
            timestamp: new Date().toISOString(),
          }, { status: 503 });
        }
      },
    },
  },

  development: process.env.NODE_ENV !== "production" && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },

  // WebSocket support
  websocket: {
    message(ws, message) {
      // Forward messages to the C API WebSocket server
      console.log('📨 WebSocket message received:', message);
    },
    open(ws) {
      console.log('🔗 WebSocket connection opened');
    },
    close(ws, code, message) {
      console.log('🔌 WebSocket connection closed:', code, message);
    },
  },
});

console.log(`🚀 Server running at ${server.url}`);
console.log(`🌐 WebSocket endpoint: ws://localhost:3001`);
