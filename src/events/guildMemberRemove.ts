import type { MeteoriumEvent } from ".";
import { MeteoriumEmbedBuilder } from "../util/MeteoriumEmbedBuilder";
import { GenerateFormattedTime } from "../util/Utilities";

export const Event: MeteoriumEvent<"guildMemberRemove"> = {
    async Callback(client, member) {
        const GuildSchema = (await client.Database.guild.findUnique({ where: { GuildId: member.guild.id } }))!;
        if (!GuildSchema) return;
        if (GuildSchema.JoinLeaveLogChannelId == "") return;

        const LogEmbed = new MeteoriumEmbedBuilder()
            .setAuthor({
                name: member.user.username,
                iconURL: member.user.displayAvatarURL({ extension: "png" })
            })
            .setTitle("Left!")
            .setDescription(`<@${member.user.id}> \`\`${member.user.username}\`\` (${member.user.id})`)
            .setFields([
                { name: "Created the account at", value: GenerateFormattedTime(member.user.createdAt) },
                { name: "Joined the server at", value: GenerateFormattedTime(member.joinedAt!) }
            ])
            .setColor("Red")

        const JLLChannel = await member.guild.channels.fetch(GuildSchema.JoinLeaveLogChannelId);
        if (JLLChannel && JLLChannel.isTextBased()) await JLLChannel.send({ embeds: [ LogEmbed ] });

        const VLChannel = await member.guild.channels.fetch(GuildSchema.LoggingChannelId);
        if (VLChannel && VLChannel.isTextBased()) await VLChannel.send({ embeds: [ LogEmbed ] });
        
        return;
    },
};
