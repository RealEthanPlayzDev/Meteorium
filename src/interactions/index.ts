import util from "node:util";

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
    Interaction,
    codeBlock,
    userMention,
    User,
} from "discord.js";
import { GuildFeatures } from "@prisma/client";
import type MeteoriumClient from "../classes/client.js";
import type { LoggingNamespace } from "../classes/logging.js";

import * as commands from "./commands/index.js";
import * as userContextMenuActions from "./userContextMenuActions/index.js";
import * as messageContextMenuActions from "./messageContextMenuActions/index.js";
import MeteoriumEmbedBuilder from "../classes/embedBuilder.js";

export type MeteoriumChatCommand = {
    interactionData: Pick<SlashCommandBuilder, "toJSON"> & Pick<SlashCommandBuilder, "name">;
    requiredFeature?: GuildFeatures;
    callback(interaction: ChatInputCommandInteraction<"cached">, client: MeteoriumClient): Awaitable<any>;
    autocomplete?(interaction: AutocompleteInteraction<"cached">, client: MeteoriumClient): Awaitable<any>;
    initialize?(client: MeteoriumClient): Awaitable<any>;
};

export type MeteoriumUserContextMenuAction = {
    interactionData: ContextMenuCommandBuilder;
    requiredFeature?: GuildFeatures;
    callback(interaction: UserContextMenuCommandInteraction<"cached">, client: MeteoriumClient): Awaitable<any>;
    initialize?(client: MeteoriumClient): Awaitable<any>;
};

export type MeteoriumMessageContextMenuAction = {
    interactionData: ContextMenuCommandBuilder;
    requiredFeature?: GuildFeatures;
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
            if (this.client.config.DontRegisterTestInteractions && Name.toLowerCase().startsWith("test")) continue;
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
            if (this.client.config.DontRegisterTestInteractions && Name.toLowerCase().startsWith("test")) continue;
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
            if (this.client.config.DontRegisterTestInteractions && Name.toLowerCase().startsWith("test")) continue;
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

    public getInteractionData(type: ApplicationCommandType, name: string) {
        const collection =
            type == ApplicationCommandType.ChatInput
                ? this.chatInputInteractions
                : type == ApplicationCommandType.User
                  ? this.userContextMenuActionInteractions
                  : type == ApplicationCommandType.Message
                    ? this.messageContextMenuActionInteractions
                    : undefined;
        if (!collection) throw new Error(`invalid interaction type ${type}`);

        for (const [_, data] of collection) {
            if (data.interactionData.name == name) return data;
        }

        return undefined;
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

    private async dispatchInteractionOccurredLog(name: string, type: string, guildId: string, dispatcher: User) {
        const guildDb = await this.client.db.guild.findUnique({ where: { GuildId: guildId } });
        const channel =
            guildDb && guildDb.LoggingChannelId != ""
                ? await this.client.channels.fetch(guildDb.LoggingChannelId).catch(() => null)
                : null;
        if (!guildDb) throw new Error(`no guild data for ${guildId}`);
        if (!channel || !channel.isTextBased()) return;

        const embed = new MeteoriumEmbedBuilder().setTitle("Interaction dispatched").addFields([
            { name: "Dispatcher", value: `${userMention(dispatcher.id)} (${dispatcher.username} - ${dispatcher.id})` },
            { name: "Interaction name", value: name },
            { name: "Interaction type", value: type },
        ]);

        return await channel.send({ embeds: [embed] });
    }

    public async dispatchInteraction(interaction: Interaction) {
        if (!interaction.inCachedGuild()) return;

        // Get logging namespace
        const dispatchNS = this.loggingNS.getNamespace("Dispatch");

        // Interaction type
        const interactionType = interaction.isChatInputCommand()
            ? ApplicationCommandType.ChatInput
            : interaction.isAutocomplete()
              ? ApplicationCommandType.ChatInput
              : interaction.isUserContextMenuCommand()
                ? ApplicationCommandType.User
                : interaction.isMessageContextMenuCommand()
                  ? ApplicationCommandType.Message
                  : undefined;
        const interactionName =
            interaction.isCommand() || interaction.isAutocomplete() ? interaction.commandName : undefined;
        const isAutocomplete = interaction.isAutocomplete();
        if (!interactionType || !interactionName) return;

        // Get interaction data
        const data = this.getInteractionData(interactionType, interactionName);
        if (!data)
            return dispatchNS.error(
                `could not find interaction data for ${interactionName}? ignoring this interaction (${interaction.id})`,
            );

        // Required feature check
        if (
            data.requiredFeature &&
            !(await this.client.guildFeatures.hasFeatureEnabled(interaction.guildId, data.requiredFeature))
        ) {
            if (interaction.isRepliable())
                await interaction.reply({
                    content: `This command requires the guild feature ${data.requiredFeature} to be enabled.`,
                    ephemeral: true,
                });
            return;
        }

        // Logging to guild internal logs
        if (!isAutocomplete)
            this.dispatchInteractionOccurredLog(
                interactionName,
                interactionType == ApplicationCommandType.ChatInput
                    ? "Chat command"
                    : `${interactionType == ApplicationCommandType.User ? "User" : "Message"} context menu action`,
                interaction.guildId,
                interaction.user,
            ).catch((e) =>
                dispatchNS.warn(
                    `could not send interaction dispatch log for ${interaction.id} (guild ${interaction.guildId}):\n${util.inspect(e)}`,
                ),
            );

        // Execute callback
        try {
            if (isAutocomplete) {
                const dataTyped = data as MeteoriumChatCommand;
                if (!dataTyped.autocomplete)
                    return dispatchNS.error(
                        `autocomplete interaction running on a command that doesn't have a autocomplete callback set (${interactionName})`,
                    );
                await dataTyped.autocomplete(interaction, this.client);
            } else {
                switch (interactionType) {
                    case ApplicationCommandType.ChatInput: {
                        const dataTyped = data as MeteoriumChatCommand;
                        await dataTyped.callback(interaction as ChatInputCommandInteraction<"cached">, this.client);
                        break;
                    }
                    case ApplicationCommandType.User: {
                        const dataTyped = data as MeteoriumUserContextMenuAction;
                        await dataTyped.callback(
                            interaction as UserContextMenuCommandInteraction<"cached">,
                            this.client,
                        );
                        break;
                    }
                    case ApplicationCommandType.Message: {
                        const dataTyped = data as MeteoriumMessageContextMenuAction;
                        await dataTyped.callback(
                            interaction as MessageContextMenuCommandInteraction<"cached">,
                            this.client,
                        );
                        break;
                    }
                    default: {
                        throw new Error("invalid interaction type");
                    }
                }
            }
        } catch (e) {
            const inspected = util.inspect(e);
            dispatchNS.error(`error occurred when during interaction dispatch (${interactionName}):\n${inspected}`);

            const errEmbed = new MeteoriumEmbedBuilder(interaction.user)
                .setTitle("Error occurred during interaction dispatch")
                .setDescription(codeBlock(inspected.substring(0, 4500)))
                .setErrorColor();

            try {
                if (interaction.isChatInputCommand() || interaction.isContextMenuCommand()) {
                    if (interaction.deferred) await interaction.editReply({ embeds: [errEmbed] });
                    else await interaction.reply({ embeds: [errEmbed] });
                }
            } catch (e) {
                dispatchNS.warn(
                    `could not send interaction error for ${interaction.id} (${interactionName}):\n${util.inspect(e)}`,
                );
            }
        }

        return;
    }
}
