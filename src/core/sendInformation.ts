import { Client } from "@classes/Client"
import { default as coreConfig } from "@config/core.json" assert { type: "json" }
import { dirname } from "@discordx/importer"
import { Logger } from "@util/Logger"
import { EmbedBuilder, GuildTextBasedChannel, Message, ThreadChannel } from "discord.js"
import { ArgsOf, Discord, On } from "discordx"
import fs from "fs"
import { createResponsiblesEmbedText, getResponsibleUsers } from "./responsibleUsers"

let messageId = fs.readFileSync(`${dirname(import.meta.url)}/../messageId`).toString()
messageId = messageId.trim() === "" ? "0" : messageId

const logger = new Logger("Send")

export interface SendInfoOptions {
	client: Client
	embedText?: string
}

let sending = false

async function sendInformation({ client, embedText }: SendInfoOptions) {
	embedText ??= createResponsiblesEmbedText(getResponsibleUsers(client))

	const channel = <GuildTextBasedChannel | ThreadChannel | undefined>(
		client.channels.cache.get(coreConfig.channelId)
	)

	if (!channel) {
		logger.error(`Channel not found: ${coreConfig.channelId}`)
		sending = false
		return
	}

	// client.users.fetch("282541644484575233").then((user) => {
	// 	user.send({
	// 		embeds: [
	// 			new EmbedBuilder()
	// 				.setColor(0x2b2d31)
	// 				.setDescription(embedText!)
	// 				.setImage("https://i.imgur.com/PP6qCzW.png"),
	// 		],
	// 	})
	// })

	channel
		.send({
			embeds: [
				new EmbedBuilder()
					.setColor(0x2b2d31)
					.setDescription(embedText)
					.setImage("https://i.imgur.com/PP6qCzW.png"),
			],
		})
		.then((message) => {
			messageId = message.id

			fs.writeFileSync(`${dirname(import.meta.url)}/../messageId`, messageId)

			sending = false
		})
		.catch((error) => {
			logger.error("Can't send embed\n" + error)
		})
}

async function fetchCurrentInformationMessage(
	client: Client
): Promise<Message<boolean> | undefined> {
	try {
		return await (
			client.channels.cache.get(coreConfig.channelId) as GuildTextBasedChannel
		).messages.fetch(messageId)
	} catch {}
}

export function resendIfNeed(client: Client) {
	sending = true

	fetchCurrentInformationMessage(client).then((message) => {
		if (!message) {
			sendInformation({ client })
			return
		}

		const currentEmbedText = message?.embeds?.[0].data.description

		const newEmbedText = createResponsiblesEmbedText(getResponsibleUsers(client))

		if (currentEmbedText === newEmbedText) {
			sending = false
			return
		}

		message
			.delete()
			.then(() => {
				sendInformation({ client, embedText: newEmbedText })
			})
			.catch((error) => {
				logger.error("Can't delete current message\n" + error)
			})
	})
}

let guildsCached = false

@Discord()
export class Core {
	@On()
	async messageDelete(
		[message]: ArgsOf<"messageDelete">,
		client: Client
	): Promise<void> {
		if (!guildsCached) return

		if (message.id !== messageId) return

		if (sending) return

		resendIfNeed(client)
	}

	@On()
	async guildsCached([client]: [Client]) {
		guildsCached = true

		resendIfNeed(client)

		setInterval(
			() => {
				resendIfNeed(client)
			},
			10 * 60 * 1000
		)
	}
}

// @Discord()
// export class MessageDeleteHandler {
// 	@On()
// 	// @On({ event: "messageDelete" })
// 	async messageDelete(
// 		[message]: ArgsOf<"messageDelete">,
// 		client: Client
// 	): Promise<void> {
// 		if (message.id !== messageId) return

// 		resendIfNeed(client)
// 	}
// }
