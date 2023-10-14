import { time } from "discord.js";

export function GenerateFormattedTime(inputTime: Date | number = new Date()) {
    const date = typeof inputTime === "number" ? new Date(Math.floor(inputTime)) : inputTime;
    return `${time(date)} (${time(date, 'R')})`;
}