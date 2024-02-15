import process from "node:process";
import util from "node:util";
import { ActivityType, codeBlock } from "discord.js";
import MeteoriumEmbedBuilder from "../classes/embedBuilder.js";
import type { MeteoriumEvent } from "./eventsEntry.js";
import moment from "moment";

export const Event: MeteoriumEvent<"ready"> = {
    event: "ready",
    async callback(client) {
        const readyNS = client.events.eventNS.getNamespace("ReadyInit");
        const runtimeNS = client.logging.getNamespace("Runtime");
        const startTime = new Date();
        const interJson = client.interactions.generateAppsJsonData();

        // Register to global interactions registry
        readyNS.info("Registering to global interactions registry");
        await client.application.commands.set(interJson);

        // Register to guild interactions registry
        client.config.ApplicationDeployGuildIds.forEach(async (guildId) => {
            const guild = await client.guilds.fetch(guildId).catch(() => null);
            if (!guild) return readyNS.error(`Cannot get guild ${guildId} for registering guild interactions registry`);
            readyNS.info(`Registering guild interactions registry -> ${guildId}`);
            await guild.commands.set(interJson);
        });

        // Set user presence
        readyNS.info("Setting client presence");
        client.user.setPresence({
            status: "idle",
            activities: [{ name: "no", type: ActivityType.Playing }],
        });

        // Hook to error events
        const uncaughtExceptionNS = runtimeNS.getNamespace("UncaughtException");
        const unhandledRejectionNS = runtimeNS.getNamespace("UnhandledRejection");
        process.on("uncaughtException", async (err) => {
            const inspected = util.inspect(err);
            const runtimeLogPromises: Promise<any>[] = [];
            uncaughtExceptionNS.error(inspected);

            const embed = new MeteoriumEmbedBuilder()
                .setTitle("Uncaught exception occurred")
                .setDescription(codeBlock(inspected.substring(0, 4500)))
                .setErrorColor();

            client.config.RuntimeLogChannelIds.forEach(async (channelId) => {
                const channel = await client.channels.fetch(channelId).catch(() => null);
                if (!channel || !channel.isTextBased())
                    return uncaughtExceptionNS.warn(`could not send log to ${channelId}`);
                return runtimeLogPromises.push(channel.send({ embeds: [embed] }));
            });

            await Promise.all(runtimeLogPromises);
            await client.destroy();
            return process.exit(1);
        });
        process.on("unhandledRejection", async (err: Error | any) => {
            const inspected = util.inspect(err);
            const runtimeLogPromises: Promise<any>[] = [];
            unhandledRejectionNS.error(inspected);

            const embed = new MeteoriumEmbedBuilder()
                .setTitle("Unhandled rejection occurred")
                .setDescription(codeBlock(inspected.substring(0, 4500)))
                .setErrorColor();

            client.config.RuntimeLogChannelIds.forEach(async (channelId) => {
                const channel = await client.channels.fetch(channelId).catch(() => null);
                if (!channel || !channel.isTextBased())
                    return unhandledRejectionNS.warn(`could not send log to ${channelId}`);
                return runtimeLogPromises.push(channel.send({ embeds: [embed] }));
            });

            await Promise.all(runtimeLogPromises);
            await client.destroy();
            return process.exit(1);
        });

        // Exit handling
        const exitNS = runtimeNS.getNamespace("Exit");
        async function exitHandler() {
            exitNS.info("Bot shutting down!");
            const runtimeLogPromises: Promise<any>[] = [];
            const embed = new MeteoriumEmbedBuilder()
                .setTitle("Bot is shutting down")
                .setDescription("The bot is now shutting down... (SIGTERM/SIGINT)")
                .addFields([
                    { name: "Started at", value: moment(startTime).format("DD-MM-YYYY hh:mm:ss:SSS A Z") },
                    { name: "Shutted down at", value: moment().format("DD-MM-YYYY hh:mm:ss:SSS A Z") },
                ])
                .setErrorColor();

            client.config.RuntimeLogChannelIds.forEach(async (channelId) => {
                const channel = await client.channels.fetch(channelId).catch(() => null);
                if (!channel || !channel.isTextBased()) return exitNS.warn(`could not send log to ${channelId}`);
                return runtimeLogPromises.push(channel.send({ embeds: [embed] }));
            });

            await Promise.all(runtimeLogPromises);
            await client.destroy();
            return process.exit(0);
        }
        process.on("SIGTERM", exitHandler);
        process.on("SIGINT", exitHandler);

        // Send ready message
        readyNS.info("Bot ready");
        const runtimeLogPromises: Promise<any>[] = [];
        const embed = new MeteoriumEmbedBuilder()
            .setTitle("Bot is online")
            .setDescription("The bot is now online")
            .addFields([{ name: "Started at", value: moment(startTime).format("DD-MM-YYYY hh:mm:ss:SSS A Z") }])
            .setNormalColor();

        client.config.RuntimeLogChannelIds.forEach(async (channelId) => {
            const channel = await client.channels.fetch(channelId).catch(() => null);
            if (!channel || !channel.isTextBased()) return readyNS.warn(`could not send log to ${channelId}`);
            return runtimeLogPromises.push(channel.send({ embeds: [embed] }));
        });

        await Promise.all(runtimeLogPromises);

        return;
    },
    once: true,
};
