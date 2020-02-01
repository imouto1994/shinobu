import React, { useState, ChangeEvent } from "react";

import "./App.css";

import useLocalStorage from "../hooks/useLocalStorage";

const ALLOWED_HOSTNAMES = ["order.mandarake.co.jp"];

type Book = {
  id: string;
  thumbnailURL: string;
  thumbnailWidth: number;
  thumbnailHeight: number;
  sources: Array<{
    price: number;
    storeName: string;
    url: string;
  }>;
};

const App = () => {
  const [bookURL, setBookURL] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [currentBooks, setCurrentBooks] = useLocalStorage<Book[]>("books", []);

  const onInputChange = async (
    e: ChangeEvent<HTMLInputElement>,
  ): Promise<void> => {
    const newURL = e.target.value;
    setBookURL(newURL);

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

    for (const book of currentBooks) {
      const { sources } = book;
      for (const { url } of sources) {
        if (url.includes(newURL) || newURL.includes(url)) {
          setStatusMessage("Book already existed");
          return;
        }
      }
    }

    setStatusMessage("Scraping book data...");
    try {
      const response = await fetch(
        `/.netlify/functions/scrape?bookURL=${encodeURIComponent(newURL)}`,
      );
      const body = await response.json();
      const { id, thumbnailURL, sources } = body;

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
          },
          ...currentBooks,
        ]);

        setStatusMessage("");
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

  return (
    <div className="App">
      <header className="App-header">
        <h1>What's your Mandarake item?</h1>
        <input
          className="App-input"
          onChange={onInputChange}
          type="text"
          value={bookURL}
        />
        <p>{statusMessage}</p>
      </header>
    </div>
  );
};

export default App;
