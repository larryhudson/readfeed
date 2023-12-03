import { getFeedById } from "@src/feeds";

export async function all(context) {
  const requestUrl = context.url;
  console.log({ requestUrl });

  const feedId = context.params.id;
  const feed = await getFeedById(feedId);
  const user = feed.user;

  const passwordHash = requestUrl.searchParams.get("password");
  const isCorrectPassword = passwordHash === user.passwordHash;

  if (!isCorrectPassword) {
    return new Response("Forbidden", {
      status: 403,
    });
  }

  const podcastInfo = {
    title: `readfeed: ${feed.title}`,
    author: "Larry Hudson",
    authorEmail: "larryhudson@hey.com",
    category: "Technology",
    description: "A podcastInfo.feed for the TTS Feed",
    feedUrl: requestUrl.href,
    homeUrl: requestUrl.origin,
    imageUrl: "http://tts-feed.larryhudson.io/assets/images/astro.png",
    language: "en",
    location: "Torquay, Australia",
    frequency: "Weekly",
    keywords: "podcast, rss, feed",
    pubDate: new Date().toUTCString(),
    site: requestUrl.origin,
  };

  const audioItems = feed.audioItems;

  // TODO: need to think about adding password to audio item URLs

  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss xmlns:googleplay="http://www.google.com/schemas/play-podcast/1.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:rawvoice="http://www.rawvoice.com/rawvoiceRssModule/" xmlns:content="http://purl.org/rss/1.0/modules/content/" version="2.0">
  <channel>
    <title>${podcastInfo.title}</title>
    <ttl>1</ttl>
    <googleplay:author>${podcastInfo.author}</googleplay:author>
    <rawvoice:rating>TV-G</rawvoice:rating>
    <rawvoice:location>${podcastInfo.location}</rawvoice:location>
    <rawvoice:frequency>${podcastInfo.frequency}</rawvoice:frequency>
    <author>${podcastInfo.author}</author>
    <itunes:author>${podcastInfo.author}</itunes:author>
    <itunes:email>${podcastInfo.authorEmail}</itunes:email>
    <itunes:category text="${podcastInfo.category}" />
    <image>
      <url>${podcastInfo.imageUrl}</url>
      <title>${podcastInfo.title}</title>
      <link>${podcastInfo.homeUrl}</link>
    </image>
    <itunes:owner>
      <itunes:name>${podcastInfo.author}</itunes:name>
      <itunes:email>${podcastInfo.authorEmail}</itunes:email>
    </itunes:owner>
    <itunes:keywords>${podcastInfo.keywords}</itunes:keywords>
    <copyright>${podcastInfo.author}</copyright>
    <description>${podcastInfo.description}</description>
    <googleplay:image href="${podcastInfo.imageUrl}" />
    <language>${podcastInfo.language}</language>
    <itunes:explicit>no</itunes:explicit>
    <pubDate>${podcastInfo.pubDate}</pubDate>
    <link>${podcastInfo.feedUrl}</link>
    <itunes:image href="${podcastInfo.imageUrl}" />
    ${audioItems.map(
      (audioItem) =>
        `<item>
        <author>${podcastInfo.author}</author>
        <itunes:author>${podcastInfo.author}</itunes:author>
        <title>${audioItem.title}</title>
        <pubDate>${new Date(audioItem.added_at).toUTCString()}</pubDate>
        <enclosure url="${podcastInfo.site}${addPasswordParamToUrl(
          audioItem.mp3Url,
          passwordParam,
        )}" type="audio/mpeg" length="${audioItem.mp3Length}" />
        <itunes:duration>${audioItem.mp3Duration}</itunes:duration>
        <guid isPermaLink="false">${audioItem.mp3Url}</guid>
        <itunes:explicit>no</itunes:explicit>
        <description>${audioItem.url}</description>
      </item>`,
    )}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml",
    },
  });
}
