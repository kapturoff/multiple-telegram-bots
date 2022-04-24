// Loading .env file and put its values to process.env
import { config } from 'dotenv'
config()

// Pick all variables from process.env
const { BOT_TOKEN, LOG_API, WEBHOOK_URL } = process.env

// Importing all neccessary code
import Fastify from 'fastify'
import { webhookCallback } from 'grammy'
import bot from './bot'

// Creating the server for obtaining webhooks
const app = Fastify({
    logger: Boolean(LOG_API),
})

/**
 * Adding handler for endpoint where the webhooks are going to be sent.
 * By that, incoming requests from api.telegram.org will be served by bot as updates.
 *
 * It's important in production to set hash for this endpoint name instead of bot token,
 * because it can be leaked from API logs.
 *
 * @see https://grammy.dev/guide/deployment-types.html#how-to-use-webhooks
 */
app.post('/' + BOT_TOKEN, webhookCallback(bot, 'fastify'))

app.listen(process.env.PORT, (err, address) => {
    if (err) throw err // TODO: Create error handler for bot things

    /**
     * Notifying Telegram API to send updates to WEBHOOK_URL + BOT_TOKEN.
     *
     * Example: http://example.com/ABCDefghIjK1234567890
     */
    bot.api.setWebhook(WEBHOOK_URL + BOT_TOKEN).catch(console.error)

    console.info(`[info]: server's now listening in ${address}`)
})
