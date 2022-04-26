import { Bot, session, Api, RawApi } from 'grammy'
import { I18n } from '@grammyjs/i18n'
import * as path from 'path'
import { BotContext } from './interfaces'
import confirmLanguageMiddleware, {
    switchLang,
} from './helpers/confirmLanguageMiddleware'
import { Low } from 'lowdb'
import { DatabaseSchema } from './interfaces'

// Configure localization
const i18n = new I18n({
    defaultLanguageOnMissing: true, // If something missing in chosen lang, take it from main language
    directory: 'locales', // Directory where locales stored
    useSession: true, // Allow to use session to remember users' langs
    defaultLanguage: 'en',
})

export default function buildBot(
    botToken: string,
    cityID: number,
    db: Low<DatabaseSchema>
): Bot<BotContext, Api<RawApi>> {
    // Create instance of a bot uses our BotContext
    const bot = new Bot<BotContext>(botToken)

    // Registering middlewares

    // Allow bot to use sessions
    bot.use(
        session({
            initial: () => ({ lang: '' }),
        })
    )

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
        await ctx.reply(
            ctx.i18n.t('chat.welcome', {
                cityName: db.data.cities.find((city) => city.id == cityID).name,
            })
        )
    })

    // Switching to Russian
    bot.command('rulang', async (ctx) => {
        await switchLang(ctx, 'ru')
    })

    // Switching to English
    bot.command('enlang', async (ctx) => {
        await switchLang(ctx, 'en')
    })

    return bot
}
