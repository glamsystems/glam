import * as React from 'react';

import {
  ClusterChecker,
  ClusterUiSelect,
  ExplorerLink,
} from '../cluster/cluster-ui';
import {
  Header,
  HeaderContainer,
  HeaderGlobalAction,
  HeaderGlobalBar,
  HeaderMenu,
  HeaderMenuButton,
  HeaderMenuItem,
  HeaderName,
  HeaderNavigation,
  HeaderSideNavItems,
  Search,
  SideNav,
  SideNavItems,
  SkipToContent,
} from '@carbon/react';
import { Link, useLocation } from 'react-router-dom';
import { ReactNode, Suspense, useEffect, useRef } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';

import { AccountChecker } from '../account/account-ui';
import { WalletButton } from '../solana/solana-provider';

export function UiLayout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();

  const { publicKey } = useWallet();

  return (
    <div className="h-full flex flex-col">
      <HeaderContainer
        render={({ isSideNavExpanded, onClickSideNavExpand }) => (
          <Header aria-label="GLAM *.+">
            <SkipToContent />
            <HeaderMenuButton
              aria-label={isSideNavExpanded ? 'Close menu' : 'Open menu'}
              onClick={onClickSideNavExpand}
              isActive={isSideNavExpanded}
              aria-expanded={isSideNavExpanded}
            />
            <Link to="/products">
              <HeaderName
                prefix="Glam *.+"
                className="h-full w-full"
                title="Glam *.+"
              ></HeaderName>
            </Link>
            <HeaderNavigation aria-label="GLAM *.+">
              <Link to="/products">
                <HeaderMenuItem
                  isActive={pathname.includes('/products')}
                  className="h-full w-full"
                >
                  Products
                </HeaderMenuItem>
              </Link>
              <Link to="/account">
                <HeaderMenuItem
                  href="/account"
                  isActive={pathname === '/account'}
                  className="h-full w-full"
                >
                  Account
                </HeaderMenuItem>
              </Link>
              <Link to="/manage">
                <HeaderMenuItem
                  href="/manage"
                  isActive={
                    pathname === '/manage' || pathname === '/create-product'
                  }
                  className="h-full w-full"
                >
                  Manage
                </HeaderMenuItem>
              </Link>
            </HeaderNavigation>
            <HeaderGlobalBar>
              <HeaderGlobalAction
                aria-label={!publicKey ? 'Connect Wallet' : 'Account'}
                tooltipAlignment="end"
                onClick={
                  // perform same action as clicking the wallet button
                  () => {
                    const walletButton = document.getElementsByClassName(
                      'wallet-adapter-button-trigger'
                    );

                    if (walletButton.length > 0) {
                      (walletButton[0] as HTMLButtonElement).click();
                    }
                  }
                }
              >
                <WalletButton>x</WalletButton>
              </HeaderGlobalAction>
            </HeaderGlobalBar>
            <SideNav
              aria-label="Side navigation"
              expanded={isSideNavExpanded}
              isPersistent={false}
              onSideNavBlur={onClickSideNavExpand}
            >
              <SideNavItems>
                <HeaderSideNavItems>
                  <HeaderMenuItem href="/products">Products</HeaderMenuItem>
                  <HeaderMenuItem href="/account">Account</HeaderMenuItem>
                  <HeaderMenuItem href="/manage">Manage</HeaderMenuItem>
                </HeaderSideNavItems>
              </SideNavItems>
            </SideNav>
          </Header>
        )}
      />
      <div className="flex flex-grow justify-center my-[30px] h-full">
        <Suspense
          fallback={
            <div className="text-center my-32">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          }
        >
          {children}
        </Suspense>
        <Toaster position="bottom-right" />
      </div>
    </div>
  );
}

export function AppModal({
  children,
  title,
  hide,
  show,
  submit,
  submitDisabled,
  submitLabel,
}: {
  children: ReactNode;
  title: string;
  hide: () => void;
  show: boolean;
  submit?: () => void;
  submitDisabled?: boolean;
  submitLabel?: string;
}) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    if (!dialogRef.current) return;
    if (show) {
      dialogRef.current.showModal();
    } else {
      dialogRef.current.close();
    }
  }, [show, dialogRef]);

  return (
    <dialog className="modal" ref={dialogRef}>
      <div className="modal-box space-y-5">
        <h3 className="font-bold text-lg">{title}</h3>
        {children}
        <div className="modal-action">
          <div className="join space-x-2">
            {submit ? (
              <button
                className="btn btn-xs lg:btn-md btn-primary"
                onClick={submit}
                disabled={submitDisabled}
              >
                {submitLabel || 'Save'}
              </button>
            ) : null}
            <button onClick={hide} className="btn">
              Close
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}

export function AppHero({
  children,
  title,
  subtitle,
}: {
  children?: ReactNode;
  title: ReactNode;
  subtitle: ReactNode;
}) {
  return (
    <div className="hero py-[64px]">
      <div className="hero-content text-center">
        <div className="max-w-2xl">
          {typeof title === 'string' ? (
            <h1 className="text-5xl font-bold">{title}</h1>
          ) : (
            title
          )}
          {typeof subtitle === 'string' ? (
            <p className="py-6">{subtitle}</p>
          ) : (
            subtitle
          )}
          {children}
        </div>
      </div>
    </div>
  );
}

export function ellipsify(str = '', len = 4) {
  if (str.length > 30) {
    return (
      str.substring(0, len) + '..' + str.substring(str.length - len, str.length)
    );
  }
  return str;
}

export function useTransactionToast() {
  return (signature: string) => {
    toast.success(
      <div className={'text-center'}>
        <div className="text-lg">Transaction sent</div>
        <ExplorerLink
          path={`tx/${signature}`}
          label={'View Transaction'}
          className="btn btn-xs btn-primary"
        />
      </div>
    );
  };
}
