import { Client } from "@classes/Client"
// import { resendIfNeed } from "@core/sendInformation"
import { Logger } from "@util/Logger"
import { Events, IntentsBitField } from "discord.js"
import dotenv from "dotenv"
import { dirname, importx } from "@discordx/importer"
dotenv.config()

const logger = new Logger("Client")

process.on("unhandledRejection", (error) => {
	logger.error("Unhandled rejection\n", error)
})

process.on("uncaughtException", (error) => {
	logger.error("Uncaught excpetion\n", error)
})

export const client = new Client({
	botGuilds: [(client) => client.guilds.cache.map((guild) => guild.id)],

	intents: [
		IntentsBitField.Flags.Guilds,
		IntentsBitField.Flags.GuildMembers,
		// IntentsBitField.Flags.GuildModeration,
		// IntentsBitField.Flags.GuildEmojisAndStickers,
		// IntentsBitField.Flags.GuildIntegrations,
		// IntentsBitField.Flags.GuildWebhooks,
		// IntentsBitField.Flags.GuildInvites,
		// IntentsBitField.Flags.GuildVoiceStates,
		// IntentsBitField.Flags.GuildPresences,
		IntentsBitField.Flags.GuildMessages,
		// IntentsBitField.Flags.GuildMessageReactions,
		// IntentsBitField.Flags.GuildMessageTyping,
		// IntentsBitField.Flags.DirectMessages,
		// IntentsBitField.Flags.DirectMessageReactions,
		// IntentsBitField.Flags.DirectMessageTyping,
		IntentsBitField.Flags.MessageContent,
		// IntentsBitField.Flags.GuildScheduledEvents,
		// IntentsBitField.Flags.AutoModerationConfiguration,
		// IntentsBitField.Flags.AutoModerationExecution,
	],

	silent: false,

	// simpleCommand: {
	// 	prefix: "}",
	// },

	logger,
})

client.on(Events.ShardError, (error) => {
	logger.error("A websocket connection encountered an error\n", error)
})

client.once("ready", async () => {
	logger.success(client.user?.tag ?? client.botId)

	await client.guilds.fetch()

	await Promise.all(
		client.guilds.cache.map(async (guild) => {
			// await guild.channels.fetch()
			await guild.roles.fetch()
			await guild.members.fetch()
		})
	)

	logger.success("All Guilds cached")

	client.emit("guildsCached", client)
})

async function run() {
	if (!process.env.TOKEN) {
		throw Error("Could not find TOKEN in your environment")
	}

	await importx(`${dirname(import.meta.url)}/core/sendInformation.{ts,js}`)

	await client.login(process.env.TOKEN)
}

void run()
