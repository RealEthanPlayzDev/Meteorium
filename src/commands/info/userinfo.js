// Thanks to Syjalo for https://github.com/Syjalo/Alex/blob/main/src/commands/info/userinfo.js, it helped

const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed, GuildMember, User } = require("discord.js");
const MeteoriumCommand = require("../../util/Command");

module.exports = new MeteoriumCommand("userinfo", "Returns information about the specified user", async (interaction, client) => {
    await interaction.deferReply()
    const parsed = [], parsefailed = [] // parsed users and parse failures
    let targetusers = [] // filled with userids/user mentions/usernames/usertag
    //if (interaction.options.getString("users")) { targetusers = targetusers.concat(interaction.options.getString("users").split(" ")) }
    if (targetusers.length === 0 && interaction.options.getString("users")) { targetusers = targetusers.concat(interaction.options.getString("users").split(",")) }
    if (targetusers.length === 0) { targetusers.push(interaction.user.id) }

    for (const tUserid of targetusers) {
        let member = undefined, user = undefined
        try {
            member = interaction.guild.members.resolve(tUserid.replace(/[<@!>]/g, '')) || interaction.guild.members.cache.find(tMember => tMember.user.username.toLowerCase() === tUserid.toLowerCase() || tMember.displayName.toLowerCase() === tUserid.toLowerCase() || tMember.user.tag === tUserid.toLowerCase());
            user = client.users.cache.find(tUser => tUser.username.toLowerCase() === tUserid.toLowerCase() || tUser.tag.toLowerCase() === tUserid.toLowerCase());
            if (!user) { user = await client.users.fetch(tUserid.toLowerCase()) }
        } catch {}
        if (member) { parsed.push(member) } else if (user) { parsed.push(user) } else { parsefailed.push(tUserid) }
    }

    let embeds = []

    // Turn into embeds
    for (const parseddata of parsed) {
        const embed = new MessageEmbed();
        if (parseddata instanceof GuildMember) {
            let status = "Unknown";
            if (parseddata.presence && parseddata.presence["status"]) {
                status = `${parseddata.presence.status} - ${parseddata.presence.clientStatus}`;
                if (status === "dnd") { status = `do not disturb - ${parseddata.presence.clientStatus}` }
            }
            embed.setDescription(String(parseddata))
                .setAuthor(parseddata.user.tag, null, `https://discordapp.com/users/${parseddata.user.id}`)
                .setThumbnail(parseddata.user.displayAvatarURL({ dynamic: true }))
                .setColor(parseddata.displayColor || "0099ff")
                .addFields(
                    { name: "Status", value: status },
                    { name: "UserId", value: parseddata.user.id },
                    { name: "Joined Discord at", value: `<t:${Math.round(parseddata.user.createdTimestamp / 1000)}:f>\n${parseddata.user.createdAt}\n(<t:${Math.round(parseddata.user.createdTimestamp / 1000)}:R>)` },
                    { name: "Joined this server at", value: `<t:${Math.round(parseddata.joinedTimestamp / 1000)}:f>\n(<t:${Math.round(parseddata.joinedTimestamp / 1000)}:R>)` },
                    { name: "Server Nitro Booster", value: `${parseddata.premiumSince ? `Booster since <t:${Math.round(parseddata.premiumSinceTimestamp / 1000)}:f> (<t:${Math.round(parseddata.premiumSinceTimestamp / 1000)}:R>)` : "Not a booster"}`},
                    { name: `Roles (${parseddata.roles.cache.filter(role => role.name !== "@everyone").size} in total without @everyone)`, value: parseddata.roles.cache.filter(role => role.name !== '@everyone').size ? (() => parseddata.roles.cache.filter(role => role.name !== '@everyone').sort((role1, role2) => role2.rawPosition - role1.rawPosition).map(role => role).join(', '))() : '———' },
                )
                .setFooter("Meteorium | Developed by RadiatedExodus (RealEthanPlayzDev)");
        } else if (parseddata instanceof User) {
            embed.setDescription(String(parseddata))
                .setAuthor(parseddata.tag, null, `https://discordapp.com/users/${parseddata.id}`)
                .setThumbnail(parseddata.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: "UserId", value: parseddata.id },
                    { name: "Joined Discord at", value: `<t:${Math.round(parseddata.createdTimestamp / 1000)}:f>\n${parseddata.createdAt}\n(<t:${Math.round(parseddata.createdTimestamp / 1000)}:R>)` }
                )
                .setColor("0099ff")
                .setFooter("Meteorium | Developed by RadiatedExodus (RealEthanPlayzDev)");
        }
        embeds.push(embed)
    }

    await interaction.editReply({content: `Successfully parsed ${parsed.length} users out of ${targetusers.length} total users (${parsefailed.length} failed)`, embeds: embeds});
}, new SlashCommandBuilder()
    .setName("userinfo")
    .setDescription("Returns information about the specified user")
    .addStringOption(option => option.setName("users").setDescription("Target user(s), if no users are specified, returns a information about yourself").setRequired(false)));