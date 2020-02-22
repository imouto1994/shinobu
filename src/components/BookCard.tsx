import React, { Fragment } from "react";
import classnames from "classnames";

import "./BookCard.css";

import { Book, isOutdatedBook, getAveragePrice } from "../data/book";

type BookCardProps = {
  book: Book;
  index: number;
  selected: boolean;
  selectedStoreName?: string;
  onSelectToggle?: (index: number) => void;
  onDelete?: (index: number) => void;
};

const BookCard = (props: BookCardProps) => {
  const {
    book,
    index,
    onDelete,
    onSelectToggle,
    selected,
    selectedStoreName,
  } = props;
  const { id, thumbnailURL, thumbnailWidth, thumbnailHeight, sources } = book;
  const isOutdated = isOutdatedBook(book);

  const onThumbnailClick = (): void => {
    if (onSelectToggle != null) {
      onSelectToggle(index);
    }
  };

  const onDeleteButtonClick = (): void => {
    if (onDelete != null) {
      onDelete(index);
    }
  };

  const overlayClassName = classnames("BookCard-thumbnail-overlay", {
    "BookCard-thumbnail-overlay-selected": selected,
  });

  const sourceClassName = classnames("BookCard-source", {
    "BookCard-source-oudated": isOutdated,
  });

  return (
    <div className="BookCard-container">
      <div
        className="BookCard-thumbnail-aspect-ratio"
        style={{ paddingTop: `${(thumbnailHeight / thumbnailWidth) * 100}%` }}
        onClick={onThumbnailClick}
      >
        <div className={overlayClassName} />
        <img
          alt="thumbnail"
          className="BookCard-thumbnail"
          src={thumbnailURL}
        />
        {selected ? (
          <button
            className="BookCard-thumbnail-delete"
            onClick={onDeleteButtonClick}
          >
            Delete
          </button>
        ) : null}
        {selectedStoreName == null ? (
          <div className="BookCard-thumbnail-price-tag">
            {`${Number(getAveragePrice(book)).toLocaleString()}円`}
          </div>
        ) : null}
      </div>
      <div className="BookCard-sources">
        {sources.map((source, index) => {
          const isSelectedSource = source.storeName === selectedStoreName;
          return (
            <Fragment key={source.url}>
              <a
                className={classnames(sourceClassName, {
                  "BookCard-source-selected": isSelectedSource,
                })}
                href={source.url}
                rel="noopener noreferrer"
                target="_blank"
              >
                {`${source.storeName}${
                  isSelectedSource
                    ? ` ${Number(source.price).toLocaleString()}円`
                    : ""
                }`}
              </a>
              {index !== sources.length - 1 ? (
                <span className="BookCard-source-separator">|</span>
              ) : null}
            </Fragment>
          );
        })}
        {sources.length === 0 ? (
          <a
            className={sourceClassName}
            href={id}
            rel="noopener noreferrer"
            target="_blank"
          >
            Sold Out T_T
          </a>
        ) : null}
      </div>
    </div>
  );
};

export default BookCard;
