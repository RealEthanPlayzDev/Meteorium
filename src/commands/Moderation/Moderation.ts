import { SlashCommandBuilder } from 'discord.js';
import type { MeteoriumCommand } from "..";
import { MeteoriumEmbedBuilder } from '../../util/MeteoriumEmbedBuilder';

export const Command: MeteoriumCommand = {
    InteractionData: new SlashCommandBuilder()
        .setName("moderation")
        .setDescription("Bot moderation utility command")
        .addSubcommandGroup(subcommandgroup => subcommandgroup.setName("userkick")
                                                              .setDescription("Kick-related functions")
                                                              .addSubcommand(subcommand => subcommand.setName("kick")
                                                                                                     .setDescription("Kicks a user")
                                                                                                     .addUserOption(option => option.setName("user").setDescription("The user to be kicked").setRequired(true))
                                                                                                     .addStringOption(option => option.setName("reason").setDescription("The reason on why the user was kicked"))
                                                                            )
                            )
        .addSubcommandGroup(subcommandgroup => subcommandgroup.setName("userban")
                                                              .setDescription("Ban-related functions")
                                                              .addSubcommand(subcommand => subcommand.setName("ban")
                                                                                                     .setDescription("Ban a user.")
                                                                                                     .addUserOption(option => option.setName("user").setDescription("The user to be banned").setRequired(true))
                                                                                                     .addStringOption(option => option.setName("reason").setDescription("The reason on why the user was banned")))
                                                              .addSubcommand(subcommand => subcommand.setName("unban")
                                                                                                     .setDescription("Unban a user.")
                                                                                                     .addIntegerOption(option => option.setName("userid").setDescription("The user to be unbanned").setRequired(true))
                                                                                                     .addStringOption(option => option.setName("reason").setDescription("The reason on why the user was unbanned")))
                                                              .addSubcommand(subcommand => subcommand.setName("list").setDescription("Returns a list of banned users."))
                            ),
    async Callback(interaction, client) {
        const Ephemeral = interaction.options.getBoolean("ephemeral", false) ? true : false;
        await interaction.deferReply({ ephemeral: Ephemeral });

        // Subcommand switch
        const SubcommandGroup = interaction.options.getSubcommandGroup(true);
        const Subcommand = interaction.options.getSubcommand(true);

        switch(SubcommandGroup) {
            case("userkick"): {
                if (!interaction.member.permissions.has("KickMembers")) return await interaction.editReply({ content: "You do not have permission to access the userkick panel. (Missing KickMembers permission)" });
                switch(Subcommand) {
                    case("kick"): {
                        const TargetUser = interaction.options.getUser("user", true);
                        const Reason = interaction.options.getString("reason", false) ? interaction.options.getString("reason", true) : `Kicked by ${interaction.user.tag}`;
                        await interaction.guild.members.kick(TargetUser, Reason);
                        return await interaction.editReply({ content: `Kicked user "${TargetUser.tag} (${TargetUser.id}) with reason "${Reason}"` });
                    }
                }
                break;
            }
            case("userban"): {
                if (!interaction.member.permissions.has("BanMembers")) return await interaction.editReply({ content: "You do not have permission to access the userban panel. (Missing BanMembers permission)" });
                switch(Subcommand) {
                    case("ban"): {
                        const TargetUser = interaction.options.getUser("user", true);
                        const Reason = interaction.options.getString("reason", false) ? interaction.options.getString("reason", true) : `Banned by ${interaction.user.tag}`;
                        await interaction.guild.members.ban(TargetUser, { reason: Reason });
                        return await interaction.editReply({ content: `Banned user ${TargetUser.tag} (${TargetUser.id}) with reason "${Reason}"` });
                    }
                    case("unban"): {
                        const TargetUserId = interaction.options.getInteger("userid", true);
                        const Reason = interaction.options.getString("reason", false) ? interaction.options.getString("reason", true) : `Unbanned by ${interaction.user.tag}`;
                        const TargetUser = await client.users.fetch(String(TargetUserId));
                        await interaction.guild.bans.remove(TargetUser, Reason);
                        return await interaction.editReply({ content: `Unbanned user "${TargetUser.tag} (${TargetUser.id}) with reason "${Reason}"` });
                    }
                    case("list"): {
                        const BanList = (await interaction.guild.bans.fetch({ limit: 25 })).map(user => `${user.user.tag} (${user.user.id})`);
                        return await interaction.editReply({
                            embeds: [
                                new MeteoriumEmbedBuilder(undefined, interaction.user)
                                    .setTitle("Banned users (1-25)")
                                    .setDescription(BanList.join("\n"))
                            ]
                        });
                    }
                }
                break;
            }
        }
        return;
    }
}