import React, { useState, ChangeEvent } from "react";

import "./App.css";

import PartitionedBooksModal from "./PartitionedBooksModal";
import BookCard from "./BookCard";
import IconCart from "./IconCart";
import IconRefresh from "./IconRefresh";
import { Book, getTotalPrice, isOutdatedBook } from "../data/book";
import useLocalStorage from "../hooks/useLocalStorage";
import { Map } from "../utils/type";

const worker = require("workerize-loader!../worker/partitionBooksMaxPriority"); // eslint-disable-line import/no-webpack-loader-syntax

const ALLOWED_HOSTNAMES = ["order.mandarake.co.jp"];
const DEFAULT_MESSAGE = "Mandarake - Rulers of Time <3";

const workerInstance = worker();

const App = () => {
  const [currentBooks, setCurrentBooks] = useLocalStorage<Book[]>("books", []);
  const [bookURL, setBookURL] = useState("");
  const [statusMessage, setStatusMessage] = useState(DEFAULT_MESSAGE);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [shouldDisableButtons, setShouldDisableButtons] = useState(false);
  const [partitionedBooks, setPartitionedBooks] = useState<Map<
    Book[][]
  > | null>(null);

  const onBooksBuy = async (): Promise<void> => {
    setShouldDisableButtons(true);
    const hasSoldOut =
      currentBooks.filter(book => book.sources.length === 0).length > 0;
    if (hasSoldOut) {
      setStatusMessage("There is at least one book sold out!");
      setShouldDisableButtons(false);
    } else {
      const newPartitionedBooks = await workerInstance.partitionBooks(
        currentBooks,
      );
      setPartitionedBooks(newPartitionedBooks);
      setShouldDisableButtons(false);
    }
  };

  const onBooksRefresh = async (): Promise<void> => {
    setShouldDisableButtons(true);
    setStatusMessage("Refreshing outdated books...");
    const updatedBooks = [...currentBooks];
    for (const index in updatedBooks) {
      const book = updatedBooks[index];
      if (!isOutdatedBook(book)) {
        continue;
      }
      try {
        const response = await fetch(
          `/.netlify/functions/scrape?bookURL=${encodeURIComponent(book.id)}`,
        );
        const body = await response.json();
        const { sources } = body;
        updatedBooks[index] = {
          ...book,
          sources,
          lastUpdatedAt: Date.now(),
        };
      } catch (e) {
        setStatusMessage(`Failed to refresh book URL: ${book.id}`);
      }
    }

    setShouldDisableButtons(false);
    setStatusMessage(DEFAULT_MESSAGE);
    setCurrentBooks(updatedBooks);
  };

  const onBookSelectToggle = (index: number): void => {
    // Select a book
    if (selectedIndex == null) {
      setSelectedIndex(index);
    }
    // Unselect a book
    else if (selectedIndex === index) {
      setSelectedIndex(null);
    }
    // Swap positions of 2 books
    else {
      const targetBook = currentBooks[index];
      const sourceBook = currentBooks[selectedIndex];
      const preTargetBooks = currentBooks.filter(
        (_, i: number) => i < index && i !== selectedIndex,
      );
      const postTargetBooks = currentBooks.filter(
        (_, i: number) => i > index && i !== selectedIndex,
      );
      const updatedBooks = [
        ...preTargetBooks,
        sourceBook,
        targetBook,
        ...postTargetBooks,
      ];
      setCurrentBooks(updatedBooks);
      setSelectedIndex(null);
    }
  };

  const onBookDelete = (index: number): void => {
    setCurrentBooks(currentBooks.filter((_, i) => i !== index));
  };

  const onInputChange = async (
    e: ChangeEvent<HTMLInputElement>,
  ): Promise<void> => {
    const newURL = e.target.value;
    setBookURL(newURL);

    // Empty string
    if (newURL.trim().length === 0) {
      setStatusMessage(DEFAULT_MESSAGE);
      return;
    }

    // Parse hostname to ensure URL is from Mandarake
    let hostname;
    try {
      hostname = new URL(newURL).hostname;
    } catch (error) {
      // Fail silently
      setStatusMessage(`Failed to parse URL: ${newURL}`);
      return;
    }

    if (!ALLOWED_HOSTNAMES.includes(hostname)) {
      setStatusMessage(
        `URL hostname ${hostname} is not in the list of allowed hostnames`,
      );
      return;
    }

    // Check if URL already existed in cart
    for (const book of currentBooks) {
      const { sources } = book;
      for (const { url } of sources) {
        if (url.includes(newURL) || newURL.includes(url)) {
          setStatusMessage("Book already existed");
          return;
        }
      }
    }

    // Fetching book data
    setStatusMessage("Scraping book data...");
    try {
      const response = await fetch(
        `/.netlify/functions/scrape?bookURL=${encodeURIComponent(newURL)}`,
      );
      const body = await response.json();
      const { id, thumbnailURL, sources } = body;

      // Fetching thumbnail dimension
      setStatusMessage("Scraping thumbnail data...");
      const img = new Image();
      img.onload = function() {
        setCurrentBooks([
          {
            id,
            thumbnailURL,
            thumbnailWidth: img.width,
            thumbnailHeight: img.height,
            sources,
            lastUpdatedAt: Date.now(),
          },
          ...currentBooks,
        ]);

        setStatusMessage(DEFAULT_MESSAGE);
        setBookURL("");
      };
      img.onerror = function() {
        setStatusMessage("Failed to fetch book thumbnail");
      };
      img.src = thumbnailURL;
    } catch (e) {
      setStatusMessage("Failed to fetch book data");
    }
  };

  const onModalClose = (): void => {
    setPartitionedBooks(null);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>
          {currentBooks.length === 0
            ? "What's your Mandarake item?"
            : `Total: ${Number(
                getTotalPrice(currentBooks),
              ).toLocaleString()}円`}
        </h1>
        <input
          className="App-input"
          onChange={onInputChange}
          type="text"
          value={bookURL}
        />
        <h3>{statusMessage}</h3>
      </header>
      <div className="App-container">
        {currentBooks.map((book: Book, index: number) => (
          <div className="App-container-item" key={book.id}>
            <BookCard
              book={book}
              index={index}
              selected={selectedIndex === index}
              onSelectToggle={onBookSelectToggle}
              onDelete={onBookDelete}
            />
          </div>
        ))}
      </div>
      <div className="App-action-buttons">
        <button
          className="App-action-button App-action-button-refresh"
          onClick={onBooksRefresh}
          disabled={shouldDisableButtons}
        >
          <IconRefresh className="App-action-button-icon App-action-button-refresh-icon" />
        </button>
        <button
          className="App-action-button App-action-button-buy"
          onClick={onBooksBuy}
          disabled={shouldDisableButtons}
        >
          <IconCart className="App-action-button-icon App-action-button-buy-icon" />
        </button>
      </div>
      {partitionedBooks != null ? (
        <PartitionedBooksModal
          partitionedBooks={partitionedBooks}
          onClose={onModalClose}
        />
      ) : null}
    </div>
  );
};

export default App;
