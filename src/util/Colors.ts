import { Chalk } from "chalk"

const customChalk = new Chalk({ level: 3 })

// export const gray = customChalk.rgb(95, 95, 95)
// export const blue = customChalk.rgb(15, 15, 205)
// export const cyan = customChalk.rgb(0, 183, 235)
// export const green = customChalk.rgb(20, 175, 20)
// export const magenta = customChalk.rgb(175, 79, 190)
// export const red = customChalk.rgb(200, 25, 25)
// export const yellow = customChalk.rgb(255, 219, 88)
// export const bgRed = customChalk.bgRgb(170, 50, 50)

export const gray = customChalk.gray
export const blue = customChalk.blue
export const cyan = customChalk.cyan
export const green = customChalk.green
export const magenta = customChalk.magenta
export const red = customChalk.red
export const yellow = customChalk.yellow
export const bgRed = customChalk.bgRed
