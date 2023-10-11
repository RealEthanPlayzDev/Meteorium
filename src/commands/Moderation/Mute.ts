import { SlashCommandBuilder } from "discord.js";
import type { MeteoriumCommand } from "..";

export const Command: MeteoriumCommand = {
    InteractionData: new SlashCommandBuilder()
        .setName("mute")
        .setDescription("Mutes someone inside this server and create a new case regarding it")
        .addUserOption((option) => option.setName("user").setDescription("The user to be muted").setRequired(true))
        .addStringOption((option) =>
            option.setName("reason").setDescription("The reason on why the user was muted").setRequired(true),
        )
        .addIntegerOption((option) =>
            option.setName("duration").setDescription("The duration of the mute").setRequired(true),
        )
        .addAttachmentOption((option) =>
            option
                .setName("proof")
                .setDescription("An media containing proof to prove the reason valid")
                .setRequired(false),
        ),
    async Callback(interaction) {
        if (!interaction.member.permissions.has("MuteMembers"))
            return await interaction.editReply({
                content: "You do not have permission to mute users from this server.",
            });

        /*
        const User = interaction.options.getUser("user", true);
        const Reason = interaction.options.getString("reason", true);
        const Duration = interaction.options.getInteger("duration", true);
        const AttachmentProof = interaction.options.getAttachment("proof", false);
        */

        return await interaction.editReply({ content: "TODO: Implement" });
    },
};
