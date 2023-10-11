import { GuildMember, SlashCommandBuilder, User } from "discord.js";
import type { MeteoriumCommand } from "..";
import { MeteoriumEmbedBuilder } from "../../util/MeteoriumEmbedBuilder";

export const Command: MeteoriumCommand = {
    InteractionData: new SlashCommandBuilder()
        .setName("userinfo")
        .setDescription("Returns information about the specified user(s)")
        .addUserOption((option) =>
            option
                .setName("user")
                .setDescription("The target user, to use userids or multiple users, use the users option instead")
                .setRequired(false),
        )
        .addStringOption((option) =>
            option.setName("users").setDescription("The target user(s), accepts userid and user mention"),
        )
        .addBooleanOption((option) =>
            option.setName("ephemeral").setDescription("If true, the response is only shown to you").setRequired(false),
        ),
    async Callback(interaction, client) {
        const Ephemeral = interaction.options.getBoolean("ephemeral", false) ? true : false;
        await interaction.deferReply({ ephemeral: Ephemeral });

        const ParsedUsers = [];
        const ParseFailedUsers = [];
        const Embeds = [];
        let TargetParseUsers = [];

        // If the user option was specified, add it to the target user(s) to be parsed
        if (interaction.options.getUser("user", false)) {
            TargetParseUsers.push(interaction.options.getUser("user", true).id);
        }

        // If the users option was specified, parse it and add the user(s) to the target user(s) to be parsed
        if (interaction.options.getString("users", false)) {
            TargetParseUsers = TargetParseUsers.concat(interaction.options.getString("users", true).split(","));
        }

        // If nothing is in the target user(s) to be parsed, add the interaction executor's user
        if (TargetParseUsers.length === 0) {
            TargetParseUsers.push(interaction.user.id);
        }

        // Parsing the targets into a member/user object
        for (const TargetParseUser of TargetParseUsers) {
            let Member;
            let User;
            try {
                Member =
                    interaction.guild.members.resolve(TargetParseUser.replace(/[<@!>]/g, "")) ||
                    interaction.guild.members.cache.find(
                        (tMember) =>
                            tMember.user.username.toLowerCase() === TargetParseUser.toLowerCase() ||
                            tMember.displayName.toLowerCase() === TargetParseUser.toLowerCase() ||
                            tMember.user.tag === TargetParseUser.toLowerCase(),
                    );
                User = client.users.cache.find(
                    (tUser) =>
                        tUser.username.toLowerCase() === TargetParseUser.toLowerCase() ||
                        tUser.tag.toLowerCase() === TargetParseUser.toLowerCase(),
                );
                if (!User) User = await client.users.fetch(TargetParseUser.toLowerCase());
            } catch {}
            if (Member) {
                ParsedUsers.push(Member);
            } else if (User) {
                ParsedUsers.push(User);
            } else {
                ParseFailedUsers.push(TargetParseUser);
            }
        }

        for (const ParsedUser of ParsedUsers) {
            const Embed = new MeteoriumEmbedBuilder(undefined, interaction.user);

            if (ParsedUser instanceof GuildMember) {
                // User status and is client device parsing
                let UserStatus = "Unknown";
                if (ParsedUser.presence && ParsedUser.presence["status"]) {
                    if (ParsedUser.presence.status === "dnd") {
                        UserStatus = `do not disturb - ${ParsedUser.presence.clientStatus}`;
                    } else {
                        UserStatus = `${ParsedUser.presence.status} - ${ParsedUser.presence.clientStatus}`;
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
            Embeds.push(Embed);
        }
        return interaction.editReply({
            content: `Successfully parsed ${ParsedUsers.length} users out of ${TargetParseUsers.length} total users (${ParseFailedUsers.length} failed)`,
            embeds: Embeds,
        });
    },
};
