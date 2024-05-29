import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { GuildFeatures } from "@prisma/client";
import type { MeteoriumChatCommand } from "../../index.js";

export const Command: MeteoriumChatCommand = {
    interactionData: new SlashCommandBuilder()
        .setName("purge")
        .setDescription("Bulk delete a amount messages")
        .addNumberOption((option) =>
            option
                .setName("amount")
                .setDescription("The amount of messages that will be deleted")
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(200),
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .setDMPermission(false),
    requiredFeature: GuildFeatures.Moderation,
    async callback(interaction, client) {
        const amount = interaction.options.getNumber("amount", true);

        // Ensure channel field exists
        if (!interaction.channel) throw new Error("could not get interaction channel");

        // Defer reply
        await interaction.deferReply({ ephemeral: true });

        // Process
        const messages = await interaction.channel.messages.fetch({ limit: amount });
        await interaction.channel.bulkDelete(messages);

        return await interaction.editReply(`Purged ${messages.map((v) => v).length} messages.`);
    },
};
