import { ClassicSections } from "@/components/classic/ClassicSections";
import { ModeRoot } from "@/components/shell/ModeRoot";
import { SiteFooter } from "@/components/shell/SiteFooter";
import { SiteHeader } from "@/components/shell/SiteHeader";

export default function Home() {
  return (
    <>
      <SiteHeader />
      {/* Focusable so the skip link moves focus here, not only the Tab starting point. */}
      <main
        id="main"
        tabIndex={-1}
        className="mx-auto w-full max-w-5xl flex-1 px-4 focus:outline-none"
      >
        <ModeRoot>
          <ClassicSections />
        </ModeRoot>
      </main>
      <SiteFooter />
    </>
  );
}
