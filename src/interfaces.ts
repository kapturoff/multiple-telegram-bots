import {
    Context as BaseContext,
    SessionFlavor,
} from 'grammy'
import { I18nContextFlavor } from '@grammyjs/i18n'

export type Lang = 'ru' | 'en'

// It's neccessary to specify what's going to be inside session in future
export interface Session {
    lang: 'ru' | 'en' | ''
}

// As we will be modifying the base bot context with
// localization and session middlewares, we need to create a type
// that will extend methods of the base context.
export type BotContext = BaseContext & I18nContextFlavor & SessionFlavor<Session>