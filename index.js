const express = require("express");
const ytdl = require("@distube/ytdl-core");
const cors = require("cors");
const YoutubeSearchApi = require("youtube-search-api");
const { getAvailableQualities } = require("./qualities");

const app = express();
const PORT = process.env.PORT || 4000;
app.use(express.json());
app.use(cors());

// Search endpoint (returns videoId)
app.get("/search", async (req, res) => {
  const { song_name } = req.query;
  if (!song_name) return res.status(400).send("Missing song name");

  try {
    const result = await YoutubeSearchApi.GetListByKeyword(song_name, false, 1);
    const videoId = result.items?.[0]?.id;
    if (!videoId) return res.status(404).send("No video found");
    res.json({ videoId });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error searching video");
  }
});

app.get("/stream", async (req, res) => {
  console.log("request coming to backend");
  const { url } = req.query;
  console.log(url, "url");
  if (!url) return res.status(400).send("Missing YouTube URL");
  const { quality } = req.query;
  try {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Content-Type", "video/mp4");

    let itag = null;
    if (quality) {
      // Get available qualities
      const availableQualities = await getAvailableQualities(url);
      if (!availableQualities.includes(quality)) {
        return res
          .status(400)
          .send(
            `Quality ${quality} not available. Available qualities: ${availableQualities.join(
              ", "
            )}`
          );
      }

      // Fetch video info and select exact format by quality label
      const info = await ytdl.getInfo(url);
      const candidates = (info.formats || []).filter(
        (f) => f.hasVideo && f.container === "mp4" && f.qualityLabel
      );
      // Select exact match with audio preferred
      let selected = candidates.find(
        (f) => f.qualityLabel === quality && f.hasAudio
      );
      if (!selected) {
        // Fallback: any format with exact label
        selected = candidates.find((f) => f.qualityLabel === quality);
      }
      if (!selected) {
        return res.status(400).send(`Exact quality ${quality} not found`);
      }
      itag = selected.itag;
    }

    const streamOptions = {};
    if (itag) {
      streamOptions.quality = itag;
    }
    ytdl(url, streamOptions).pipe(res);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error streaming video");
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
