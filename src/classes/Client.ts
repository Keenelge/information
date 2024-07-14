import { bgRed, blue, cyan, gray, green, magenta, red, yellow } from "@util/Colors"
import {
	AnySelectMenuInteraction,
	ApplicationCommand,
	ApplicationCommandOptionType,
	ApplicationCommandType,
	AutocompleteInteraction,
	ButtonInteraction,
	Client as Client$1,
	CommandInteraction,
	ContextMenuCommandInteraction,
	Guild,
	InteractionType,
	ModalSubmitInteraction,
} from "discord.js"
import {
	ApplicationCommandMixin,
	Client as Client$2,
	ClientOptions,
	DApplicationCommand,
	DApplicationCommandOption,
	DComponent,
	DIService,
	isApplicationCommandEqual,
	resolveIGuilds,
	SimpleCommandOptionType,
} from "discordx"
import type { Logger } from "@util/Logger"

type InitCommandOptions = {
	disable?:
		| {
				/**
				 * Disable the add operation, which registers application commands with Discord
				 */
				add?: boolean
				/**
				 * Disable the delete operation, which unregister application commands with Discord
				 */
				delete?: boolean
				/**
				 * Disable the update operation, which update application commands with Discord
				 */
				update?: boolean
		  }
		| true
}

function coloredCustomID(str: string | RegExp) {
	if (!(str instanceof RegExp)) return green(str.toString())

	return red(str.toString())
}

const printThings = (
	logger: Logger,
	baseName: string,
	things: readonly any[],
	idKey: string,
	idColorFunction: Function,
	isContextMenu?: boolean
) => {
	logger.log(`● ${baseName}`)
	if (things.length) {
		things.forEach((thing, thingIndex) => {
			if (isContextMenu)
				logger.log(
					`${thingIndex === things.length - 1 ? "└" : "├"} ${green(thing.name)}: ${yellow(ApplicationCommandType[thing.type])} (${cyan(`${thing.classRef.name}.${thing.key}`)})`
				)
			else
				logger.log(
					`${thingIndex === things.length - 1 ? "└" : "├"} ${idColorFunction(thing[idKey])} (${cyan(`${thing.classRef.name}.${thing.key}`)})`
				)
		})
	} else {
		logger.log(`└ ${gray("Nothing")}`)
	}
	logger.log("")
}

const printApplicatonCommands = ({ logger, applicationCommands, botId }: Client) => {
	logger.log("● Application Commands")
	applicationCommands = applicationCommands.filter(
		(cmd) => cmd.type === ApplicationCommandType.ChatInput
	)
	if (applicationCommands.length) {
		applicationCommands.forEach((cmd, cmdIndex) => {
			if (cmd.botIds.length && !cmd.botIds.includes(botId)) {
				return
			}

			const isLastCommand = cmdIndex === applicationCommands.length - 1

			logger.log(
				`${isLastCommand ? "└" : "├"} ${green(cmd.name)}: ${yellow(ApplicationCommandType[cmd.type])} (${cyan(`${cmd.classRef.name}`)})`
			)

			const printOptions = (
				options: DApplicationCommandOption[],
				isOptions: boolean = false,
				isLastSubCommand: boolean = false
			) => {
				if (!options) {
					return
				}

				options.forEach((option, optionIndex) => {
					logger.log(
						`${isLastCommand ? " " : "│"} ${isOptions ? `${isLastSubCommand ? " " : "│"} ` : ""}${optionIndex === options.length - 1 ? "└" : "├"} ${(option.type !== ApplicationCommandOptionType.Subcommand ? magenta : green)(option.name)}: ${yellow(ApplicationCommandOptionType[option.type])} (${cyan(`${option.classRef.name}.${option.key}`)})`
					)
					printOptions(
						option.options,
						true,
						optionIndex == cmd.options.length - 1
					)
				})
			}
			printOptions(cmd.options)
		})
	} else {
		logger.log(`└ ${gray("Nothing")}`)
	}
	logger.log("")
}

