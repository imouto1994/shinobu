import React, { Fragment, useLayoutEffect } from "react";

import "./ArrangedBooksModal.css";

import IconClose from "./IconClose";
import BookCard from "./BookCard";
import { Book, BookSource } from "../data/book";
import { Map } from "../utils/type";

type Props = {
  arrangedBooks: Map<Book[][]>;
  onClose: () => void;
};

const ArrangedBooksModal = (props: Props) => {
  const { arrangedBooks, onClose } = props;

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
    <div className="ArrangedBooksModal-container">
      {Object.keys(arrangedBooks).map((storeName: string) => {
        const bucketBooksList = arrangedBooks[storeName];
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
                  <div className="ArrangedBooksModal-books-container">
                    {books.map((book: Book, index: number) => (
                      <div
                        className="ArrangedBooksModal-books-container-item"
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
        className="ArrangedBooksModal-container-close-button"
        onClick={onCloseButtonClick}
      >
        <IconClose className="ArrangedBooksModal-container-close-icon" />
      </button>
    </div>
  );
};

export default ArrangedBooksModal;
