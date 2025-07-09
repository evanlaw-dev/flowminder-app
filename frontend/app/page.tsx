import Agenda from '@/components/Agenda';
import DisplayRequests from '@/components/DisplayRequests';
import Header from '@/components/Header';
import Nudge from '@/components/Nudge';

export default function Home() {
  return (
      <main className="max-h-xl min-h-100 py-8 flex flex-col items-center w-full max-w-md gap-3 px-4 mx-auto">
        <Header topic="Write user stories" timer="00:15:23" />
        <Nudge />
        <Agenda />
        <DisplayRequests />
      </main>
  );
}
