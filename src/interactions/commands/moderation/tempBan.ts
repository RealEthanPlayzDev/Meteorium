import util from "node:util";
import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { GuildFeatures, ModerationAction } from "@prisma/client";
import ms from "../../../classes/ms.js";
import type { MeteoriumChatCommand } from "../../index.js";
import MeteoriumEmbedBuilder from "../../../classes/embedBuilder.js";

export const Command: MeteoriumChatCommand = {
    interactionData: new SlashCommandBuilder()
        .setName("tempban")
        .setDescription("Creates a temporary ban punishment")
        .addUserOption((option) =>
            option.setName("user").setDescription("The user that will be punished").setRequired(true),
        )
        .addStringOption((option) =>
            option.setName("reason").setDescription("The reason why this user was moderated").setRequired(true),
        )
        .addStringOption((option) =>
            option.setName("duration").setDescription("The duration of the temporary ban").setRequired(true),
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
        const duration = interaction.options.getString("duration", true);
        const proof = interaction.options.getAttachment("proof", false);
        const moderationNote = interaction.options.getString("modnote", false);
        const moderationAttach = interaction.options.getAttachment("modattach", false);
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
                Action: ModerationAction.TempBan,
                GuildId: interaction.guildId,
                TargetUserId: user.id,
                ModeratorUserId: moderator.id,
                Reason: reason,
                AttachmentProof: proof?.url,
                Duration: duration,
                ModeratorNote: moderationNote || undefined,
                ModeratorAttachment: moderationAttach?.url,
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

                // Send
                try {
                    const DirectMessageChannnel = await user.createDM();
                    await DirectMessageChannnel.send({ embeds: [embed] });
                } catch (err) {
                    client.logging
                        .getNamespace("Moderation")
                        .getNamespace("TempBan")
                        .error(`Could not send direct message to ${user.id}:\n${util.inspect(err)}`);
                }

                // Ban
                const delMsgSeconds = delMsgHistoryTime ? ms(delMsgHistoryTime) * 1000 : undefined;
                await member.ban({
                    reason: `Case #${caseId} from ${moderator.username} (${moderator.id}): ${reason}`,
                    deleteMessageSeconds: delMsgSeconds
                        ? delMsgSeconds >= 604800
                            ? 604800
                            : delMsgSeconds
                        : undefined,
                });

                // Create active temp ban entry
                await client.db.activeTempBans.create({ data: { GlobalCaseId: caseDb.GlobalCaseId } });

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
    async initialize(client) {
        setInterval(async () => {
            await client.db.$transaction(async (tx) => {
                const active = await tx.activeTempBans.findMany({ include: { Case: true } });
                const promises = active.map(async (active) => {
                    const createdAt = active.Case.CreatedAt;
                    const expiresAt = new Date(Number(active.Case.CreatedAt) + ms(active.Case.Duration));
                    if (expiresAt <= createdAt) {
                        const guild = await client.guilds.fetch(active.Case.GuildId);
                        await guild.members.unban(active.Case.TargetUserId);
                        await tx.activeTempBans.delete({ where: { ActiveTempBanId: active.ActiveTempBanId } });
                        await tx.moderationCase.update({
                            where: { GlobalCaseId: active.GlobalCaseId },
                            data: { Active: false },
                        });
                    }
                    return;
                });
                await Promise.all(promises);
                return;
            });
        }, 10000);
    },
};
