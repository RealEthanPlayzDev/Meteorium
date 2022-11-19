import { MongoClient } from "mongodb";
import type { Collection, MongoClientOptions } from "mongodb";

interface GuildSetting {
    GuildId: string,
    EnforceSayinExecutor: boolean,
    DisabledCommands: string[],
    DisabledCommandCategories: string[],
    MuteRoleId: string
}

export class MeteoriumDatabase extends MongoClient {
    public Guilds: Collection<GuildSetting>;
    public constructor(uri: string, options?: MongoClientOptions) {
        super(uri, options);
        this.Guilds = super.db().collection<GuildSetting>("GuildSetting")
    }
}