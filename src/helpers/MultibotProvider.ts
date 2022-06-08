import { FastifyInstance, FastifyRequest } from 'fastify'
import { Bot, webhookCallback } from 'grammy'
import { Low } from 'lowdb'
import buildBot from '../bot'
import { BotContainer as IBotContainer, Lang, IBot } from '../types/bot'
import { DatabaseSchema } from '../types/database'

type FastifyRequestWithMultibot<Options = unknown> = FastifyRequest<Options> & {
    multibot: MultiBotProvider
}

type MultiBotProviderOptions = {
    urlPrefix?: string
    webhookUrl: string
    db: Low<DatabaseSchema>
}

type SearchingParams = {
    cityId: number
    endpoint: string
}

function slashifyUrl(url: string) {
    return url ? url.replace(/\/$/, '') + '/' : ''
}

class BotContainer implements IBotContainer {
    public instance: Bot
    public initialData: IBot
    public webhooksActivated: boolean

    constructor(options: IBotContainer)
    constructor(instance: Bot, initialData: IBot, webhooksActivated?: boolean)
    constructor(
        options: IBotContainer | Bot,
        initialData?: IBot,
        webhooksActivated = false
    ) {
        if (options instanceof Bot) {
            const instance = options
            this.instance = instance
            this.initialData = initialData
            this.webhooksActivated = webhooksActivated ?? false
        } else {
            this.instance = options.instance
            this.initialData = options.initialData
            this.webhooksActivated = options.webhooksActivated ?? false
        }
    }

    /**
     * Notifying Telegram API to send updates to the following url:
     * WEBHOOK_URL + webhook prefix + bot endpoint
     *
     * Example: http://example.com/webhooks/ABCDef:ghIjK1234567890
     */
    public async activateWebhooks(url: string) {
        const endpoint = this.initialData.endpoint

        return this.instance.api.setWebhook(url + endpoint).then(() => {
            this.webhooksActivated = true // Update state of the container

            // Logs data

            console.log(
                'multibot:',
                `the bot is listening for webhooks on ${url + endpoint}`
            )
        })
    }

    public async disableWebhooks() {
        return this.instance.api.deleteWebhook({ drop_pending_updates: true })
    }
}

/**
 * This class provides a bunch of methods that will help you manipulate
 * the bot swarm
 */
export default class MultiBotProvider {
    private containers: BotContainer[] = []
    private readonly fullUrl: string
    private readonly urlPrefix: string
    private readonly db: Low<DatabaseSchema>

    /**
     * @param databaseData List of datase rows of the bots that needed to be added to the registry
     * @param options webhooksUrl is required!
     */
    constructor(databaseData: IBot[], options: MultiBotProviderOptions) {
        const { webhookUrl, urlPrefix = 'webhooks/', db } = options

        if (!webhookUrl)
            throw new Error(
                'Multibot provider requires url that Telegram will use to send webhooks to.'
            )

        this.fullUrl = slashifyUrl(webhookUrl) + slashifyUrl(urlPrefix)
        this.urlPrefix = slashifyUrl(urlPrefix)
        this.db = db

        for (const bot of databaseData) {
            this.addBot(bot)
        }
    }

    /**
     * Adds bot to registry
     *
     * @param settings A data about the bot from the database
     */
    public addBot(settings: IBot, setWebhook: boolean = false) {
        // Creates new instance of bot

        const instance = buildBot(settings.botToken, settings.cityId, this.db)

        const container = new BotContainer(instance, settings)

        // Add bot to registry

        this.containers.push(container)

        // Optionally sets the webhooks activated on the chosen webhook_url

        if (setWebhook) container.activateWebhooks(this.fullUrl)

        return container
    }

    public removeBot(params: Partial<SearchingParams>) {
        // For searching for bot, we can use both cityId or endpoint

        const { cityId, endpoint } = params

        if (!cityId && !endpoint)
            throw new Error('Neither cityId or endpoint was set.')

        // Looking for bot. We also need its index in the array, because we will delete the bot via .splice()

        const index = this.containers.findIndex(
                ({ initialData }) =>
                    initialData.cityId === cityId ||
                    initialData.endpoint === endpoint
            ),
            container = this.containers[index] || null

        if (!container) return

        // Stops the webhooks and then remove the bot from registry

        return container.disableWebhooks().then(() => {
            // Removes bot from the registry

            this.containers.splice(index, 1)
        })
    }

    public getBot(params: Partial<SearchingParams>): BotContainer {
        // For searching for bot, we can use both cityId or endpoint

        const { cityId, endpoint } = params

        if (!cityId && !endpoint)
            throw new Error('Neither cityId or endpoint was set.')

        return this.containers.find(
            ({ initialData }) =>
                initialData.cityId === cityId ||
                initialData.endpoint === endpoint
        )
    }

    /**
     * Activates webhooks for every bot in the registry
     */
    public async activateWebhooks() {
        for (const bot of this.containers) {
            try {
                await bot.activateWebhooks(this.fullUrl)
            } catch (err) {
                console.error('multibot', err)
            }
        }
    }

    /**
     * Because we have multiple bots running, everytime when a request from TelegramAPI
     * comes to the endpoint, we need to find a bot that is responsible for this endpoint
     * and then delegate the work of handling the request to it.
     *
     * Also it provides `.multibot` field in every request for controlling it via API.
     */
    registerEndpoints(app: FastifyInstance) {
        // On every post request on /<this.urlPrefix>/<:endpoint>, do

        app.post<{
            Params: { endpoint: string }
        }>(`/${this.urlPrefix}:endpoint`, (req, reply) => {
            if (!req.params?.endpoint) throw new Error('Endpoint must be set.')

            // Looks for an instance of the bot that's responsible for handling requests on that endpoint

            const { instance } = this.containers.find(
                ({ initialData }) => initialData.endpoint == req.params.endpoint
            )

            if (!instance)
                throw new Error(
                    'There is no bot that is responsible for this endpoint.'
                )

            // Delegates work on handling update to the found instance of the bot

            webhookCallback(instance, 'fastify')(req, reply).catch((e) =>
                console.error.bind('multibot')
            )
        })

        app.addHook(
            'onRequest',
            async (req: FastifyRequestWithMultibot, reply) => {
                req.multibot = this
            }
        )
    }
}
