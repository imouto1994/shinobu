const got = require("got");
const cheerio = require("cheerio");

const ALLOWED_HOSTNAMES = ["order.mandarake.co.jp"];

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
    .eq(1)
    .text()
    .trim();

  // Scrape price
  const price =
    $(".soldout").eq(1) == null
      ? parseInt(
          $(".__price")
            .eq(1)
            .text()
            .trim()
            .replace(/,/g, ""),
          10,
        )
      : null;

  if (price != null) {
    sources.push({
      price,
      storeName,
      url: bookURL,
    });
  }

  // Scrape other sources
  $(".other_itemlist .block").each(function() {
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
    const url = $(this)
      .find(".title a")
      .attr("href");
    sources.push({
      price,
      storeName,
      url,
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

    const response = await got(bookURL);
    const scrapedData = scrapeMandarake(bookURL, response.body);

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
