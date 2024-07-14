import { cyan, gray, green, magenta, red, yellow } from "@util/Colors"

export class Logger {
	origin: string

	constructor(origin: string) {
		this.origin = origin
	}

	log(...obj: any[]): void {
		process.stdout.write(
			`${gray(new Date().toLocaleString())} ${magenta(`[${this.origin}] [INFO]`)} `
		)
		console.log(...obj)
	}
	info = this.log

	success(...obj: any[]): void {
		process.stdout.write(
			`${gray(new Date().toLocaleString())} ${green(`[${this.origin}] [SUCCESS]`)} `
		)
		console.log(...obj)
	}

	trace(...obj: any[]): void {
		process.stdout.write(
			`${gray(new Date().toLocaleString())} ${cyan(`[${this.origin}] [TRACE]`)} `
		)
		console.log(...obj)
	}

	warn(...obj: any[]): void {
		process.stdout.write(
			`${gray(new Date().toLocaleString())} ${yellow(`[${this.origin}] [WARN]`)} `
		)
		console.warn(...obj)
	}

	error(...obj: any[]): void {
		process.stdout.write(
			`${gray(new Date().toLocaleString())} ${red(`[${this.origin}] [ERROR]`)} `
		)
		console.error(...obj)
	}
}

export const LoggerSimple = {
	log(origin: string, ...obj: any[]): void {
		process.stdout.write(
			`${gray(new Date().toLocaleString())} ${magenta(`[${origin}] [INFO]`)} `
		)
		console.log(...obj)
	},
	success(origin: string, ...obj: any[]): void {
		process.stdout.write(
			`${gray(new Date().toLocaleString())} ${green(`[${origin}] [SUCCESS]`)} `
		)
		console.log(...obj)
	},
	trace(origin: string, ...obj: any[]): void {
		process.stdout.write(
			`${gray(new Date().toLocaleString())} ${cyan(`[${origin}] [TRACE]`)} `
		)
		console.log(...obj)
	},
	warn(origin: string, ...obj: any[]): void {
		process.stdout.write(
			`${gray(new Date().toLocaleString())} ${yellow(`[${origin}] [WARN]`)} `
		)
		console.warn(...obj)
	},
	error(origin: string, ...obj: any[]): void {
		process.stdout.write(
			`${gray(new Date().toLocaleString())} ${red(`[${origin}] [ERROR]`)} `
		)
		console.error(...obj)
	},
}
