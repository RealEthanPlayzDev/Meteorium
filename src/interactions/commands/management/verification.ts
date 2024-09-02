import util from "node:util";
import {
    PermissionFlagsBits,
    SlashCommandBuilder,
    userMention,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    time,
} from "discord.js";
import { GuildFeatures, ModerationAction, VerificationStatus } from "@prisma/client";
import ms from "../../../classes/ms.js";
import type { MeteoriumChatCommand } from "../../index.js";
import MeteoriumEmbedBuilder from "../../../classes/embedBuilder.js";

export const Command: MeteoriumChatCommand = {
    interactionData: new SlashCommandBuilder()
        .setName("verification")
        .setDescription("User verification feature")
        .addSubcommand((option) =>
            option
                .setName("check")
                .setDescription("Check the verification status and info of a user")
                .addUserOption((option) => option.setName("user").setDescription("The target user").setRequired(true)),
        )
        .addSubcommand((option) =>
            option
                .setName("revoke")
                .setDescription("Revoke the verification status of a user")
                .addUserOption((option) => option.setName("user").setDescription("The target user").setRequired(true)),
        )
        .addSubcommand((option) =>
            option
                .setName("ban")
                .setDescription("Bans a user from using the verify command. Useful to deter abusers")
                .addUserOption((option) => option.setName("user").setDescription("The target user").setRequired(true)),
        )
        .addSubcommand((option) =>
            option
                .setName("unban")
                .setDescription("Revokes the ban status of a user, allowing them to verify again")
                .addUserOption((option) => option.setName("user").setDescription("The target user").setRequired(true)),
        )
        .addSubcommand((option) =>
            option
                .setName("pause")
                .setDescription("Pauses verification for the entire server, temporarily not allowing users to verify")
                .addBooleanOption((option) =>
                    option
                        .setName("denyexist")
                        .setDescription("Deny all existing requests. Defaults to false")
                        .setRequired(false),
                ),
        )
        .addSubcommand((option) =>
            option.setName("resume").setDescription("Resumes verification for the entire server"),
        )
        .addSubcommand((option) =>
            option.setName("stats").setDescription("View verification statistics for this server"),
        )
        .addSubcommand((option) =>
            option
                .setName("sendmsg")
                .setDescription("Send a message with a button for verification instead")
                .addChannelOption((option) =>
                    option
                        .setName("channel")
                        .setDescription("The target channel, if unspecified the current channel will be used")
                        .setRequired(false),
                ),
        )
        .addSubcommand((option) =>
            option
                .setName("waitlist")
                .setDescription("Returns a list of waiting verifications")
                .addNumberOption((option) =>
                    option.setName("page").setDescription("The page").setRequired(false).setMinValue(1),
                ),
        )
        .addSubcommand((option) =>
            option
                .setName("process")
                .setDescription("Process a waiting verification")
                .addUserOption((option) =>
                    option.setName("user").setDescription("The user who has a waiting request").setRequired(true),
                ),
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .setDMPermission(false),
    requiredFeature: GuildFeatures.UserVerification,
    async callback(interaction, client) {
        const subcommand = interaction.options.getSubcommand(true);

        const sentReplyMsg = await interaction.deferReply({ ephemeral: true, fetchReply: true });

        switch (subcommand) {
            case "check": {
                const user = interaction.options.getUser("user", true);
                const embed = await client.dbUtils.generateUserVerificationDataEmbed(
                    interaction.guildId,
                    user.id,
                    interaction.user,
                );
                return interaction.editReply({ embeds: [embed] });
            }

            case "revoke": {
                const user = interaction.options.getUser("user", true);

                const dataDb = await client.db.userVerificationHistory.findFirst({
                    where: { UserId: user.id, GuildId: interaction.guildId },
                    orderBy: { VerificationHistoryId: "desc" },
                });
                if (!dataDb) return await interaction.editReply("This user has never made a verification request");
                if (dataDb.Status == VerificationStatus.Rejected)
                    return await interaction.editReply("This user's request has been rejected");
                if (dataDb.Status == VerificationStatus.Revoked)
                    return await interaction.editReply("This user's request has already been revoked");
                if (dataDb.Status == VerificationStatus.Waiting)
                    return await interaction.editReply("This user's request is currently waiting to be verified");

                const dataEmbed = await client.dbUtils.generateUserVerificationDataEmbed(
                    interaction.guildId,
                    user.id,
                    interaction.user,
                );

                // Action row buttons
                const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents([
                    new ButtonBuilder().setLabel("No").setCustomId("no").setStyle(ButtonStyle.Primary),
                    new ButtonBuilder().setLabel("Yes").setCustomId("yes").setStyle(ButtonStyle.Danger),
                ]);

                // Edit the reply
                await interaction.editReply({
                    content: "Are you sure you want to revoke this user's verification?",
                    embeds: [dataEmbed],
                    components: [actionRow],
                });

                // Collector
                const collector = sentReplyMsg.createMessageComponentCollector({ idle: 150000 });
                collector.on("collect", async (collectInteraction) => {
                    switch (collectInteraction.customId) {
                        case "yes": {
                            await client.db.userVerificationHistory.update({
                                where: { VerificationHistoryId: dataDb.VerificationHistoryId },
                                data: { Status: VerificationStatus.Revoked, UpdatedAt: new Date() },
                            });
                            await interaction.editReply({
                                content: `Revoked ${userMention(user.id)} (${user.username} - ${user.id})`,
                                embeds: [],
                                components: [],
                            });
                            break;
                        }
                        case "no": {
                            await interaction.editReply({
                                content: "User verification revokal cancelled.",
                                embeds: [],
                                components: [],
                            });
                            break;
                        }
                    }

                    return;
                });
                collector.on("end", async () => {
                    await interaction.editReply({ content: "Timed out.", embeds: [], components: [] });
                    return;
                });

                break;
            }

            case "ban": {
                const user = interaction.options.getUser("user", true);
                await client.db.userVerificationData.upsert({
                    where: { UniqueUserPerGuild: { UserId: user.id, GuildId: interaction.guildId } },
                    create: { UserId: user.id, GuildId: interaction.guildId, Banned: true },
                    update: { Banned: true },
                });
                return await interaction.editReply(
                    `Banned ${userMention(user.id)} (${user.username} - ${user.id}) from the verification system`,
                );
                break;
            }

            case "unban": {
                const user = interaction.options.getUser("user", true);
                const dataDb = await client.db.userVerificationData.findUnique({
                    where: { UniqueUserPerGuild: { UserId: user.id, GuildId: interaction.guildId } },
                    select: { Banned: true },
                });
                if (!dataDb || !dataDb?.Banned)
                    return await interaction.editReply("This user isn't banned from the verification system");
                await client.db.userVerificationData.update({
                    where: { UniqueUserPerGuild: { UserId: user.id, GuildId: interaction.guildId } },
                    data: { Banned: false },
                });
                return await interaction.editReply(
                    `Unbanned ${userMention(user.id)} (${user.username} - ${user.id}) from the verification system`,
                );
            }

            case "pause": {
                const guildSettings = await client.db.guild.findUnique({ where: { GuildId: interaction.guildId } });
                if (!guildSettings) throw new Error("could not get settings from database");
                if (guildSettings.VerifyTempPaused)
                    return await interaction.editReply("Verification already paused for this server");
                await client.db.guild.update({
                    where: { GuildId: interaction.guildId },
                    data: { VerifyTempPaused: true },
                });
                return await interaction.editReply(`Verification paused for this server`);
            }

            case "resume": {
                const denyExisting = interaction.options.getBoolean("denyexist", false) || false;
                const guildSettings = await client.db.guild.findUnique({ where: { GuildId: interaction.guildId } });
                if (!guildSettings) throw new Error("could not get settings from database");
                if (!guildSettings.VerifyTempPaused)
                    return await interaction.editReply("Verification isn't paused for this server");
                await client.db.guild.update({
                    where: { GuildId: interaction.guildId },
                    data: { VerifyTempPaused: false },
                });
                return await interaction.editReply(`Verification resumed for this server`);
            }

            case "stats": {
                const verifiedCount = await client.db.userVerificationHistory.count({
                    where: { GuildId: interaction.guildId, Status: VerificationStatus.Approved },
                });
                const waitingCount = await client.db.userVerificationHistory.count({
                    where: { GuildId: interaction.guildId, Status: VerificationStatus.Waiting },
                });
                const rejectedCount = await client.db.userVerificationHistory.count({
                    where: { GuildId: interaction.guildId, Status: VerificationStatus.Rejected },
                });
                const revokedCount = await client.db.userVerificationHistory.count({
                    where: { GuildId: interaction.guildId, Status: VerificationStatus.Revoked },
                });
                const bannedCount = await client.db.userVerificationData.count({
                    where: { GuildId: interaction.guildId, Banned: true },
                });

                const embed = new MeteoriumEmbedBuilder(interaction.user);
                embed.setTitle(`${interaction.guild.name} - User Verification Statistics`);
                embed.setThumbnail(interaction.guild.iconURL({ size: 512 }));

                embed.addFields([
                    { name: "Verified users", value: verifiedCount.toString() },
                    { name: "Unverified users", value: (interaction.guild.memberCount - verifiedCount).toString() },
                    { name: "Banned users", value: bannedCount.toString() },
                    { name: "Rejected requests", value: rejectedCount.toString() },
                    { name: "Waiting requests", value: waitingCount.toString() },
                    { name: "Revoked requests", value: revokedCount.toString() },
                ]);

                return await interaction.editReply({ embeds: [embed] });
            }

            case "sendmsg": {
                const channel = interaction.options.getChannel("channel", false) || interaction.channel;
                if (!channel) throw new Error("channel is null");
                if (!channel?.isTextBased())
                    return await interaction.editReply("The specified channel is not a text channel");

                const bt = new ButtonBuilder();
                bt.setCustomId("MeteoriumUserVerificationButtonRequest");
                bt.setLabel("Verify");
                bt.setStyle(ButtonStyle.Primary);

                const ar = new ActionRowBuilder<ButtonBuilder>();
                ar.addComponents(bt);

                await channel.send({
                    content: "Click the button below to verify",
                    components: [ar],
                });

                return await interaction.editReply({ content: "Sent message." });
            }

            case "waitlist": {
                const page = interaction.options.getNumber("page", false) || 1;

                const totalPages =
                    (await client.db.userVerificationHistory.count({
                        where: { GuildId: interaction.guildId, Status: VerificationStatus.Waiting },
                    })) / 25;
                const ids = await client.db.userVerificationHistory.findMany({
                    where: { GuildId: interaction.guildId, Status: VerificationStatus.Waiting },
                    orderBy: { VerificationHistoryId: "desc" },
                    skip: (page - 1) * 25,
                    take: 25,
                });
                const idsForEmbed = await Promise.all(
                    ids.map(async (v) => {
                        const user = await client.users.fetch(v.UserId).catch(() => null);
                        return {
                            name: `${user ? `${user.username} (${user.id})` : v.UserId} - ${v.VerificationHistoryId}`,
                            value: `${time(v.CreatedAt, "F")} (${time(v.CreatedAt, "R")})`,
                        };
                    }),
                );

                const embed = new MeteoriumEmbedBuilder();
                embed.setTitle("Verification wait list");
                embed.setFields(idsForEmbed);
                embed.setFooter({ text: `Page: ${page}/${totalPages}` });

                return await interaction.editReply({ embeds: [embed] });
            }

            case "process": {
                const user = interaction.options.getUser("user", true);
                const targetHistoryData = await client.db.userVerificationHistory.findFirst({
                    where: { GuildId: interaction.guildId, UserId: user.id },
                    orderBy: { VerificationHistoryId: "desc" },
                });
                if (!targetHistoryData)
                    return await interaction.editReply({ content: "This user has never sent a verification request." });
                if (targetHistoryData.Status != VerificationStatus.Waiting)
                    return await interaction.editReply({
                        content: "This user's latest request has already been processed.",
                    });

                const embed = await client.dbUtils.generateUserVerificationDataEmbed(
                    interaction.guildId,
                    user.id,
                    interaction.user,
                );

                const btReject = new ButtonBuilder();
                btReject.setCustomId(`MeteoriumUserVerificationReject-${user.id}`);
                btReject.setLabel("Reject");
                btReject.setStyle(ButtonStyle.Danger);

                const btApprove = new ButtonBuilder();
                btApprove.setCustomId(`MeteoriumUserVerificationApprove-${user.id}`);
                btApprove.setLabel("Approve");
                btApprove.setStyle(ButtonStyle.Success);

                const ar = new ActionRowBuilder<ButtonBuilder>();
                ar.addComponents(btReject, btApprove);

                return await interaction.editReply({
                    content: "Processing the user's request - please check and approve or reject:",
                    embeds: [embed],
                    components: [ar],
                });
            }
        }
    },
};
