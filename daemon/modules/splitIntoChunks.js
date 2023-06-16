// Function to divide an array into chunks
module.exports = (array, chunkSize) => {
  // Array to store the chunks
  const chunks = [];
  // Loop through the array
  for (let i = 0; i < array.length; i += chunkSize) {
    // Slice the array from the current index to the current index + chunkSize
    const chunk = array.slice(i, i + chunkSize);
    // Add the chunk to the array of chunks
    chunks.push(chunk);
  }
  // Return the array of chunks
  return chunks;
  //
};
