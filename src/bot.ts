import { Bot, Context as BaseContext, session, SessionFlavor } from 'grammy'
import { I18n, I18nContextFlavor } from '@grammyjs/i18n'
import * as path from 'path'

// If there's no bot token in environment variables
if (!process.env.BOT_TOKEN) {
    console.error('BOT_TOKEN was not provided.')
    process.exit(1)
}

// It's neccessary to specify what's going to be inside session in future
interface Session {
    lang: 'ru' | 'en'
}

// As we will be modifying the base bot context with
// localization and session middlewares, we need to create a type
// that will extend methods of the base context.
type BotContext = BaseContext & I18nContextFlavor & SessionFlavor<Session>

// Create instance of a bot uses our BotContext
const bot = new Bot<BotContext>(process.env.BOT_TOKEN)

// Allow bot to use sessions
bot.use(
    session({
        initial: () => ({ lang: 'en' }), // Set the starting language
    })
)

// Configure localization
const i18n = new I18n({
    defaultLanguageOnMissing: true, // If something missing in chosen lang, switch to main language
    directory: path.resolve(__dirname, 'locales'), // Directory where locales stored
    useSession: true, // Allow to use session to remember users' langs
})

// After adding it as a middleware, localization becomes available
// through ctx.i18n. ctx.i18n.t() can pick a value from locales and
// template it with given to this function data.
bot.use(i18n.middleware())

// Set up the text handlers
bot.command('start', async (ctx) => {
    // Use the lang that user chose in the template
    ctx.i18n.locale(ctx.session.lang)

    // Send templated reply
    ctx.reply(ctx.i18n.t('chat.welcome', { text: 'Hey!' }))
})

// Switching to Russian
bot.command('rulang', async (ctx) => {
    ctx.session.lang = 'ru'
})

// Switching to English
bot.command('enlang', async (ctx) => {
    ctx.session.lang = 'en'
})

// Export bot to run it in index.ts
export default bot
