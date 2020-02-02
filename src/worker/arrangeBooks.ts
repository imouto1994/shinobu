import { Book, BookSource } from "../data/book";
import { Map } from "../utils/type";

const MAX_PRICE_PER_BUCKET = 25000;

function initializeBuckets(books: Book[]) {
  const storeMaxPriceMap: { [name: string]: number } = {};
  for (const book of books) {
    for (const { storeName, price } of book.sources) {
      if (storeMaxPriceMap[storeName] == null) {
        storeMaxPriceMap[storeName] = 0;
      }
      storeMaxPriceMap[storeName] += price;
    }
  }

  const storeMaxPriceEntries = Object.entries(storeMaxPriceMap);
  storeMaxPriceEntries.sort(
    ([, maxPriceA], [, maxPriceB]) => maxPriceB - maxPriceA,
  );

  const bucketPrices: number[] = [];
  const bucketStores: string[] = [];

  for (const [storeName, maxPrice] of storeMaxPriceEntries) {
    const maxBuckets = Math.ceil(maxPrice / MAX_PRICE_PER_BUCKET);
    for (let i = 0; i < maxBuckets; i++) {
      bucketPrices.push(0);
      bucketStores.push(storeName);
    }
  }

  return {
    bucketPrices,
    bucketStores,
  };
}

export function arrangeBooks(books: Book[]): Map<Book[][]> {
  const { bucketPrices, bucketStores } = initializeBuckets(books);
  const bucketBooksList: Book[][] = bucketPrices.map(() => []);
  const bookSourceMapList: Map<BookSource>[] = books.map(book => {
    return book.sources.reduce((map: Map<BookSource>, source) => {
      map[source.storeName] = source;
      return map;
    }, {});
  });

  let bestBucketBooksList: Book[][] = [];
  let bestMaxBucketDiff = Infinity;
  let bestBucketCount = Infinity;

  function backtrack(bookIndex: number, bucketFilled: number): void {
    if (bucketFilled > bestBucketCount) {
      return;
    }

    // Finish packing all the books
    if (bookIndex === books.length) {
      const filledBucketPrices = bucketPrices.filter(price => price > 0);
      filledBucketPrices.sort((priceA, priceB) => priceA - priceB);
      const maxBucketDiff =
        filledBucketPrices[filledBucketPrices.length - 1] -
        filledBucketPrices[0];

      if (
        bucketFilled < bestBucketCount ||
        (bucketFilled === bestBucketCount && maxBucketDiff < bestMaxBucketDiff)
      ) {
        bestBucketBooksList = JSON.parse(JSON.stringify(bucketBooksList));
        bestMaxBucketDiff = maxBucketDiff;
        bestBucketCount = bucketFilled;
      }

      return;
    }

    const currentBook = books[bookIndex];

    for (let i = 0; i < bucketPrices.length; i++) {
      const storeName = bucketStores[i];
      const bookSource = bookSourceMapList[bookIndex][storeName];

      // Store does not have this book
      if (bookSource == null) {
        continue;
      }

      const { price } = bookSource;
      // Bucket price exceeds the limit if accepts this book
      if (bucketPrices[i] + price > MAX_PRICE_PER_BUCKET) {
        continue;
      }

      const isEmpty = bucketPrices[i] === 0;
      bucketPrices[i] += price;
      bucketBooksList[i].push(currentBook);
      backtrack(bookIndex + 1, isEmpty ? bucketFilled + 1 : bucketFilled);
      bucketPrices[i] -= price;
      bucketBooksList[i].pop();
    }
  }

  backtrack(0, 0);

  const map: Map<Book[][]> = {};
  for (const bucketIndex in bestBucketBooksList) {
    const storeName = bucketStores[bucketIndex];
    const bucketBooks = bestBucketBooksList[bucketIndex];

    if (bucketBooks.length > 0) {
      if (map[storeName] == null) {
        map[storeName] = [];
      }
      map[storeName].push(bucketBooks);
    }
  }

  return map;
}
