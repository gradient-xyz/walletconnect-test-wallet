import React, { useEffect, useState } from "react";

interface IClickOutsideProps {
  onClickOutside: (event: any) => void;
  children: JSX.Element;
}

const ClickOutside: React.FC<IClickOutsideProps> = (props: IClickOutsideProps) => {
  const { children, onClickOutside } = props;

  const [element, setElement] = useState<HTMLDivElement | null>(null);
  const [isTouch, setIsTouch] = useState(false);

  function handle(event: any) {
    if (event.type === "touchend") {
      setIsTouch(true);
    }
    if (event.type === "click" && isTouch) {
      return;
    }
    const el = event.element || element;
    if (el) {
      if (!el.contains(event.target)) {
        onClickOutside(event);
      }
      setElement(el);
    }
  }

  useEffect(() => {
    document.addEventListener("touchend", handle, true);
    document.addEventListener("click", handle, true);

    return () => {
      document.removeEventListener("touchend", handle, true);
      document.removeEventListener("click", handle, true);
    };
  });

  return (
    <div {...props} ref={c => setElement(c)}>
      {children}
    </div>
  );
};

export default ClickOutside;
