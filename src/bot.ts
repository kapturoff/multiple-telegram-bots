import { Bot, session } from 'grammy'
import { I18n } from '@grammyjs/i18n'
import * as path from 'path'
import { BotContext } from './interfaces'
import confirmLanguageMiddleware, {
    switchLang,
} from './helpers/confirmLanguageMiddleware'

// If there's no bot token in environment variables
if (!process.env.BOT_TOKEN) {
    console.error('BOT_TOKEN was not provided.')
    process.exit(1)
}

// Create instance of a bot uses our BotContext
const bot = new Bot<BotContext>(process.env.BOT_TOKEN)

// Registering middlewares

// Allow bot to use sessions
bot.use(
    session({
        initial: () => ({ lang: '' }),
    })
)

// Configure localization
const i18n = new I18n({
    defaultLanguageOnMissing: true, // If something missing in chosen lang, take it from main language
    directory: path.resolve(__dirname, 'locales'), // Directory where locales stored
    useSession: true, // Allow to use session to remember users' langs
    defaultLanguage: 'en',
})

/**
 * After adding it as a middleware, localization becomes available
 * through ctx.i18n. ctx.i18n.t() can pick a value from locales and
 * template it with given to this function data.
 */
bot.use(i18n.middleware())

// Add a middleware that asks user to choose his language everytime it's not set
bot.use(confirmLanguageMiddleware)

// Commands

bot.command('start', async (ctx) => {
    await ctx.reply(ctx.i18n.t('chat.welcome', { cityName: 'Krasnodar' }))
})

// Switching to Russian
bot.command('rulang', async (ctx) => {
    await switchLang(ctx, 'ru')
})

// Switching to English
bot.command('enlang', async (ctx) => {
    await switchLang(ctx, 'en')
})

// Export bot to run it in index.ts
export default bot
