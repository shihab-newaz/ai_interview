import { ReactNode } from "react";
import {isAuthenticated} from "@/lib/actions/auth.action"
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";

const RootLayout = async ({ children }: { children: ReactNode }) => {
  const isUserAuthenticated = await isAuthenticated();
  if(!isUserAuthenticated){
    redirect('/sign-in')
  }
  return (
    <div className="root-layout">
      <nav className="flex items-center justify-between px-4 py-2">
        <Link href={"/"} className="flex items-center gap-2">
          <Image src="/logo.svg" alt="logo" height={40} width={40} />
          <span className="text-2xl font-bold">CodeEcho</span>
        </Link>
      </nav>
      {children}
    </div>
  );
};

export default RootLayout;
