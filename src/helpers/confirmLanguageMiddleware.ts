import { NextFunction, InlineKeyboard } from 'grammy'
import { BotContext, Lang } from '../interfaces'

/**
 * Switching the language via storing its identifier in sessionю
 */
export async function switchLang(
    ctx: BotContext,
    identifier: Lang
): Promise<void> {
    ctx.session.lang = identifier // Update language in session

    ctx.i18n.locale(ctx.session.lang) // Use selected language

    await ctx.reply(ctx.i18n.t('chat.lang.changed')) // Notify about changing the language
}

/**
 * This middleware checks if any available language was chosen by a
 * user and if it wasn't, then it sends a message to ask the user to
 * choose his language.
 */
export default async function confirmLanguageMiddleware(
    ctx: BotContext,
    next: NextFunction
): Promise<void> {
    // If user language is established, then use it in the templater
    if (ctx.session.lang) {
        ctx.i18n.locale(ctx.session.lang) // Sets the language of the templater
        await next()
        return
    }

    /**
     * If there's no language set and it's not a callback, then
     * send the message.
     *
     * It's necessary to check if it doesn't answer for callbacks,
     * because the user chooses his language via callback buttons.
     * If it doesn't check it, then it sends the notification
     * even after the user pressed on the button.
     */
    if (!ctx.session.lang && !ctx.callbackQuery) {
        // Creating new keyboard
        const langKeyboard = new InlineKeyboard()

        // Adding values to new keyboard
        langKeyboard.text('Русский', 'ru').text('English', 'en')

        // Send templated reply
        await ctx.reply(ctx.i18n.t('chat.lang.choose'), {
            reply_markup: langKeyboard,
        })

        return
    }

    // Takes callback query data for check if it is a language identifier
    const selectedLang = ctx.callbackQuery?.data

    // If it is a callback and its data is a language identifier, then change the language
    if (selectedLang && (selectedLang == 'en' || selectedLang == 'ru')) {
        await switchLang(ctx, selectedLang)
    }

    await next()
}
