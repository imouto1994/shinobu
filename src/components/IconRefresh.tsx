import React from "react";

type Props = {
  className?: string;
};

const IconRefresh = (props: Props) => {
  const { className } = props;

  return (
    <svg
      className={className}
      viewBox="0 0 341.3 341.3"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M341.2 149.3V0l-50.1 50.1A170.4 170.4 0 000 170.6a170.4 170.4 0 00335.4 42.7H291a127.8 127.8 0 01-248.5-42.6 128 128 0 01128-128c35.3 0 67 14.7 90 37.8L192 149.3h149.3z" />
    </svg>
  );
};

export default IconRefresh;
