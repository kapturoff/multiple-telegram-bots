import { Bot, session, Api, RawApi } from 'grammy'
import { BotContext } from './types/database'
import { Low } from 'lowdb'
import { DatabaseSchema } from './types/database'

export default function buildBot(
    botToken: string,
    cityId: number,
    db: Low<DatabaseSchema>
): Bot<BotContext, Api<RawApi>> {
    // Create instance of a bot uses our BotContext

    const bot = new Bot<BotContext>(botToken)

    // Commands

    bot.command('start', async (ctx) => {
        const city = db.data.cities.find((city) => city.id == cityId)

        ctx.reply(`hello, you are from ${city.name} city`)
    })

    return bot
}
