module.exports = {
    name: "ready",
    once: false,
    async execute(client) {
        client.user.setPresence({
            status: "idle",
            activity: {
                name: "no",
                type: "PLAYING"
            }
        })
        console.log("Successfully set the activity");
    }
}