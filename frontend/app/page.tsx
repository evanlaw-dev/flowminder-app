"use client";

import { Suspense, useRef, useState, useEffect } from 'react';
import { useAgendaStore } from '@/stores/useAgendaStore';
import Agenda from '@/components/Agenda';
import RequestsWrapper from '@/components/RequestsWrapper';
import Header from '@/components/Header';
import Nudge from '@/components/Nudge';
import BtnCancelSave from '@/components/BtnCancelSave';
import { useSearchParams } from 'next/navigation';

function HomeWrapper() {
  const searchParams = useSearchParams();
  const role = searchParams.get('role') === 'host' ? 'participant' : 'host';
  return <HomeLayout role={role} />;
}

// --- Custom Throttle Hook ---
function useThrottle(callback: () => void, delay: number) {
  const lastCall = useRef(0);

  return () => {
    const now = Date.now();
    if (now - lastCall.current >= delay) {
      lastCall.current = now;
      callback();
    }
  };
}

// --- Custom Debounce Hook ---
function useDebounce(callback: () => void, delay: number) {
  const timer = useRef<NodeJS.Timeout | null>(null);

  return () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      callback();
    }, delay);
  };
}

function HomeLayout({ role }: { role: 'host' | 'participant' }) {
  const { isEditingMode } = useAgendaStore();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [showBottomShadow, setShowBottomShadow] = useState(false);
  const [isScrolledDown, setIsScrolledDown] = useState(false);

const updateShadowVisibility = () => {
  if (!scrollContainerRef.current) return;
  const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
  const isScrollable = scrollHeight > clientHeight;
  const notAtBottom = scrollTop + clientHeight < scrollHeight - 1;
  const scrolledDown = scrollTop > 0;

  setShowBottomShadow((prev) =>
    prev !== (isScrollable && notAtBottom) ? isScrollable && notAtBottom : prev
  );

  setIsScrolledDown((prev) => (prev !== scrolledDown ? scrolledDown : prev));
};

  const throttledScrollHandler = useThrottle(updateShadowVisibility, 100);
  const debouncedResizeHandler = useDebounce(updateShadowVisibility, 150);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => throttledScrollHandler();
    scrollContainer.addEventListener('scroll', handleScroll);
    updateShadowVisibility(); // Initial check

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
    };
  }, [throttledScrollHandler]);

  useEffect(() => {
    if (!contentRef.current) return;

    const observer = new ResizeObserver(() => {
      debouncedResizeHandler();
    });

    observer.observe(contentRef.current);

    return () => {
      observer.disconnect();
    };
  }, [debouncedResizeHandler]);

  return (
    <aside
      className="fixed left-0 top-0 h-[100svh] max-h-[1000px] flex flex-col w-[clamp(250px,40vw,400px)]
                 px-4 bg-white transition-width duration-100 ease-in-out py-4 space-y-2"
    >
      <div className="flex flex-col flex-grow justify-center space-y-2 min-h-0">
        <div className="flex-shrink-0">
          <Header role={role} />
        </div>
        <div className="flex-shrink-0">
          <Nudge />
        </div>

        <div className="flex-1 min-h-0 relative overflow-hidden rounded-md">
          <div
            className="overflow-y-auto h-full rounded-lg will-change-scroll"
            ref={scrollContainerRef}
          >
            <div ref={contentRef}>
              <Suspense fallback={<div>Loading agenda…</div>}>
                <Agenda role={role} isScrolledDown={isScrolledDown}  />
              </Suspense>
            </div>
          </div>

          <div
            className={`pointer-events-none absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-gray-200 to-transparent transition-opacity ease-in-out ${showBottomShadow ? 'opacity-100' : 'opacity-0'}`}
          />
        </div>

        <div className="flex-shrink-0 bg-white mb-2">
          {isEditingMode && <BtnCancelSave />}
          <RequestsWrapper />
        </div>
      </div>
    </aside>
  );
}

export default function Home() {
  return <HomeWrapper />;
}
