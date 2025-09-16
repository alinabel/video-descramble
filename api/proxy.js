import { Readable } from 'node:stream';

export default async function handler(req, res) {
  const targetUrl = req.query.url;

  if (!targetUrl) {
    return res.status(400).send('Error: "url" query parameter is required.');
  }

  try {
    // 1. Dynamically import the ESM youtubei.js library
    const { Innertube } = await import('youtubei.js');
    
    const youtube = await Innertube.create();
    const info = await youtube.getInfo(targetUrl);

    // Filter for formats that have video, audio, and are mp4
    const suitableFormats = info.formats.filter(format => 
      format.has_video && 
      format.has_audio && 
      format.container === 'mp4'
    );

    if (suitableFormats.length === 0) {
      throw new Error("Could not find a suitable MP4 format with both video and audio.");
    }

    // From the suitable formats, find the one with the highest resolution (height)
    const bestFormat = suitableFormats.reduce((prev, current) => {
      return (prev.height > current.height) ? prev : current;
    });
    
    // Get the stream for the best format found
    const stream = await bestFormat.getStream();

    res.setHeader('Content-Type', 'video/mp4');
    
    // Convert the web stream to a Node.js stream and pipe it to the response
    const nodeStream = Readable.fromWeb(stream);
    nodeStream.pipe(res);

  } catch (error) {
    console.error(error);
    res.status(500).send(`Error in proxy function: ${error.message}`);
  }
}