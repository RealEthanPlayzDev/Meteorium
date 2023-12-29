import axios from "axios";

import * as proto from "./Proto";

export async function getUUIDFromName(name: string) {
    const res = await axios.get(`https://api.mojang.com/users/profiles/minecraft/${name}`);
    return { code: res.status, data: res.data as proto.UUIDFromNameResponse };
}

export async function getProfile(uuid: string) {
    const res = await axios.get(`https://sessionserver.mojang.com/session/minecraft/profile/${encodeURIComponent(uuid)}`);
    return { code: res.status, data: res.data as proto.ProfileResponse };
}

export function decodeTexturesB64(texturesb64: string) {
    const bf = Buffer.from(texturesb64, "base64");
    return JSON.parse(bf.toString()) as proto.Textures;
}

export function decodeDefaultSkin(uuid: string): "steve" | "alex" {
    const chars = uuid.split("");
    // @ts-ignore
    const lsbs_even = parseInt(chars[ 7], 16) ^ parseInt(chars[15], 16) ^ parseInt(chars[23], 16) ^ parseInt(chars[31], 16);
    return lsbs_even ? "alex" : "steve";
}