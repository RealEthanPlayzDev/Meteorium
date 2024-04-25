import util from "node:util";
import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { GuildFeatures, ModerationAction } from "@prisma/client";
import ms from "../../../classes/ms.js";
import type { MeteoriumChatCommand } from "../../index.js";
import MeteoriumEmbedBuilder from "../../../classes/embedBuilder.js";

export const Command: MeteoriumChatCommand = {
    interactionData: new SlashCommandBuilder()
        .setName("ban")
        .setDescription("Creates a ban punishment")
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
        .addBooleanOption((option) =>
            option.setName("notappealable").setDescription("Is this ban appealable?").setRequired(false),
        )
        .addStringOption((option) =>
            option
                .setName("delmsghistory")
                .setDescription("Delete message history time")
                .setRequired(false)
                .setAutocomplete(true),
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .setDMPermission(false),
    requiredFeature: GuildFeatures.Moderation,
    async callback(interaction, client) {
        const user = interaction.options.getUser("user", true);
        const reason = interaction.options.getString("reason", true);
        const proof = interaction.options.getAttachment("proof", false);
        const moderationNote = interaction.options.getString("modnote", false);
        const moderationAttach = interaction.options.getAttachment("modattach", false);
        const notAppealable = interaction.options.getBoolean("notappealable", false);
        const delMsgHistoryTime = interaction.options.getString("delmsghistory", false);
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
                Action: ModerationAction.Ban,
                GuildId: interaction.guildId,
                TargetUserId: user.id,
                ModeratorUserId: moderator.id,
                Reason: reason,
                AttachmentProof: proof?.url,
                ModeratorNote: moderationNote || undefined,
                ModeratorAttachment: moderationAttach?.url,
                NotAppealable: notAppealable || undefined,
            },
            async function (caseDb) {
                // Get guild settings
                const guildSettings = await client.db.guild.findUnique({ where: { GuildId: interaction.guildId } });
                if (!guildSettings) throw new Error(`no guild settings for guild ${interaction.guildId}`);

                // Get guild member object
                const member = await interaction.guild.members.fetch(user);
                if (!member) throw new Error(`could not get guild member object for ${user.id}`);

                // Case embed
                const embed = await client.dbUtils.generateCaseEmbedFromData(
                    {
                        ...caseDb,
                        PublicLogMsgId: "",
                        Removed: false,
                    },
                    undefined,
                    false,
                    false,
                );

                // Appeal embed
                const appealEmbed = new MeteoriumEmbedBuilder()
                    .setTitle(notAppealable ? "You cannot appeal your ban." : "Your ban is appealable.")
                    .setDescription(
                        notAppealable
                            ? "Your ban was marked unappealable, you have been permanently banned."
                            : guildSettings.BanAppealLink != ""
                              ? "You can appeal your ban, use the following link below to appeal."
                              : "You can appeal your ban, contact a server moderator.",
                    )
                    .setErrorColor();
                if (!notAppealable && guildSettings.BanAppealLink != "")
                    appealEmbed.addFields([{ name: "Ban appeal link", value: guildSettings.BanAppealLink }]);

                // Send
                try {
                    const DirectMessageChannnel = await user.createDM();
                    await DirectMessageChannnel.send({ embeds: [embed, appealEmbed] });
                } catch (err) {
                    client.logging
                        .getNamespace("Moderation")
                        .getNamespace("Ban")
                        .error(`Could not send direct message to ${user.id}:\n${util.inspect(err)}`);
                }

                // Ban
                const delMsgSeconds = delMsgHistoryTime ? ms(delMsgHistoryTime) * 1000 : undefined;
                await member.ban({
                    reason: `Case #${caseDb.CaseId} from ${moderator.username} (${moderator.id}): ${reason}`,
                    deleteMessageSeconds: delMsgSeconds
                        ? delMsgSeconds >= 604800
                            ? 604800
                            : delMsgSeconds
                        : undefined,
                });
                return;
            },
        );

        return await interaction.editReply({ content: `Case #${caseId} created.`, embeds: [embed, fullEmbed] });
    },
    async autocomplete(interaction, _) {
        const focus = interaction.options.getFocused(true);
        if (focus.name == "delmsghistory")
            return await interaction.respond([
                { name: "1 day", value: "1d" },
                { name: "2 days", value: "2d" },
                { name: "3 days", value: "3d" },
                { name: "4 days", value: "4d" },
                { name: "5 days", value: "5d" },
                { name: "6 days", value: "6d" },
                { name: "7 days", value: "7d" },
            ]);
        return await interaction.respond([]);
    },
};
