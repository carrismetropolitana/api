/* * */

export default class TIMETRACKER {
  //

  INSTANCE_NAME: string

  START_TIME: number

  constructor(instanceName = '') {
    this.INSTANCE_NAME = instanceName
    this.START_TIME = Date.now()
  }

  get() {
    //

    const elapsedTime = Date.now() - this.START_TIME

    const milliseconds = elapsedTime % 1000
    const seconds = Math.floor(elapsedTime / 1000) % 60
    const minutes = Math.floor(elapsedTime / (1000 * 60)) % 60
    const hours = Math.floor(elapsedTime / (1000 * 60 * 60))

    let string = ''

    if (hours > 0)
      string += `${hours}h `
    if (minutes > 0)
      string += `${minutes}m `
    if (seconds > 0)
      string += `${seconds}s `
    if (milliseconds > 0)
      string += `${milliseconds}ms`

    return string

    //
  }

  //
}
