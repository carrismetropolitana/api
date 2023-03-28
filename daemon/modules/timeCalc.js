/* * * * * */
/* DATABASE */
/* * */

module.exports = {
  getElapsedTime: (startTime) => {
    const interval = process.hrtime(startTime);
    const elapsedMiliseconds = parseInt(
      // seconds -> milliseconds +
      interval[0] * 1000 +
        // + nanoseconds -> milliseconds
        interval[1] / 1000000
    );

    //
    const dateObj = new Date(elapsedMiliseconds);
    //

    const milliseconds = dateObj.getMilliseconds();
    const seconds = dateObj.getSeconds();
    const minutes = dateObj.getMinutes();
    const hours = dateObj.getHours();

    let string = '';

    if (hours > 0) string += `${hours}h `;
    if (minutes > 0) string += `${minutes}m `;
    if (seconds > 0) string += `${seconds}s `;
    if (milliseconds > 0) string += `${milliseconds}ms`;

    return string;
    //
  },
};
