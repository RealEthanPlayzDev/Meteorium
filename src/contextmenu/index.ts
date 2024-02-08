import type {
    Awaitable,
    MessageContextMenuCommandInteraction,
    UserContextMenuCommandInteraction,
    ContextMenuCommandBuilder,
} from "discord.js";
import type { MeteoriumClient } from "../util/MeteoriumClient";

// User context menus
export * as userinfo from "./user/UserInfo";

export type MeteoriumUserContextMenuAction = {
    InteractionData: Pick<ContextMenuCommandBuilder, "toJSON">;
    Callback(interaction: UserContextMenuCommandInteraction<"cached">, client: MeteoriumClient): Awaitable<any>;
    Init?(client: MeteoriumClient): Awaitable<void>;
};

export type MeteoriumMessageContextMenuAction = {
    InteractionData: Pick<ContextMenuCommandBuilder, "toJSON">;
    Callback(interaction: MessageContextMenuCommandInteraction<"cached">, client: MeteoriumClient): Awaitable<any>;
    Init?(client: MeteoriumClient): Awaitable<void>;
};
