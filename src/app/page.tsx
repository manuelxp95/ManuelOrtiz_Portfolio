import { ClassicSections } from "@/components/classic/ClassicSections";
import { ModeRoot } from "@/components/shell/ModeRoot";
import { SiteFooter } from "@/components/shell/SiteFooter";
import { SiteHeader } from "@/components/shell/SiteHeader";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4">
        <ModeRoot>
          <ClassicSections />
        </ModeRoot>
      </main>
      <SiteFooter />
    </>
  );
}
