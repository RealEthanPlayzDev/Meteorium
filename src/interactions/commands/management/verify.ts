import { SlashCommandBuilder } from "discord.js";
import { GuildFeatures } from "@prisma/client";
import type { MeteoriumChatCommand } from "../../index.js";

export const Command: MeteoriumChatCommand = {
    interactionData: new SlashCommandBuilder()
        .setName("verify")
        .setDescription("Verify yourself with this command")
        .setDMPermission(false)
        .addSubcommand((option) =>
            option.setName("start").setDescription("Start the verification request submission process"),
        )
        .addSubcommand((option) =>
            option
                .setName("attach")
                .setDescription("Upload a attachment for the verification process")
                .addAttachmentOption((option) =>
                    option
                        .setName("attachment")
                        .setDescription("The attachment for the verification request that you're doing")
                        .setRequired(true),
                ),
        ),
    requiredFeature: GuildFeatures.UserVerification,
    async callback(interaction, client) {
        const subcommand = interaction.options.getSubcommand(true);
        switch (subcommand) {
            case "start":
                return await client.dbUtils.processVerification(interaction, false);
            case "attach": {
                const attachment = interaction.options.getAttachment("attachment", true);

                await interaction.deferReply({ ephemeral: true });
                const guildSettings = await client.db.guild.findUnique({ where: { GuildId: interaction.guildId } });
                if (!guildSettings) throw new Error("could not get settings from database");
                if (!guildSettings.VerifyAttachEnabled)
                    return await interaction.editReply(
                        "You do not need to upload a attachment to verify in this server.",
                    );

                await client.db.userVerificationAttachment.upsert({
                    where: {
                        UniqueAttachmentPerUserPerGuild: { GuildId: interaction.guildId, UserId: interaction.user.id },
                    },
                    create: { GuildId: interaction.guildId, UserId: interaction.user.id, Attachment: attachment.url },
                    update: { Attachment: attachment.url },
                });

                return await interaction.editReply(
                    "Uploaded attachment for verification. You may now begin the verification process by clicking the button or running ``/verify start``.",
                );
            }
            default:
                break;
        }
    },
};
