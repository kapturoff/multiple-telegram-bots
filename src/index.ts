// 1. Add an array into server where the bot instances going to be stored
// 2. Endpoint template /bot<endpoint> for handling bot requests
// 3. Add and delete bot from an array

// Loading .env file and put its values to process.env
import { config } from 'dotenv'
config()

// Pick all needed variables from process.env
const { LOG_API, WEBHOOK_URL } = process.env

// Importing all neccessary code
import Fastify from 'fastify'
import { webhookCallback } from 'grammy'
import buildBot from './bot'
import * as i from './interfaces'
import { Low, JSONFile } from 'lowdb'

// Creating the server for obtaining webhooks
const app = Fastify({
    logger: Boolean(LOG_API),
})

const botsInitiliazed: i.BotMixed[] = []

/**
 * Because we have multiple bots running, everytime that request comes to an endpoint,
 * we need to find a responsible bot that is responsible for this endpoint and delegate
 * a work for handling the request to it.
 */
app.post<{
    Params: i.Params
}>('/:endpoint', (req, reply) => {
    if (!req.params?.endpoint) throw new Error('Endpoint must be set.')

    // Looking for a bot that is responsible for handling requests on that endpoint
    const responsibleBot = botsInitiliazed.find(
        ({ botData }) => botData.endpoint == req.params.endpoint
    )

    if (!responsibleBot)
        throw new Error(
            'There is no bot that is responsible for this endpoint.'
        )

    // Allowing bot to handle incoming request
    webhookCallback(responsibleBot.botInstance, 'fastify')(req, reply)
})

// Starting the server

app.listen(process.env.PORT, async (err, address) => {
    if (err) throw err // TODO: Create error handler for bot things

    /**
     * Initializing database.
     *
     * **Important**: Database need to be filled by the time you run the server.
     *
     * You could fill it by yourself according interface DatabaseSchema or by using
     * the script fillDB.js (*npm run fill_db*) that is in the root of repository.
     */
    const adapter = new JSONFile<i.DatabaseSchema>('db.json'),
        db = new Low(adapter)

    // Reading the database
    await db.read()

    // Getting data about all the bots that need to be running right after server initialized
    const { bots } = db.data

    for (const botData of bots) {
        const bot = buildBot(botData.botToken, botData.cityID, db) // Initilize new bot

        /**
         * Add a just initilized bot to an array of running bots, so it
         * will be handling incoming from Telegram API requests as any other
         * running bot.
         *
         * This approach is chosen because of its flexibility in meaning of that
         * will be quite easy to stop the bot for a while or add a new one in the
         * future.
         */
        botsInitiliazed.push({
            botInstance: bot,
            botData,
        })

        /**
         * Notifying Telegram API to send updates to WEBHOOK_URL + BOT_TOKEN.
         *
         * Example: http://example.com/ABCDefghIjK1234567890
         */
        await bot.api
            .setWebhook(WEBHOOK_URL + botData.endpoint)
            .catch(console.error)
    }

    console.info(`[info]: server's now listening in ${address}`)
})