const printSimpleCommands = ({ logger, simpleCommands }: Client) => {
	logger.log(`● Simple Commands`)
	if (simpleCommands.length) {
		simpleCommands.forEach((cmd, cmdIndex) => {
			const isLast = cmdIndex === simpleCommands.length - 1

			logger.log(
				`${isLast ? "└" : "├"} ${green(cmd.name)} (${cyan(`${cmd.classRef.name}.${cmd.key}`)})`
			)

			if (cmd.options) {
				for (
					let optionIndex = cmd.options.length - 1;
					optionIndex >= 0;
					optionIndex--
				) {
					const option = cmd.options[optionIndex]

					logger.log(
						`${isLast ? " " : "│"} ${optionIndex === cmd.options.length - 1 && !cmd.aliases.length ? "└" : "├"} ${magenta(option.name)}: ${yellow(SimpleCommandOptionType[option.type])} (${cyan(`${option.classRef.name}.${option.key}`)})`
					)
				}
				// cmd.options.forEach((option, optionIndex) => {
				// 	logger.log(
				// 		`│ ${optionIndex === cmd.options.length - 1 && !cmd.aliases.length ? "└" : "├"} ${magenta(option.name)}: ${yellow(SimpleCommandOptionType[option.type])} (${cyan(`${option.classRef.name}.${option.key}`)})`
				// 	)
				// })
			}

			if (cmd.aliases.length) {
				logger.log(`${isLast ? " " : "│"} └ ${blue("Aliases")}`)
				cmd.aliases.forEach((alias, aliasIndex) => {
					logger.log(
						`${isLast ? " " : "│"}   ${aliasIndex === cmd.aliases.length - 1 ? "└" : "├"} ${green(alias)}`
					)
				})
			}
		})
	} else {
		logger.log(`└ ${gray("Nothing")}`)
	}
	logger.log("")
}

function wait(ms: number) {
	return new Promise((res) => setTimeout(res, ms))
}

// @ts-ignore
export class Client extends Client$2 {
	logger: Logger
	declare guild: Guild

	constructor(options: ClientOptions) {
		super(options)

		this.logger = options.logger as Logger
	}

	async login(token: string) {
		await this.build()

		!this.silent && this.logger.log(`Connecting to Discord...`)

		return Client$1.prototype.login.call(this, token)
		// if (this.silent) return Client$1.prototype.login.call(this, token)
		// this.logger.log(cyan(`Connecting to Discord...`))
		// return new Promise(async (resolve: (value: string) => void, reject) => {
		// 	const result = await Client$1.prototype.login.call(this, token)
		// 	resolve(result)
		// })
	}
	printDebug() {
		if (!this.instance.isBuilt) {
			this.logger.error(
				`Build the app before running this method with ${cyan("client.build()")}`
			)
			return
		}
		printThings(this.logger, "Events", this.events, "event", green)
		printThings(this.logger, "Buttons", this.buttonComponents, "id", coloredCustomID)
		printThings(
			this.logger,
			"Select Menus",
			this.selectMenuComponents,
			"id",
			coloredCustomID
		)
		printThings(this.logger, "Modals", this.modalComponents, "id", coloredCustomID)
		printThings(this.logger, "Reactions", this.reactions, "emoji", green)
		printThings(
			this.logger,
			"Context Menus",
			this.applicationCommandUsers.concat(this.applicationCommandMessages),
			"name",
			green,
			true
		)
		printApplicatonCommands(this)
		printSimpleCommands(this)
	}

	async initApplicationCommands(options?: {
		global?: InitCommandOptions
		guild?: InitCommandOptions
	}): Promise<void> {
		const allGuildPromises: Promise<void>[] = []
		const guildDCommandStore = await this.CommandByGuild()

		// run task to add/update/delete slashes for guilds
		guildDCommandStore.forEach((DCommands, guildId) => {
			// If bot is not in guild, skip it
			const guild = this.guilds.cache.get(guildId)
			if (!guild) {
				return
			}

			allGuildPromises.push(
				this.initGuildApplicationCommands(guildId, DCommands, options?.guild)
			)
		})

		await Promise.all([
			Promise.all(allGuildPromises),
			this.initGlobalApplicationCommands(options?.global),
		])
	}

