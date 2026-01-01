import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import http from 'http'
import morgan from 'morgan'

import { Server } from 'socket.io'
import logger from './utils/logger.js'
import { alatPayRoutes } from './routes/alatPayRoutes.js'
import initializeSocket from './socket/index.js'
import passport from 'passport'
import prisma from '../prisma/prisma.js'

import session from 'express-session'

// import admin from 'firebase-admin'

// Configure logging
const morganFormat = ':method :url :status :response-time ms'
const loggingMiddleware = morgan(morganFormat, {
  stream: {
    write: message => {
      const logObject = {
        method: message.split(' ')[0],
        url: message.split(' ')[1],
        status: message.split(' ')[2],
        responseTime: message.split(' ')[3]
      }
      logger.info(JSON.stringify(logObject))
    }
  }
})

// Configure middleware
const configureCors = () => {
  return cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['*']
  })
}

// Error handling middleware
const errorHandler = (
  err: any,
  _req: express.Request,
  res: express.Response,
  _next: express.NextFunction
) => {
  logger.error('Error:', err)
  res.status(500).json({ error: 'Internal server error' })
}

// Health check route handler
const healthCheck = async (_req: express.Request, res: express.Response) => {
  try {
    logger.info({
      status: 'healthy'
    })
    res.json({ status: 'healthy' })
  } catch (error) {
    logger.error('Health check failed:')
    res.status(503).json({
      status: 'unhealthy'
    })
  }
}

// Cleanup handlers
const setupCleanupHandlers = () => {
  const cleanup = async () => {
    logger.info('Shutting down server...')
    process.exit(0)
  }

  process.on('SIGTERM', cleanup)
  process.on('SIGINT', cleanup)
}

async function startServer () {
  try {
    const app = express()

    const PORT = process.env.PORT

    // Apply middleware
    app.use(loggingMiddleware)
    app.use(configureCors())
    app.use(express.json())
    app.use(express.json({ limit: '100mb' }))
    app.use(express.urlencoded({ limit: '100mb', extended: true }))

    dotenv.config()

    // Create HTTP server and Socket.IO instance
    const server = http.createServer(app)
    const io = new Server(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    })
    // Initialize socket handlers
    initializeSocket(io)

    // Setup routes
    app.use('/v1/api/payments/alatpay', alatPayRoutes)

    app.get('/health', healthCheck)
    app.get('/', (_req, res) => {
      res.json({ message: ' Service is running!' })
    })

    app.use(
      session({
        resave: false,
        saveUninitialized: true,
        secret: process.env.SESSION_SECRET || 'my-secret'
      })
    )
    app.use(passport.initialize())
    app.use(passport.session())

    passport.serializeUser(function (
      user: any,
      cb: (err: any, id?: unknown) => void
    ) {
      cb(null, user)
    })

    // Apply error handling
    app.use(errorHandler)

    // Setup cleanup handlers
    setupCleanupHandlers()

    await prisma.$connect()
    console.log('Successfully connected to database')

    // Start server
    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`)
    })
  } catch (error) {
    logger.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer()
