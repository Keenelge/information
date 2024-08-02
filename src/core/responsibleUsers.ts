import { Client } from "@classes/Client"
import { default as coreConfig } from "@config/core.json" assert {type: "json"}
import { default as customConfig } from "@config/custom.json" assert {type: "json"}
import { default as rolesConfig } from "@config/roles.json" assert {type: "json"}
import { GuildMember, Role, Snowflake } from "discord.js"

const isAdminRole = (role: Role) => {
	return rolesConfig.HighRoles.Administrator === role.id
}

const isCuratorRole = (role: Role) => {
	return rolesConfig.HighRoles.Curator === role.id
}

const findHigherMember = (members: GuildMember[]) => {
	return members.reduce<GuildMember>((higherMember, member) => {
		if (higherMember.roles.highest.position < member.roles.highest.position)
			return member

		return higherMember
	}, members[0])
}

export type ResponsibleUsers = {
	[ResponsibleRole: string]: Snowflake[]
}

const emptyResponsibleUsers = {
	...Object.keys(rolesConfig.ResponsibleRoles).reduce<ResponsibleUsers>(
		(acc, responsibleRoleName) => {
			acc[responsibleRoleName] = []

			return acc
		},
		{}
	),
	...Object.keys(customConfig).reduce<ResponsibleUsers>((acc, customName) => {
		acc[customName] = []

		return acc
	}, {}),
}
Object.freeze(emptyResponsibleUsers)

export function getResponsibleUsers(client: Client): ResponsibleUsers {
	const responsibleUsers = structuredClone(emptyResponsibleUsers)

	const guild = client.guilds.cache.get(coreConfig.guildId)

	if (!guild) return responsibleUsers

	const roles = guild.roles.cache

	Object.entries(rolesConfig.ResponsibleRoles).forEach(
		([responsibleRoleName, responsibleRole]) => {
			const role = roles.get(responsibleRole.ID)

			if (!role) return

			if (responsibleRoleName === "StaffAdmin") {
				role.members.forEach((member) => {
					responsibleUsers["StaffAdmin"].push(member.id)
				})
				return
			}

			const admins: GuildMember[] = []
			const curators: GuildMember[] = []

			role.members.forEach((member) => {
				member.roles.cache.forEach((role) => {
					if (isAdminRole(role)) return admins.push(member)

					if (isCuratorRole(role)) return curators.push(member)
				})
			})

			const admin = findHigherMember(admins)

			if (admin) {
				responsibleUsers[responsibleRoleName].push(admin.id)

				return
			}

			const curator = findHigherMember(curators)

			if (curator) {
				responsibleUsers[responsibleRoleName].push(curator.id)

				return
			}
		}
	)

	Object.keys(customConfig).forEach((customName) => {
		customConfig[customName as keyof typeof customConfig].Users.forEach(
			(memberId: Snowflake) => {
				const member = guild.members.cache.get(memberId)

				if (!member) return

				responsibleUsers[customName].push(member.id)
			}
		)
	})

	return responsibleUsers
}

export function createResponsiblesEmbedText(responsibleUsers: ResponsibleUsers): string {
	let desc = ""

	Object.entries(rolesConfig.ResponsibleRoles)
		.sort(([, a], [, b]) => a.Order - b.Order)
		.forEach(([responsibleRoleName, responsibleRole]) => {
			if (responsibleRoleName === "StaffAdmin") {
				const staffAdmins = responsibleUsers["StaffAdmin"]

				if (staffAdmins.length) {
					desc +=
						`**${coreConfig.cross} Ответственные за <@&${rolesConfig.HighRoles.Administrator}> и <@&${rolesConfig.StaffRole}>**\n` +
						staffAdmins.reduce<string>((acc, userId) => {
							return `${acc}${coreConfig.dot} <@${userId}>\n`
						}, "") +
						"\n"
				}
			} else {
				desc += `**${coreConfig.cross} <@&${responsibleRole.StaffRole}> — ${responsibleRole.Description}**\n`

				const responsibleUser = responsibleUsers[responsibleRoleName][0]

				if (responsibleUser) {
					desc += `**${coreConfig.dot} Ответственный: <@${responsibleUser}>**\n`
				}

				desc += "\n"
			}
		})

	Object.entries(customConfig)
		.sort(([, a], [, b]) => a.Order - b.Order)
		.forEach(([customName, custom]) => {
			const users = responsibleUsers[customName]

			if (!users.length) return

			desc +=
				`**${coreConfig.cross} ${users.length === 1 ? custom.Description.Single : custom.Description.Bunch}**\n` +
				users.reduce<string>((acc, userId) => {
					if (userId.startsWith("!")) {
						if (!responsibleUsers[userId] || !responsibleUsers[userId][0]) return acc
						
						return `${acc}${coreConfig.dot} <@${responsibleUsers[userId][0]}>\n`
					}

					return `${acc}${coreConfig.dot} <@${userId}>\n`
				}, "")
		})

	return desc.replace(/\n$/g, "")
}
