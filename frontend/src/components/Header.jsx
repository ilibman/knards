import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import { RxHamburgerMenu, RxCross2 } from 'react-icons/rx';
import './Header.scss';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.className = 'overflow-auto';

    if (mobileMenuOpen) {
      document.body.className = 'overflow-hidden';
    } else {
      document.body.className = 'overflow-auto';
    }
  }, [mobileMenuOpen]);

  return (
    <header>
      <nav aria-label="Global">
        <div className="flex justify-end my-2 mx-3 md:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className="sr-only">
              Open mobile menu
            </span>
            <RxHamburgerMenu
              className="h-8 w-8 stroke-1 stroke-black"
              aria-hidden="true"
            />
          </button>
        </div>
        <div className="hidden md:flex">
          <Link
            className="px-8
              text-black font-base text-3xl font-extrabold uppercase
              hover:text-white hover:bg-black"
            to={'/'}
          >
            Home
          </Link>
          <Link
            className="px-8
              text-black font-base text-3xl font-extrabold uppercase
              hover:text-white hover:bg-black"
            to={'new'}
          >
            New card
          </Link>
          <Link
            className="px-8
              text-black font-base text-3xl font-extrabold uppercase
              hover:text-white hover:bg-black"
            to={'list'}
          >
            My cards
          </Link>
          <Link
            className="px-8
              text-black font-base text-3xl font-extrabold uppercase
              hover:text-white hover:bg-black"
            to={'explore'}
          >
            Explore
          </Link>
        </div>
      </nav>
      <Dialog.Root
        className="md:hidden"
        open={mobileMenuOpen}
        onOpenChange={setMobileMenuOpen}
      >
        <Dialog.Portal>
          <Dialog.Content className="fixed top-0 left-0 w-full h-full bg-brown">
            <div className="flex pt-1 px-3">
              <nav
                className="flex flex-col justify-center w-full space-y-8"
                aria-label="Global"
              >
                <Link
                  className="text-black font-base text-6xl font-bold uppercase"
                  to={'/'}
                >
                  Home
                </Link>
                <Link
                  className="text-black font-base text-6xl font-bold uppercase"
                  to={'new'}
                >
                  New card
                </Link>
                <Link
                  className="text-black font-base text-6xl font-bold uppercase"
                  to={'list'}
                >
                  My cards
                </Link>
                <Link
                  className="text-black font-base text-6xl font-bold uppercase"
                  to={'explore'}
                >
                  Explore
                </Link>
              </nav>
            </div>
            <Dialog.Close
              className="absolute top-1 right-1 inline-flex
                items-center justify-center p-1
                focus:outline-none"
            >
              <RxCross2 className="h-8 w-8 stroke-1 stroke-black" />
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </header>
  );
}