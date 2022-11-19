import type { Awaitable, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import type { MeteoriumClient } from '../util/MeteoriumClient';

// Category - Tests
export * as test from "./Tests/Test";
export * as embedtest from "./Tests/EmbedTest";
export * as errortest from "./Tests/ErrorTest";
export * as deferrederrortest from "./Tests/DeferredErrorTest";
export * as optionstest from "./Tests/OptionsTest";

// Category - Info
export * as help from "./Info/Help";
export * as ping from "./Info/Ping";
export * as userinfo from "./Info/UserInfo";
export * as holodexapi from "./Info/HolodexAPI";

export type MeteoriumCommand = {
    InteractionData: Pick<SlashCommandBuilder, 'toJSON'>,
    Callback(interaction: ChatInputCommandInteraction<'cached'>, client: MeteoriumClient): Awaitable<any>
}