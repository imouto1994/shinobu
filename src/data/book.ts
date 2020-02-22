export type BookSource = {
  price: number;
  storeName: string;
  url: string;
};

export type Book = {
  id: string;
  thumbnailURL: string;
  thumbnailWidth: number;
  thumbnailHeight: number;
  sources: BookSource[];
  lastUpdatedAt: number;
};

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

export function isOutdatedBook(book: Book): boolean {
  return Date.now() - book.lastUpdatedAt > DAY_IN_MILLISECONDS;
}

export function getAveragePrice(book: Book): number {
  const averagePrice = Math.floor(
    book.sources.reduce(
      (acc: number, source: BookSource) => acc + source.price,
      0,
    ) / book.sources.length,
  );

  return averagePrice - (averagePrice % 100);
}

export function getTotalPrice(books: Book[]): number {
  let total = 0;
  for (const book of books) {
    total += getAveragePrice(book);
  }

  return Math.ceil(total);
}
