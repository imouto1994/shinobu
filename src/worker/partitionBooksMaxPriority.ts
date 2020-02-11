import { Book, BookSource } from "../data/book";
import { Map } from "../utils/type";

const MAX_PRICE_PER_BUCKET = 25000;

export function partitionBooks(books: Book[]): Map<Book[][]> {
  const storeBooks: Map<{ total: number; books: Book[] }> = {};

  for (const book of books) {
    for (const source of book.sources) {
      if (storeBooks[source.storeName] == null) {
        storeBooks[source.storeName] = {
          total: 0,
          books: [],
        };
      }

      storeBooks[source.storeName].total += source.price;
      storeBooks[source.storeName].books.push(book);
    }
  }

  const stores = Object.entries(storeBooks);
  stores.sort(
    ([, { total: totalA }], [, { total: totalB }]) => totalA - totalB,
  );

  const bookSourcesMap: Map<Map<BookSource>> = {};
  for (const book of books) {
    bookSourcesMap[book.id] = {};
    for (const source of book.sources) {
      bookSourcesMap[book.id][source.storeName] = source;
    }
  }

  const visited: Map<boolean> = {};
  const map: Map<Book[][]> = {};
  while (stores.length > 0) {
    const topStore = stores.pop();
    if (topStore == null) {
      continue;
    }
    const [storeName, { books: storeBooks }] = topStore;
    map[storeName] = [];
    let price = 0;
    let bucketBooks: Book[] = [];
    for (const book of storeBooks) {
      if (visited[book.id]) {
        continue;
      }
      const bookPrice = bookSourcesMap[book.id][storeName].price;
      if (price + bookPrice > MAX_PRICE_PER_BUCKET) {
        map[storeName].push(bucketBooks);
        bucketBooks = [];
        price = 0;
      }
      price += bookPrice;
      bucketBooks.push(book);
      visited[book.id] = true;
    }
    if (bucketBooks.length > 0) {
      map[storeName].push(bucketBooks);
    }

    for (const entry of stores) {
      entry[1].books = entry[1].books
        .map(book => {
          const bookPrice = bookSourcesMap[book.id][entry[0]].price;
          if (visited[book.id]) {
            entry[1].total -= bookPrice;
            return null;
          }

          return book;
        })
        .filter((book): book is Book => book != null);
    }
    stores.sort(
      ([, { total: totalA }], [, { total: totalB }]) => totalA - totalB,
    );
  }

  return map;
}
