// Load .env file and put its values to process.env
import { config } from 'dotenv'
config()

// Import the bot
import bot from './bot'

// Run the bot
bot.start()
