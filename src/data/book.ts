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

export function getTotalPrice(books: Book[]): number {
  let total = 0;
  for (const book of books) {
    const averagePrice =
      book.sources.reduce(
        (acc: number, source: BookSource) => acc + source.price,
        0,
      ) / book.sources.length;
    total += averagePrice;
  }

  return Math.ceil(total);
}