	async initGuildApplicationCommands(
		guildId: string,
		DCommands: DApplicationCommand[],
		options?: InitCommandOptions
	): Promise<void> {
		if (options?.disable === true) {
			this.logger.log(`${red("Guild Application Commands Disabled")}`)
			return
		}

		const botResolvedGuilds = await this.botResolvedGuilds
		const guild = this.guilds.cache.get(guildId)
		if (!guild) {
			this.logger.warn(
				`initGuildApplicationCommands: skipped due to guild ${yellow(guildId)} unavailable`
			)
			return
		}
		const ApplicationCommands = await guild.commands.fetch({
			withLocalizations: true,
		})
		const commandsToAdd = DCommands.filter(
			(DCommand) =>
				!ApplicationCommands.find(
					(cmd) => cmd.name === DCommand.name && cmd.type === DCommand.type
				)
		)
		const commandsToUpdate: ApplicationCommandMixin[] = []
		const commandsToSkip: ApplicationCommandMixin[] = []
		DCommands.forEach((DCommand) => {
			const findCommand = ApplicationCommands.find(
				(cmd) => cmd.name === DCommand.name && cmd.type === DCommand.type
			)
			if (!findCommand) {
				return
			}
			if (!isApplicationCommandEqual(findCommand, DCommand, true)) {
				commandsToUpdate.push(new ApplicationCommandMixin(findCommand, DCommand))
			} else {
				commandsToSkip.push(new ApplicationCommandMixin(findCommand, DCommand))
			}
		})
		const commandsToDelete: ApplicationCommand[] = []
		await Promise.all(
			ApplicationCommands.map(async (cmd) => {
				const DCommandFind = DCommands.find(
					(DCommand) => DCommand.name === cmd.name && DCommand.type === cmd.type
				)
				if (!DCommandFind) {
					commandsToDelete.push(cmd)
					return
				}
				// @ts-ignore
				const guilds = await resolveIGuilds(this, DCommandFind, [
					...botResolvedGuilds,
					...DCommandFind.guilds,
				])
				if (!cmd.guildId || !guilds.includes(cmd.guildId)) {
					commandsToDelete.push(cmd)
					return
				}
			})
		)
		if (!this.silent) {
			this.logger.log(
				`Processing Guild Application Commands | ${green(guild.name)} [${yellow(guild.id)}]`
			)

			this.logger.log(`● Add ${yellow(`(${commandsToAdd.length})`)}`)
			if (options?.disable?.add) this.logger.log(`└ ${bgRed("Task Disabled")}`)
			else
				commandsToAdd.forEach((cmd, cmdIndex) => {
					this.logger.log(
						`${cmdIndex === commandsToAdd.length - 1 ? "└" : "├"} ${cmd.name}`
					)
				})

			this.logger.log(`● Update ${yellow(`(${commandsToUpdate.length})`)}`)
			if (options?.disable?.update) this.logger.log(`└ ${bgRed("Task Disabled")}`)
			else
				commandsToUpdate.forEach((cmd, cmdIndex) => {
					this.logger.log(
						`${cmdIndex === commandsToUpdate.length - 1 ? "└" : "├"} ${cmd.command.name}`
					)
				})

			this.logger.log(`● Delete ${yellow(`(${commandsToDelete.length})`)}`)
			if (options?.disable?.delete) this.logger.log(`└ ${bgRed("Task Disabled")}`)
			else
				commandsToDelete.forEach((cmd, cmdIndex) => {
					this.logger.log(
						`${cmdIndex === commandsToDelete.length - 1 ? "└" : "├"} ${cmd.name}`
					)
				})

			this.logger.log(`● Skip ${yellow(`(${commandsToSkip.length})`)}`)
			commandsToSkip.forEach((cmd, cmdIndex) => {
				this.logger.log(
					`${cmdIndex === commandsToSkip.length - 1 ? "└" : "├"} ${cmd.name}`
				)
			})
		}
		if (
			commandsToAdd.length + commandsToUpdate.length + commandsToDelete.length ===
			0
		) {
			return
		}
		const bulkUpdate: any[] = []
		const operationToSkip = commandsToSkip.map((cmd) =>
			bulkUpdate.push(cmd.instance.toJSON())
		)
		const operationToAdd = options?.disable?.add
			? []
			: commandsToAdd.map((DCommand) => bulkUpdate.push(DCommand.toJSON()))
		const operationToUpdate = options?.disable?.update
			? commandsToUpdate.map(async (cmd) =>
					bulkUpdate.push(await cmd.command.toJSON())
				)
			: commandsToUpdate.map((cmd) => bulkUpdate.push(cmd.instance.toJSON()))
		const operationToDelete = options?.disable?.delete
			? commandsToDelete.map(async (cmd) => bulkUpdate.push(await cmd.toJSON()))
			: []
		await Promise.all([
			// skipped
			...operationToSkip,
			// add
			...operationToAdd,
			// update
			...operationToUpdate,
			// delete
			...operationToDelete,
		])

		try {
			await guild.commands.set(bulkUpdate)
			!this.silent && this.logger.success("Application Commands ready")
		} catch (error) {
			this.logger.error(`Application Commands error:\n${error}`)
		}
	}
	async initGlobalApplicationCommands(options?: InitCommandOptions) {
		if (options?.disable === true) {
			this.logger.log(`${red("Global Application Commands Disabled")}`)
			return
		}

		const botResolvedGuilds = await this.botResolvedGuilds
		if (!this.application) {
			throw Error(
				"The client is not yet ready, connect to discord before fetching commands"
			)
		}
		const ApplicationCommands = (await this.application.commands.fetch())?.filter(
			(cmd) => !cmd.guild
		)
		const DCommands = this.applicationCommands.filter(
			(DCommand) =>
				![...botResolvedGuilds, ...DCommand.guilds].length &&
				(!DCommand.botIds.length || DCommand.botIds.includes(this.botId))
		)
		const commandsToAdd = DCommands.filter(
			(DCommand) =>
				!ApplicationCommands.find(
					(cmd) => cmd.name === DCommand.name && cmd.type === DCommand.type
				)
		)
		const commandsToUpdate: ApplicationCommandMixin[] = []
		const commandsToSkip: ApplicationCommandMixin[] = []
		DCommands.forEach((DCommand) => {
			const findCommand = ApplicationCommands.find(
				(cmd) => cmd.name === DCommand.name && cmd.type === DCommand.type
			)
			if (!findCommand) {
				return
			}
			if (!isApplicationCommandEqual(findCommand, DCommand)) {
				commandsToUpdate.push(new ApplicationCommandMixin(findCommand, DCommand))
			} else {
				commandsToSkip.push(new ApplicationCommandMixin(findCommand, DCommand))
			}
		})
		const commandsToDelete = ApplicationCommands.filter((cmd) =>
			DCommands.every(
				(DCommand) => DCommand.name !== cmd.name || DCommand.type !== cmd.type
			)
		)
		if (!this.silent) {
			this.logger.log(`Processing Global Application Commands`)

			this.logger.log(`● Add ${yellow(`(${commandsToAdd.length})`)}`)
			if (options?.disable?.add) this.logger.log(`└ ${bgRed("Task Disabled")}`)
			else
				commandsToAdd.forEach((cmd, cmdIndex) => {
					this.logger.log(
						`${cmdIndex === commandsToAdd.length - 1 ? "└" : "├"} ${cmd.name}`
					)
				})

			this.logger.log(`● Update ${yellow(`(${commandsToUpdate.length})`)}`)
			if (options?.disable?.update) this.logger.log(`└ ${bgRed("Task Disabled")}`)
			else
				commandsToUpdate.forEach((cmd, cmdIndex) => {
					this.logger.log(
						`${cmdIndex === commandsToUpdate.length - 1 ? "└" : "├"} ${cmd.command.name}`
					)
				})

			this.logger.log(`● Delete ${yellow(`(${commandsToDelete.size})`)}`)
			if (!options?.disable?.delete) this.logger.log(`└ ${bgRed("Task Disabled")}`)
			else {
				let cmdIndex = 0
				commandsToDelete.forEach((cmd) => {
					this.logger.log(
						`${cmdIndex === commandsToDelete.size - 1 ? "└" : "├"} ${cmd.name}`
					)
				})
			}

			this.logger.log(`● Skip ${yellow(`(${commandsToSkip.length})`)}`)
			commandsToSkip.forEach((cmd, cmdIndex) => {
				this.logger.log(
					`${cmdIndex === commandsToSkip.length - 1 ? "└" : "├"} ${cmd.name}`
				)
			})
		}
		if (
			commandsToAdd.length + commandsToUpdate.length + commandsToDelete.size ===
			0
		) {
			return
		}
		const bulkUpdate: any[] = []
		const operationToSkip = commandsToSkip.map((cmd) =>
			bulkUpdate.push(cmd.instance.toJSON())
		)
		const operationToAdd = options?.disable?.add
			? []
			: commandsToAdd.map((cmd) => bulkUpdate.push(cmd.toJSON()))
		const operationToUpdate = options?.disable?.update
			? commandsToUpdate.map((cmd) => bulkUpdate.push(cmd.command.toJSON()))
			: commandsToUpdate.map((cmd) => bulkUpdate.push(cmd.instance.toJSON()))
		const operationToDelete = options?.disable?.delete
			? commandsToDelete.map((cmd) => bulkUpdate.push(cmd.toJSON()))
			: []
		await Promise.all([
			// skipped
			...operationToSkip,
			// add
			...operationToAdd,
			// update
			...operationToUpdate,
			// delete
			...operationToDelete,
		])
		try {
			await this.application?.commands.set(bulkUpdate)
			!this.silent && this.logger.success("Application Commands ready")
		} catch (error) {
			this.logger.error(`Application Commands error:\n${error}`)
		}
	}
	executeCommandInteraction(interaction: CommandInteraction | AutocompleteInteraction) {
		const tree = this.getApplicationCommandGroupTree(interaction)
		const applicationCommand = this.getApplicationCommandFromTree(tree)
		if (!applicationCommand?.isBotAllowed(this.botId)) {
			if (!this.silent) {
				this.logger.warn(
					`Interaction not found, commandName: ${interaction.commandName}`
				)
			}
			return
		}
		if (interaction.type === InteractionType.ApplicationCommandAutocomplete) {
			// @ts-ignore
			const focusOption = interaction.options.getFocused(true)
			const option = applicationCommand.options.find(
				(op) => op.name === focusOption.name
			)
			if (option && typeof option.autocomplete === "function") {
				option.autocomplete.call(
					DIService.engine.getService(option.from),
					interaction,
					applicationCommand
				)
				return
			}
		}
		return applicationCommand.execute(this.guards, interaction, this)
	}

