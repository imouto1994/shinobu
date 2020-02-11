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
    ([, { total: totalA }], [, { total: totalB }]) => totalB - totalA,
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
  for (const [storeName, { books: storeBooks }] of stores) {
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
  }

  return map;
}
