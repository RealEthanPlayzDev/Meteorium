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
// export * as rbxapi from "./Info/RbxAPI";

// Category - Fun
export * as nekoloveapi from "./Fun/NekoLoveAPI";
export * as music from "./Fun/Music";

// Category - Moderation
export * as settings from "./Moderation/Settings";
export * as sayin from "./Moderation/SayIn";
export * as reactto from "./Moderation/ReactTo";
export * as moderation from "./Moderation/Moderation";

export type MeteoriumCommand = {
    InteractionData: Pick<SlashCommandBuilder, 'toJSON'>,
    Callback(interaction: ChatInputCommandInteraction<'cached'>, client: MeteoriumClient): Awaitable<any>
}