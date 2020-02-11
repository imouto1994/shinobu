import React, { Fragment, useLayoutEffect } from "react";

import "./PartitionedBooksModal.css";

import IconClose from "./IconClose";
import BookCard from "./BookCard";
import { Book, BookSource } from "../data/book";
import { Map } from "../utils/type";

type Props = {
  partitionedBooks: Map<Book[][]>;
  onClose: () => void;
};

const PartitionedBooksModal = (props: Props) => {
  const { partitionedBooks, onClose } = props;

  useLayoutEffect((): (() => void) => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";
    return (): void => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  const onCloseButtonClick = (): void => {
    onClose();
  };

  return (
    <div className="PartitionedBooksModal-container">
      {Object.keys(partitionedBooks).map((storeName: string) => {
        const bucketBooksList = partitionedBooks[storeName];
        return (
          <Fragment key={storeName}>
            {bucketBooksList.map((books: Book[], index: number) => {
              const totalPrice = books.reduce(
                (total: number, book: Book): number => {
                  const { price = 0 } =
                    book.sources.find(
                      (source: BookSource): boolean =>
                        source.storeName === storeName,
                    ) || {};
                  return total + price;
                },
                0,
              );

              return (
                <Fragment key={index}>
                  <h1>{`${storeName} ${Number(
                    totalPrice,
                  ).toLocaleString()}円`}</h1>
                  <div className="PartitionedBooksModal-books-container">
                    {books.map((book: Book, index: number) => (
                      <div
                        className="PartitionedBooksModal-books-container-item"
                        key={book.id}
                      >
                        <BookCard
                          book={book}
                          index={index}
                          selected={false}
                          selectedStoreName={storeName}
                        />
                      </div>
                    ))}
                  </div>
                </Fragment>
              );
            })}
          </Fragment>
        );
      })}
      <button
        className="PartitionedBooksModal-container-close-button"
        onClick={onCloseButtonClick}
      >
        <IconClose className="PartitionedBooksModal-container-close-icon" />
      </button>
    </div>
  );
};

export default PartitionedBooksModal;