	async executeComponent(
		components: readonly DComponent[],
		interaction: ButtonInteraction | ModalSubmitInteraction | AnySelectMenuInteraction
	) {
		const executes = components.filter(
			(component) =>
				component.isId(interaction.customId) &&
				component?.isBotAllowed(this.botId)
		)
		if (!executes.length) {
			if (!this.silent) {
				this.logger.warn(
					`${interaction.isButton() ? "Button" : interaction.isAnySelectMenu() ? "Select Menu" : "Modal"} component handler not found {interactionId: ${yellow(interaction.id)}, customId: ${green(interaction.customId)}}`
				)
			}
			return
		}
		const results = await Promise.all(
			executes.map(async (component) => {
				if (
					// @ts-ignore
					!(await component.isGuildAllowed(this, interaction.guildId))
				) {
					return
				}
				return component.execute(this.guards, interaction, this)
			})
		)
		return results
	}
	/**
	 * Execute context menu interaction
	 *
	 * @param interaction - Interaction instance
	 *
	 * @returns
	 */
	executeContextMenu(interaction: ContextMenuCommandInteraction) {
		const applicationCommand = interaction.isUserContextMenuCommand()
			? this.applicationCommandUsers.find(
					(cmd) => cmd.name === interaction.commandName
				)
			: this.applicationCommandMessages.find(
					(cmd) => cmd.name === interaction.commandName
				)
		if (!applicationCommand?.isBotAllowed(this.botId)) {
			if (!this.silent) {
				this.logger.warn(
					`Context interaction not found, name: ${yellow(interaction.commandName)}`
				)
			}
			return
		}
		return applicationCommand.execute(this.guards, interaction, this)
	}
}
