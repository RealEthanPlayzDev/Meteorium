import { time } from "discord.js";
import MeteoriumEmbedBuilder from "../classes/embedBuilder.js";
import type { MeteoriumEvent } from "./eventsEntry.js";

export const Event: MeteoriumEvent<"guildMemberAdd"> = {
    event: "guildMemberAdd",
    async callback(client, member) {
        const guildSettings = await client.db.guild.findUnique({ where: { GuildId: member.guild.id } });
        if (!guildSettings) return;

        const embed = new MeteoriumEmbedBuilder();
        embed.setAuthor({ name: member.user.username, iconURL: member.displayAvatarURL({}) });
        embed.setTitle("Welcome!");
        embed.setDescription(`<@${member.user.id}> \`\`${member.user.username}\`\` (${member.user.id})`);
        embed.setFields([
            {
                name: "Account created at",
                value: `${time(member.user.createdAt, "F")} (${time(member.user.createdAt, "R")})`,
            },
            { name: "Account joined at", value: `${time(member.joinedAt!, "F")} (${time(member.joinedAt!, "R")})` },
        ]);
        embed.setColor("Green");

        const sendPromises: Promise<any>[] = [];

        if (guildSettings.LoggingChannelId != "") {
            const channel = await client.channels.fetch(guildSettings.LoggingChannelId).catch(() => null);
            if (channel && channel.isTextBased()) sendPromises.push(channel.send({ embeds: [embed] }));
        }

        if (guildSettings.JoinLeaveLogChannelId != "") {
            const channel = await client.channels.fetch(guildSettings.JoinLeaveLogChannelId).catch(() => null);
            if (channel && channel.isTextBased()) sendPromises.push(channel.send({ embeds: [embed] }));
        }

        await Promise.all(sendPromises);
        return;
    },
    once: false,
};
