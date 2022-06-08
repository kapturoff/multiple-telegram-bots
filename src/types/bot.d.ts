import {
    Context as BaseContext,
    SessionFlavor,
    Bot as BotInstance,
} from 'grammy'
import { I18nContextFlavor } from '@grammyjs/i18n'

export type Lang = 'ru' | 'en'

/**
 * As we will be modifying the base bot context with
 * localization and session middlewares, we need to create a type
 * that will extend methods of the base context.
 */
export type BotContext = BaseContext
// We need it for establishing database schema

export interface IBot {
    /**
     * Needed to help bot identify itself.
     */

    botToken: string

    /**
     * Every bot is linked to one city, so it needed to
     * be storing its city ID.
     */

    cityId: number

    /**
     * Endpoint is needed to be stored to help server
     * to choose which bot is responsible for serving
     * the request.
     *
     * Example of endpoint:
     *
     * http://example.com/botAbCdEfGhIjK01234567890,
     *
     * where `botAbCdEfGhIjK01234567890` is an endpoint.
     *
     * **Very important to not use bot token here, since it
     * can be leaked from logs.**
     */

    endpoint: string
}

/**
 * It must be saved separately to stay flexible with the bots architecture
 * in the future.
 *
 * For example, when we would be needed to disable bot for a while, we will
 * be able to just remove instance of a certain bot from the array of the
 * running bots to make it stop to handle requests.
 */
export type BotContainer = {
    instance: BotInstance
    initialData: IBot
    webhooksActivated?: boolean
}
