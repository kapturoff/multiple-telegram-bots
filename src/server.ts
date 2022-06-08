// Importing all neccessary code

import Fastify from 'fastify'
import localtunnel from 'localtunnel'
import { Low } from 'lowdb'
import { DatabaseSchema } from './types/database'
import MultiBotProvider from './helpers/MultibotProvider'

export default async function runServer(
    port: number,
    db: Low<DatabaseSchema>,
    webhookUrl?: string,
    logApi: boolean = true
) {
    // Reading the database

    await db.read()

    // Creating the server for obtaining webhooks

    const app = Fastify({ logger: logApi })

    // Getting data about all the bots that need to be running right after server initialized

    const { bots } = db.data

    // Set multibot provider

    const multibotProvier = new MultiBotProvider(bots, {
        db,
        /**
         * If we're on localhost and need tunnel to work with webhooks, we use Localtunnel.
         * Otherwise, we use a provided webhook URL.
         *
         * Adding a slash in the end is mandatory for compability!
         */
        webhookUrl: webhookUrl || (await localtunnel(port)).url + '/',
    })

    multibotProvier.registerEndpoints(app)

    // Starting the server

    app.listen(port, async (err, address) => {
        if (err) throw err

        await multibotProvier.activateWebhooks()

        console.info('server', `server is now listening on ${address}`)
    })
}
