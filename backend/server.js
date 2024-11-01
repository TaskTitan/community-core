import cors from 'cors';
import express from 'express';
import bodyParser from 'body-parser';
import UserRoutes from './src/routes/UserRoutes.js';
import StreamRoutes from './src/routes/StreamRoutes.js';
import WorkflowRoutes from './src/routes/WorkflowRoutes.js';
import CustomToolRoutes from './src/routes/CustomToolRoutes.js';
import ContentOutputRoutes from './src/routes/ContentOutputRoutes.js';
import ProcessManager from './src/workflow/ProcessManager.js';
import { sessionMiddleware } from './src/routes/Middleware.js';

// Server configuration setup
const config = {
  port: process.env.PORT || 3333,
  corsOptions: {
    origin: [process.env.FRONTEND_DEV_URL, process.env.FRONTEND_DIST_URL],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 204,
  },
  bodyParserLimit: '50mb',
};

// Initialize components
const app = express();

// Set up middleware
app.use(cors(config.corsOptions));
app.use(bodyParser.json({ limit: config.bodyParserLimit }));
app.use(bodyParser.urlencoded({ limit: config.bodyParserLimit, extended: true }));
app.use(sessionMiddleware);

// Define routes
app.use('/api/users', UserRoutes);
app.use('/api/stream', StreamRoutes);
app.use('/api/workflows', WorkflowRoutes);
app.use('/api/custom-tools', CustomToolRoutes);
app.use('/api/content-outputs', ContentOutputRoutes);
app.get('/api/health', (req, res) => res.status(200).json({ status: 'OK' }));

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

function startServer() {
  const maxRetries = 5;
  let retries = 0;

  const tryStarting = () => {
    const server = app.listen(config.port, async () => {
      console.log(`Master server listening on port ${config.port}`);
      retries = 0; // Reset retries on successful start

      // Restart active workflows
      try {
        await ProcessManager.restartActiveWorkflows();
      } catch (error) {
        console.error('Error restarting active workflows:', error);
      }
    });

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.log(`Port ${config.port} is already in use. Retrying...`);
        if (retries < maxRetries) {
          retries++;
          setTimeout(() => {
            server.close();
            tryStarting();
          }, 5000); // Wait for 5 seconds before retrying
        } else {
          console.error(`Failed to start server after ${maxRetries} attempts. Exiting.`);
          process.exit(1);
        }
      } else {
        console.error('Server error:', error);
        process.exit(1);
      }
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('SIGTERM signal received: closing HTTP server');

      server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      // Close the server and exit
      server.close(() => {
        console.log('Server closed due to uncaught exception. Exiting...');
        process.exit(1);
      });
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      // Close the server and exit
      // server.close(() => {
      //   console.log('Server closed due to unhandled rejection. Exiting...');
      //   process.exit(1);
      // });
    });
  };

  tryStarting();
}

startServer();

export default app;
