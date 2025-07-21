import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import path from "path";
import fs from "fs";

// Add process error handlers to catch uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  // Don't exit in development to maintain storage data
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit in development to maintain storage data
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

console.log('🚀 Starting PharmaCost Pro server...');
console.log('Environment:', process.env.NODE_ENV);
console.log('Port:', process.env.PORT || '5000');

const app = express();
console.log('✓ Express app created');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
console.log('✓ Express middleware configured');

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    console.log("Starting server initialization...");
    const server = await registerRoutes(app);
    console.log("Routes registered successfully");

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    console.log("Setting up static file serving...");
    
    // Railway production static file serving
    const staticPath = path.join(process.cwd(), 'dist', 'public');
    console.log('Static files directory:', staticPath);
    
    if (fs.existsSync(staticPath)) {
      app.use(express.static(staticPath));
      // Handle client-side routing
      app.get("*", (req, res) => {
        if (req.path.startsWith('/api')) {
          return res.status(404).json({ message: 'API endpoint not found' });
        }
        res.sendFile(path.join(staticPath, 'index.html'));
      });
      console.log("✅ Static files configured for Railway deployment");
    } else {
      console.error("❌ Static files directory not found:", staticPath);
      // Fallback - let serveStatic handle it
      serveStatic(app);
    }
  }

  // Use Railway's PORT environment variable - critical for Railway deployment
  const port = parseInt(process.env.PORT || "5000");
  console.log(`Railway PORT environment variable:`, process.env.PORT);
  console.log(`Attempting to start server on port ${port}...`);
  
  // Railway-specific server configuration
  const serverOptions = {
    port,
    host: "0.0.0.0", // Critical for Railway - must bind to all interfaces
  };

  server.listen(serverOptions, () => {
    console.log(`🚀 PharmaCost Pro successfully deployed on Railway`);
    console.log(`🌐 Server running on ${serverOptions.host}:${port}`);
    console.log(`🔗 Health check available at /api/dashboard/stats`);
    console.log(`💊 Kinray pharmaceutical portal automation ready`);
    log(`serving on port ${port}`);
  });

  // Add explicit error handling for server startup
  server.on('error', (err) => {
    console.error('❌ Server startup error:', err);
    if (err.code === 'EADDRINUSE') {
      console.error(`   Port ${port} already in use`);
    } else if (err.code === 'EACCES') {
      console.error(`   Permission denied to bind port ${port}`);
    }
    process.exit(1);
  });

  // Handle Railway shutdown gracefully
  process.on('SIGTERM', () => {
    console.log('📋 Railway SIGTERM received - shutting down gracefully...');
    server.close(() => {
      console.log('✅ Server closed successfully');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('📋 SIGINT received - shutting down gracefully...');
    server.close(() => {
      console.log('✅ Server closed successfully');
      process.exit(0);
    });
  });
  
  } catch (error) {
    console.error("❌ Server startup failed:", error);
    process.exit(1);
  }
})();
