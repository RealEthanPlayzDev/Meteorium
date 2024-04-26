import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { GuildFeatures, ModerationAction } from "@prisma/client";
import type { MeteoriumChatCommand } from "../../index.js";

export const Command: MeteoriumChatCommand = {
    interactionData: new SlashCommandBuilder()
        .setName("kick")
        .setDescription("Creates a kick punishment")
        .addUserOption((option) =>
            option.setName("user").setDescription("The user that will be punished").setRequired(true),
        )
        .addStringOption((option) =>
            option.setName("reason").setDescription("The reason why this user was moderated").setRequired(true),
        )
        .addAttachmentOption((option) =>
            option
                .setName("proof")
                .setDescription("The attachment proof on why this user needed to be moderated")
                .setRequired(false),
        )
        .addStringOption((option) =>
            option.setName("modnote").setDescription("Internal moderation note").setRequired(false),
        )
        .addAttachmentOption((option) =>
            option.setName("modattach").setDescription("Internal moderation attachment").setRequired(false),
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
        .setDMPermission(false),
    requiredFeature: GuildFeatures.Moderation,
    async callback(interaction, client) {
        const user = interaction.options.getUser("user", true);
        const reason = interaction.options.getString("reason", true);
        const proof = interaction.options.getAttachment("proof", false);
        const moderationNote = interaction.options.getString("modnote", false);
        const moderationAttach = interaction.options.getAttachment("modattach", false);
        const moderator = interaction.user;

        // Sanity checks
        if (moderator.bot)
            return await interaction.reply({ content: "The moderator can't be a bot.", ephemeral: true });
        if (user.bot) return await interaction.reply({ content: "Moderating bots aren't possible.", ephemeral: true });

        // Defer reply
        await interaction.deferReply({ ephemeral: true });

        // Create case
        const { caseId, embed, fullEmbed } = await client.dbUtils.createModerationCase(
            {
                Action: ModerationAction.Kick,
                GuildId: interaction.guildId,
                TargetUserId: user.id,
                ModeratorUserId: moderator.id,
                Reason: reason,
                AttachmentProof: proof?.url,
                ModeratorNote: moderationNote || undefined,
                ModeratorAttachment: moderationAttach?.url,
            },
            async function (caseDb) {
                const member = await interaction.guild.members.fetch(user);
                if (!member) throw new Error(`could not get guild member object for ${user.id}`);
                await member.kick(`Case #${caseDb.CaseId} from ${moderator.username} (${moderator.id}): ${reason}`);
                return;
            },
        );

        return await interaction.editReply({ content: `Case #${caseId} created.`, embeds: [embed, fullEmbed] });
    },
};
