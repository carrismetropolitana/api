// Function to divide an array into chunks
module.exports = (array, numChunks) => {
  const arrayLength = array.length;
  const chunkSize = Math.ceil(arrayLength / numChunks);
  const chunks = []; // Array to store the chunks
  // Loop through the array
  for (let i = 0; i < arrayLength; i += chunkSize) {
    // Slice the array from the current index to the current index + chunkSize
    const chunk = array.slice(i, i + chunkSize);
    // Add the chunk to the array of chunks
    chunks.push(chunk);
  }
  // Return the array of chunks
  return chunks;
};
