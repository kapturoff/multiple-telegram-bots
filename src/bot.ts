import { Bot } from 'grammy'

// If there's no bot token in environment variables
if (!process.env.BOT_TOKEN) {
    console.error('BOT_TOKEN was not provided.')
    process.exit(1)
}

// Create instance of a bot
const bot = new Bot(process.env.BOT_TOKEN)

// Text handlers
bot.command('start', (ctx) => ctx.reply('Welcome! Up and running.'))
bot.on('message', (ctx) => ctx.reply('Got another message!'))

// Export bot to run it in index.ts
export default bot
