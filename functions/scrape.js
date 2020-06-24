const got = require("got");
const cheerio = require("cheerio");
const queryString = require("query-string");

const ALLOWED_HOSTNAMES = ["order.mandarake.co.jp"];

function cleanupURL(str) {
  const url = new URL(str);
  const searchParams = queryString.parse(url.search);
  const newSearchParams = {
    itemCode: searchParams.itemCode,
    lang: "en",
  };

  return `${url.origin}${url.pathname}?${queryString.stringify(
    newSearchParams,
  )}`;
}

function scrapeMandarake(bookURL, htmlString) {
  const $ = cheerio.load(htmlString);

  // Scrape Images
  const imageURLs = [];
  if ($(".xzoom-thumbs img").length > 0) {
    $(".xzoom-thumbs img").each(function() {
      imageURLs.push($(this).attr("src"));
    });
  } else {
    imageURLs.push($(".pic img").attr("src"));
  }

  const sources = [];

  // Scrape store
  const storeName = $(".__shop")
    .eq(0)
    .text()
    .trim();

  // Scrape price
  const price = !htmlString.includes('class="soldout"')
    ? parseInt(
        $("meta[itemprop=price]")
          .attr("content")
          .trim()
          .replace(/,/g, ""),
        10,
      )
    : null;

  if (price != null) {
    sources.push({
      price,
      storeName,
      url: cleanupURL(bookURL),
    });
  }

  // Scrape other sources
  $(".other_itemlist .block").each(function() {
    const url = $(this)
      .find(".title a")
      .attr("href");
    if (url.startsWith("#")) {
      return;
    }

    const storeName = $(this)
      .find(".shop")
      .text()
      .trim();
    const price = parseInt(
      $(this)
        .find(".price")
        .text()
        .trim()
        .replace(/,/g, ""),
      10,
    );
    sources.push({
      price,
      storeName,
      url: cleanupURL(`https://order.mandarake.co.jp${url}`),
    });
  });

  return {
    thumbnailURL: imageURLs[0],
    sources,
  };
}

exports.handler = async (event, context) => {
  const { httpMethod, queryStringParameters } = event;

  // Only allow GET
  if (httpMethod !== "GET") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  // Missing required query `url`
  const { bookURL } = queryStringParameters;
  if (bookURL == null) {
    return { statusCode: 400, body: "Missing query `bookURL`" };
  }

  try {
    const parsedBookURL = new URL(bookURL);
    if (!ALLOWED_HOSTNAMES.includes(parsedBookURL.hostname)) {
      return { statusCode: 400, body: "Book URL is not supported" };
    }
    const url = cleanupURL(bookURL);
    const response = await got(url);
    const scrapedData = scrapeMandarake(url, response.body);

    return {
      statusCode: 200,
      body: JSON.stringify({
        id: bookURL,
        ...scrapedData,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    };
  } catch (error) {
    console.log(error);
    return {
      statusCode: 500,
      body: "Something wrong happened",
    };
  }
};
