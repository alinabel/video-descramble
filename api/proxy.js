// api/proxy.js
import { YouTube } from 'youtube.js';
import fetch from 'node-fetch';

export const config = {
  runtime: 'nodejs', // YouTube.js needs Node runtime
};

export default async function handler(req, res) {
  const targetUrl = req.query.url;

  if (!targetUrl) {
    return res.status(400).send('Error: "url" query parameter is required.');
  }

  try {
    // Initialize YouTube.js
    const youtube = new YouTube();

    // Get video info
    const video = await youtube.getVideo(targetUrl);

    // Pick an MP4 format with both audio & video
    const format = video.formats.find(f => f.mimeType.includes('video/mp4') && f.hasAudio === true);

    if (!format || !format.url) {
      return res.status(404).send('No suitable video format found.');
    }

    // Fetch the video stream via node-fetch
    const videoResponse = await fetch(format.url, {
      headers: {
        'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0',
      },
    });

    if (!videoResponse.ok) {
      return res.status(videoResponse.status).send(`Failed to fetch video: ${videoResponse.statusText}`);
    }

    // Set response headers for streaming
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', 'inline; filename="video.mp4"');

    // Pipe the video stream to the client
    videoResponse.body.pipe(res);

  } catch (error) {
    console.error(error);
    res.status(500).send(`Error fetching YouTube video: ${error.message}`);
  }
}
