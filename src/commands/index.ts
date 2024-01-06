import type { AutocompleteInteraction, Awaitable, ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import type { MeteoriumClient } from "../util/MeteoriumClient";

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
export * as rbxapi from "./Info/RbxAPI";
export * as tag from "./Info/Tag";

// Category - Fun
export * as music from "./Fun/Music";

// Category - Moderation
export * as settings from "./Moderation/Settings";
export * as sayin from "./Moderation/SayIn";
export * as reactto from "./Moderation/ReactTo";
export * as ban from "./Moderation/Ban";
export * as kick from "./Moderation/Kick";
export * as mute from "./Moderation/Mute";
export * as warn from "./Moderation/Warn";
export * as punishments from "./Moderation/Punishments";
export * as case from "./Moderation/Case";
export * as removecase from "./Moderation/RemoveCase";
export * as unban from "./Moderation/Unban";
export * as createcase from "./Moderation/CreateCase";
export * as tempban from "./Moderation/TempBan";

export type MeteoriumCommand = {
    InteractionData: Pick<SlashCommandBuilder, "toJSON">;
    Callback(interaction: ChatInputCommandInteraction<"cached">, client: MeteoriumClient): Awaitable<any>;
    Autocomplete?(interaction: AutocompleteInteraction<"cached">, client: MeteoriumClient): Awaitable<any>;
    Init?(client: MeteoriumClient): Awaitable<void>;
};
