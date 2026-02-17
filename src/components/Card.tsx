import classNames from "classnames";

type ContainerProps = {
  children: React.ReactNode;
  className?: string;
};

const Card = ({ children, className }: ContainerProps) => {
  return (
    <div
      className={classNames(
        "w-72 md:w-80 px-8 py-4 bg-white border-4 border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] grid place-content-center",
        className,
      )}
    >
      {children}
    </div>
  );
};

export default Card;
