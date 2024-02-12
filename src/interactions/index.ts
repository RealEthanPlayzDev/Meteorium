import {
    ChatInputCommandInteraction,
    AutocompleteInteraction,
    MessageContextMenuCommandInteraction,
    UserContextMenuCommandInteraction,
    SlashCommandBuilder,
    ContextMenuCommandBuilder,
    RESTPostAPIChatInputApplicationCommandsJSONBody,
    RESTPostAPIContextMenuApplicationCommandsJSONBody,
    ApplicationCommandType,
    Awaitable,
    Collection,
} from "discord.js";
import type MeteoriumClient from "../classes/client.js";
import type { LoggingNamespace } from "../classes/logging.js";

import * as commands from "./commands/index.js";
import * as userContextMenuActions from "./userContextMenuActions/index.js";
import * as messageContextMenuActions from "./messageContextMenuActions/index.js";

export type MeteoriumChatCommand = {
    interactionData: SlashCommandBuilder;
    callback(interaction: ChatInputCommandInteraction<"cached">, client: MeteoriumClient): Awaitable<any>;
    autocomplete?(interaction: AutocompleteInteraction<"cached">, client: MeteoriumClient): Awaitable<any>;
    initialize?(client: MeteoriumClient): Awaitable<any>;
};

export type MeteoriumUserContextMenuAction = {
    interactionData: ContextMenuCommandBuilder;
    callback(interaction: UserContextMenuCommandInteraction<"cached">, client: MeteoriumClient): Awaitable<any>;
    initialize?(client: MeteoriumClient): Awaitable<any>;
};

export type MeteoriumMessageContextMenuAction = {
    interactionData: ContextMenuCommandBuilder;
    callback(interaction: MessageContextMenuCommandInteraction<"cached">, client: MeteoriumClient): Awaitable<any>;
    initialize?(client: MeteoriumClient): Awaitable<any>;
};

export default class MeteoriumInteractionManager {
    public chatInputInteractions: Collection<string, MeteoriumChatCommand>;
    public userContextMenuActionInteractions: Collection<string, MeteoriumUserContextMenuAction>;
    public messageContextMenuActionInteractions: Collection<string, MeteoriumMessageContextMenuAction>;
    public client: MeteoriumClient;
    public loggingNS: LoggingNamespace;

    public constructor(client: MeteoriumClient) {
        this.chatInputInteractions = new Collection();
        this.userContextMenuActionInteractions = new Collection();
        this.messageContextMenuActionInteractions = new Collection();
        this.client = client;
        this.loggingNS = client.logging.registerNamespace("InteractionManager");
    }

    public registerChatInputInteractions() {
        const regChatInputNS = this.loggingNS.getNamespace("Registration/ChatInput");

        this.chatInputInteractions.clear();
        regChatInputNS.info("Registering chat input interactions");

        for (const [Name, { Command }] of Object.entries(commands)) {
            regChatInputNS.verbose(`Registering -> ${Name} (${Command.interactionData.name})`);
            this.chatInputInteractions.set(Name, Command);
        }

        return;
    }

    public registerUserContextMenuActionInteractions() {
        const regUserContextMenuActionNS = this.loggingNS.getNamespace("Registration/UserContextMenuAction");

        this.userContextMenuActionInteractions.clear();
        regUserContextMenuActionNS.info("Registering user context menu actions");

        for (const [Name, { UserContextMenuAction }] of Object.entries(userContextMenuActions)) {
            regUserContextMenuActionNS.verbose(
                `Registering -> ${Name} (${UserContextMenuAction.interactionData.name})`,
            );
            if (UserContextMenuAction.interactionData.type != ApplicationCommandType.User)
                throw new Error(
                    `invalid context menu action type for ${Name} (expected User, got ${UserContextMenuAction.interactionData.type})`,
                );
            this.userContextMenuActionInteractions.set(Name, UserContextMenuAction);
        }

        return;
    }

    public registerMessageContextMenuActionInteractions() {
        const regMessageContextMenuActionNS = this.loggingNS.getNamespace("Registration/MessageContextMenuAction");

        this.messageContextMenuActionInteractions.clear();
        regMessageContextMenuActionNS.info("Registering message context menu actions");

        for (const [Name, { MessageContextMenuAction }] of Object.entries(messageContextMenuActions)) {
            regMessageContextMenuActionNS.verbose(
                `Registering -> ${Name} (${MessageContextMenuAction.interactionData.name})`,
            );
            if (MessageContextMenuAction.interactionData.type != ApplicationCommandType.Message)
                throw new Error(
                    `invalid context menu action type for ${Name} (expected Message, got ${MessageContextMenuAction.interactionData.type})`,
                );
            this.messageContextMenuActionInteractions.set(Name, MessageContextMenuAction);
        }

        return;
    }

    public registerAllInteractions() {
        this.registerChatInputInteractions();
        this.registerUserContextMenuActionInteractions();
        this.registerMessageContextMenuActionInteractions();
        return;
    }

    public generateAppsJsonData() {
        const merged: Array<
            RESTPostAPIChatInputApplicationCommandsJSONBody | RESTPostAPIContextMenuApplicationCommandsJSONBody
        > = [];

        // json hell lmao
        this.chatInputInteractions.forEach(({ interactionData }) => merged.push(interactionData.toJSON()));
        this.userContextMenuActionInteractions.forEach(({ interactionData }) => merged.push(interactionData.toJSON()));
        this.messageContextMenuActionInteractions.forEach(({ interactionData }) =>
            merged.push(interactionData.toJSON()),
        );

        return merged;
    }
}
