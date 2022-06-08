// Loading .env file and put its values to process.env

import { config } from 'dotenv'
config()

// Get all necessary variables from .env

const { LOG_API, WEBHOOK_URL, SERVER_PORT } = process.env

import { Low, JSONFile } from 'lowdb'
import runServer from './server'
import { DatabaseSchema } from './types/database'

// Initializing database

const adapter = new JSONFile<DatabaseSchema>('db.json'),
    db = new Low(adapter)

runServer(Number(SERVER_PORT), db, WEBHOOK_URL, Boolean(LOG_API))
