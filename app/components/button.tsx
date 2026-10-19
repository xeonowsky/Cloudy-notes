import Link from "next/link";

interface MainButtonProps {
  isPrimary?: boolean;
  text: string;
  href: string;
}

export default function MainButton({
  text,
  isPrimary = true,
  href,
}: MainButtonProps) {
  return isPrimary ? (
    <Link href={href}>
      <div className="bg-[#68cbc7] border-[#68cbc7] border-2 text-white font-medium text-center rounded-4xl px-4 py-2 hover:text-[#68cbc7] hover:bg-white duration-500">
        {" "}
        {text}{" "}
      </div>{" "}
    </Link>
  ) : (
    <Link href={href}>
      <div className="border-[#68cbc7]  border-2 shadow-md text-center text-black rounded-4xl px-4 py-2 hover:text-white hover:bg-[#68cbc7] duration-500">
        {text}
      </div>
    </Link>
  );
}
