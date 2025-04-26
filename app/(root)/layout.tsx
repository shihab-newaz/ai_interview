import { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";

const RootLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="root-layout">
      <nav>
        <Link href={"/"} className="flex items-center gap-2">
          <Image src="/logo.svg" alt="logo" height={40} width={40} />
        </Link>
      </nav>
      {children}
    </div>
  );
};

export default RootLayout;
