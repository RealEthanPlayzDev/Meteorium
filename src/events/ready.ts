import type { MeteoriumEvent } from ".";
import { ActivityType, REST, Routes, codeBlock } from "discord.js";
import moment from "moment";
import { inspect } from "util";
import { MeteoriumEmbedBuilder } from "../util/MeteoriumEmbedBuilder";

export const Event: MeteoriumEvent<"ready"> = {
    async Callback(client) {
        const readyNS = client.Logging.GetNamespace("Events/ready");
        const StartTime = moment().format("DD-MM-YYYY hh:mm:ss:SSS A Z");
        const CommandsMapped = client.Commands.map((Command) => Command.InteractionData.toJSON());

        readyNS.info("Registering global slash commands at Discord");
        await client.application.commands.set(CommandsMapped); // Global slash commands

        readyNS.info("Registering guild slash commands at Discord");
        const Rest = new REST({ version: "10" });
        Rest.setToken(client.token);
        client.Config.InteractionFirstDeployGuildIds.forEach(async (guildId) => {
            readyNS.info(`Registering guild slash commands -> ${guildId}`);
            await Rest.put(Routes.applicationGuildCommands(client.Config.DiscordApplicationId, guildId), {
                body: CommandsMapped,
            }).catch((e) => {
                readyNS.error(`Failed while registering guild slash commands for guild ${guildId}:\n${e}`);
            });
        });

        readyNS.verbose("Setting user presence");
        client.user.setPresence({
            status: "idle",
            activities: [{ name: "no", type: ActivityType.Playing }],
        });

        readyNS.info("Bot ready");

        async function ExitHandler() {
            readyNS.info("Bot is shutting down!");
            const Promises: Promise<any>[] = [];
            const ShutdownEmbed = new MeteoriumEmbedBuilder()
                .setTitle("Bot shutting down")
                .setDescription("The bot is now shutting down...")
                .addFields([
                    { name: "Start time", value: StartTime },
                    { name: "Shut down time", value: moment().format("DD-MM-YYYY hh:mm:ss:SSS A Z") },
                ])
                .setColor("Red");
            for (const ChannelId of client.Config.RuntimeLogChannelIds) {
                const Channel = await client.channels.fetch(ChannelId).catch(() => null);

                if (Channel && Channel.isTextBased())
                    Promises.push(
                        Channel.send({
                            embeds: [ShutdownEmbed],
                        }),
                    );
            }
            await Promise.all(Promises);
            client.destroy();
            process.exit(0);
        }

        process.on("SIGTERM", ExitHandler);
        process.on("SIGINT", ExitHandler);

        process.on("uncaughtException", async (err) => {
            const Promises: Promise<any>[] = [];
            const ErrorEmbed = new MeteoriumEmbedBuilder()
                .setTitle("Uncaught exception occured")
                .setDescription(codeBlock(inspect(err).substring(0, 4500)))
                .setColor("Red");

            for (const ChannelId of client.Config.RuntimeLogChannelIds) {
                const Channel = await client.channels.fetch(ChannelId).catch(() => null);
                if (Channel && Channel.isTextBased())
                    Promises.push(
                        Channel.send({
                            embeds: [ErrorEmbed],
                        }),
                    );
            }
            await Promise.all(Promises);
        });

        process.on("unhandledRejection", async (err) => {
            const Promises: Promise<any>[] = [];
            const ErrorEmbed = new MeteoriumEmbedBuilder()
                .setTitle("Unhandled rejection occured")
                .setDescription(codeBlock(inspect(err).substring(0, 4500)))
                .setColor("Red");

            for (const ChannelId of client.Config.RuntimeLogChannelIds) {
                const Channel = await client.channels.fetch(ChannelId).catch(() => null);
                if (Channel && Channel.isTextBased())
                    Promises.push(
                        Channel.send({
                            embeds: [ErrorEmbed],
                        }),
                    );
            }
            await Promise.all(Promises);
        });

        const ReadyEmbedPromises: Promise<any>[] = [];
        const ReadyEmbed = new MeteoriumEmbedBuilder()
            .setTitle("Bot online")
            .setDescription("The bot is now online")
            .addFields([{ name: "Start time", value: StartTime }])
            .setColor("Green");

        for (const ChannelId of client.Config.RuntimeLogChannelIds) {
            const Channel = await client.channels.fetch(ChannelId).catch(() => null);
            if (Channel && Channel.isTextBased())
                ReadyEmbedPromises.push(
                    Channel.send({
                        embeds: [ReadyEmbed],
                    }),
                );
        }

        await Promise.all(ReadyEmbedPromises);

        return;
    },
};
