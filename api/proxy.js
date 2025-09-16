// api/proxy.js

export const config = {
  runtime: 'edge', // Use the fast and efficient Edge runtime
};

export default async function handler(request) {
  // Extract the target video URL from the query parameters
  const targetUrl = new URL(request.url).searchParams.get('url');

  if (!targetUrl) {
    return new Response('Error: "url" query parameter is required.', { status: 400 });
  }

  try {
    // Fetch the video from the target URL.
    // This returns a Response object immediately, allowing us to stream the body.
    const videoResponse = await fetch(targetUrl);

    // Check if the request to the target was successful
    if (!videoResponse.ok) {
        return new Response(`Failed to fetch video: ${videoResponse.statusText}`, { status: videoResponse.status });
    }
    
    // Create new headers for our response back to the browser
    const headers = new Headers({
      // Copy the original content-type (e.g., 'video/mp4')
      'Content-Type': videoResponse.headers.get('Content-Type'),
      // Add the all-important CORS header to allow access from any origin
      'Access-Control-Allow-Origin': '*',
    });

    // Stream the video's body directly back to the browser in our new response.
    // This is highly efficient as the video data is never fully loaded into memory.
    return new Response(videoResponse.body, {
      headers,
    });

  } catch (error) {
    return new Response(`Error in proxy function: ${error.message}`, { status: 500 });
  }
}