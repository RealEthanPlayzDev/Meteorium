import { SlashCommandBuilder, userMention, time, channelMention } from "discord.js";
import type { MeteoriumCommand } from "..";
import { MeteoriumEmbedBuilder } from "../../util/MeteoriumEmbedBuilder";

export const Command: MeteoriumCommand = {
    InteractionData: new SlashCommandBuilder()
        .setName("serverinfo")
        .setDescription("Returns information about the current server")
        .addBooleanOption((option) =>
            option.setName("ephemeral").setDescription("If true, the response is only shown to you").setRequired(false),
        ),
    async Callback(interaction, client) {
        const Ephemeral = interaction.options.getBoolean("ephemeral", false) ? true : false;

        if (!interaction.guild.available)
            return await interaction.reply({
                content:
                    "The guild isn't available at the moment (usually caused by Discord's servers having a outage). Try again later.",
                ephemeral: Ephemeral,
            });

        await interaction.deferReply({ ephemeral: Ephemeral });

        const Guild = interaction.guild;
        const GuildOwner = await client.users.fetch(Guild.ownerId).catch(() => null);
        const GuildSetting = await client.Database.guild.findUnique({ where: { GuildId: Guild.id } });
        const TotalModCases = await client.Database.moderationCase.count({ where: { GuildId: Guild.id } });

        const MainEmbed = new MeteoriumEmbedBuilder(undefined, interaction.user)
            .setTitle(Guild.name)
            .setDescription(Guild.description != "" ? Guild.description : null)
            .setThumbnail(Guild.iconURL({ extension: "png", size: 1024 }))
            .setImage(Guild.bannerURL({ extension: "png" }))
            .setURL("https://discord.com")
            .addFields([
                { name: "Server id", value: Guild.id },
                {
                    name: "Server owner",
                    value: GuildOwner
                        ? `${GuildOwner.username} (${userMention(GuildOwner.id)} - ${GuildOwner.id})`
                        : interaction.guild.ownerId,
                },
                { name: "Member count", value: Guild.memberCount.toString() },
                { name: "Created at", value: `${time(Guild.createdAt, "F")} (${time(Guild.createdAt, "R")})` },
                {
                    name: "Rules channel",
                    value: Guild.rulesChannelId ? channelMention(Guild.rulesChannelId) : "Not set",
                },
                {
                    name: "Total boosts",
                    value: Guild.premiumSubscriptionCount ? Guild.premiumSubscriptionCount.toString() : "N/A",
                },
                { name: "Server boost tier", value: Guild.premiumTier ? Guild.premiumTier.toString() : "N/A" },
                { name: "Partner server", value: Guild.partnered ? "Yes" : "No" },
                { name: "Verified server", value: Guild.verified ? "Yes" : "No" },
                { name: "Vanity URL", value: Guild.vanityURLCode ? Guild.vanityURLCode : "N/A" },
                { name: "Recorded punishments/cases", value: TotalModCases.toString() },
                {
                    name: "Ban appeal link",
                    value: GuildSetting && GuildSetting.BanAppealLink != "" ? GuildSetting.BanAppealLink : "N/A",
                },
            ]);

        const SplashDiscoveryUrl = new MeteoriumEmbedBuilder()
            .setURL("https://discord.com")
            .setImage(Guild.discoverySplashURL({ extension: "png" }));

        return await interaction.editReply({ embeds: [MainEmbed, SplashDiscoveryUrl] });
    },
};
