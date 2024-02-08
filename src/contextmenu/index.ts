import type {
    Awaitable,
    MessageContextMenuCommandInteraction,
    UserContextMenuCommandInteraction,
    ContextMenuCommandBuilder,
    ApplicationCommandType,
} from "discord.js";
import type { MeteoriumClient } from "../util/MeteoriumClient";

// User context menus
export * as userinfo from "./user/UserInfo";

// Message context menus
export * as sayinreply from "./message/SayInReply";

export type MeteoriumUserContextMenuAction = {
    Type: ApplicationCommandType.User;
    InteractionData: Pick<ContextMenuCommandBuilder, "toJSON">;
    Callback(interaction: UserContextMenuCommandInteraction<"cached">, client: MeteoriumClient): Awaitable<any>;
    Init?(client: MeteoriumClient): Awaitable<void>;
};

export type MeteoriumMessageContextMenuAction = {
    Type: ApplicationCommandType.Message;
    InteractionData: Pick<ContextMenuCommandBuilder, "toJSON">;
    Callback(interaction: MessageContextMenuCommandInteraction<"cached">, client: MeteoriumClient): Awaitable<any>;
    Init?(client: MeteoriumClient): Awaitable<void>;
};
