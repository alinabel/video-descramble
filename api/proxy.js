const ytdl = require('ytdl-core');

// Note: We remove the 'edge' runtime config. 
// ytdl-core works best in the standard Node.js runtime.

export default async function handler(req, res) {
  // Extract the YouTube URL from the query parameters
  const targetUrl = req.query.url;

  if (!targetUrl) {
    return res.status(400).send('Error: "url" query parameter is required.');
  }

  // Validate if it's a proper YouTube URL
  if (!ytdl.validateURL(targetUrl)) {
    return res.status(400).send('Error: Invalid YouTube URL provided.');
  }

  try {
    // Set headers for video streaming
    res.setHeader('Content-Type', 'video/mp4');
    // Optional: Set a filename for downloads
    res.setHeader('Content-Disposition', 'attachment; filename="video.mp4"');

    // Use ytdl-core to get the video stream and pipe it directly to the response
    // This is highly efficient as it streams the data without loading it all into memory.
    ytdl(targetUrl, {
      filter: 'videoandaudio', // Choose a format with both video and audio
      quality: 'highest',      // Or choose a specific quality like '136' for 720p
    }).pipe(res);

  } catch (error) {
    console.error(error);
    res.status(500).send(`Error in proxy function: ${error.message}`);
  }
}