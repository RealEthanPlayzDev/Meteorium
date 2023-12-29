export interface Textures {
    timestamp: string;
    profileId: string;
    profileName: string;
    signatureRequired?: true;
    textures: {
        SKIN?: {
            url: string;
            metadata?: { model: string };
        };
        CAPE?: { url: string };
    };
}

export interface ProfileResponse {
    id: string;
    name: string;
    properties: [
        {
            name: "textures";
            value: string;
            signature?: string;
        },
    ];
    profileActions: string[];
    legacy?: true;
}

export interface UUIDFromNameResponse {
    name: string;
    id: string;
    legacy?: true;
    demo?: true;
}
