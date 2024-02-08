import { GuildMember, ContextMenuCommandBuilder, User, ApplicationCommandType } from "discord.js";
import type { MeteoriumUserContextMenuAction } from "..";
import { MeteoriumEmbedBuilder } from "../../util/MeteoriumEmbedBuilder";

export const ContextMenuAction: MeteoriumUserContextMenuAction = {
    Type: ApplicationCommandType.User,
    InteractionData: new ContextMenuCommandBuilder().setName("UserInfo").setType(ApplicationCommandType.User),
    async Callback(interaction) {
        const Embed = new MeteoriumEmbedBuilder(undefined, interaction.user);
        const ParsedUser = await interaction.guild.members
            .fetch(interaction.targetUser.id)
            .catch(() => interaction.targetUser);

        if (ParsedUser instanceof GuildMember) {
            // User status and is client device parsing
            let UserStatus = "Unknown";
            if (ParsedUser.presence && ParsedUser.presence["status"]) {
                const ClientStatus = `Desktop: ${ParsedUser.presence.clientStatus?.desktop || "N/A"} | Mobile: ${
                    ParsedUser.presence.clientStatus?.mobile || "N/A"
                } | Web: ${ParsedUser.presence.clientStatus?.web || "N/A"}`;
                if (ParsedUser.presence.status === "dnd") {
                    UserStatus = `do not disturb - ${ClientStatus}`;
                } else {
                    UserStatus = `${ParsedUser.presence.status} - ${ClientStatus}`;
                }
            }

            Embed.setDescription(String(ParsedUser))
                .setTitle(ParsedUser.user.tag)
                .setAuthor({
                    name: "Guild member",
                    url: `https://discordapp.com/users/${ParsedUser.user.id}`,
                })
                .setThumbnail(ParsedUser.user.displayAvatarURL())
                .setColor(ParsedUser.displayColor ? ParsedUser.displayColor : [0, 153, 255])
                .addFields([
                    { name: "Status", value: UserStatus },
                    { name: "UserId", value: ParsedUser.user.id },
                    {
                        name: "Joined Discord at",
                        value: `<t:${Math.round(ParsedUser.user.createdTimestamp / 1000)}:f>\n${
                            ParsedUser.user.createdAt
                        }\n(<t:${Math.round(ParsedUser.user.createdTimestamp / 1000)}:R>)`,
                    },
                ]);

            if (ParsedUser?.joinedTimestamp) {
                Embed.addFields([
                    {
                        name: "Joined this server at",
                        value: `<t:${Math.round(ParsedUser.joinedTimestamp / 1000)}:f>\n(<t:${Math.round(
                            ParsedUser.joinedTimestamp / 1000,
                        )}:R>)`,
                    },
                ]);
            }

            if (ParsedUser?.premiumSince && ParsedUser?.premiumSinceTimestamp) {
                Embed.addFields([
                    {
                        name: "Server Nitro Booster",
                        value: `${
                            ParsedUser.premiumSince
                                ? `Booster since <t:${Math.round(
                                      ParsedUser.premiumSinceTimestamp / 1000,
                                  )}:f> (<t:${Math.round(ParsedUser.premiumSinceTimestamp / 1000)}:R>)`
                                : "Not a booster"
                        }`,
                    },
                ]);
            }

            Embed.addFields([
                {
                    name: `Roles (${
                        ParsedUser.roles.cache.filter((role) => role.name !== "@everyone").size
                    } in total without @everyone)`,
                    value: ParsedUser.roles.cache.filter((role) => role.name !== "@everyone").size
                        ? (() =>
                              ParsedUser.roles.cache
                                  .filter((role) => role.name !== "@everyone")
                                  .sort((role1, role2) => role2.rawPosition - role1.rawPosition)
                                  .map((role) => role)
                                  .join(", "))()
                        : "———",
                },
            ]);
        } else if (ParsedUser instanceof User) {
            Embed.setDescription(String(ParsedUser))
                .setTitle(ParsedUser.tag)
                .setAuthor({
                    name: "User",
                    url: `https://discordapp.com/users/${ParsedUser.id}`,
                })
                .setThumbnail(ParsedUser.displayAvatarURL())
                .addFields([
                    { name: "UserId", value: ParsedUser.id },
                    {
                        name: "Joined Discord at",
                        value: `<t:${Math.round(ParsedUser.createdTimestamp / 1000)}:f>\n${
                            ParsedUser.createdAt
                        }\n(<t:${Math.round(ParsedUser.createdTimestamp / 1000)}:R>)`,
                    },
                ]);
        }

        return await interaction.reply({ embeds: [Embed], ephemeral: true });
    },
};
