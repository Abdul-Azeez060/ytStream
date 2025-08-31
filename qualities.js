const ytdl = require("@distube/ytdl-core");

/**
 * Get all available video qualities for a given YouTube URL.
 * @param {string} videoURL - The YouTube video URL.
 * @returns {Promise<string[]>} - Array of unique quality labels (e.g., ["720p", "1080p"]).
 */
async function getAvailableQualities(videoURL) {
  try {
    const info = await ytdl.getInfo(videoURL, {
      requestOptions: {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      },
      cookies: [
        {
          name: "CONSENT",
          value: "YES+1",
          domain: ".youtube.com",
        },
      ],
    });

    const qualities = info.formats
      .filter((f) => f.hasVideo && f.container === "mp4" && f.qualityLabel)
      .map((f) => f.qualityLabel)
      .filter((v, i, a) => a.indexOf(v) === i); // Remove duplicates

    return qualities;
  } catch (error) {
    console.error("Error fetching video qualities:", error);
    throw error;
  }
}

module.exports = { getAvailableQualities };
