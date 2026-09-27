import { m } from "motion/react";
import { contactLinks, cv } from "@/content";
import type { ContactKind } from "@/domain/types";
import { stagger, useEntrance } from "../motion-config";

/** The action each offer performs; it leads the link text, so it is the accessible name too. */
const offerActions: Record<ContactKind, string> = {
  email: "Send an email",
  linkedin: "Connect on LinkedIn",
  github: "Browse the code on GitHub",
  itch: "Play the games on itch.io",
};

/**
 * Merchant (Roadmap P7): each contact channel as a shop offer. Every offer is a real link whose
 * text states the real action; the price tag is decoration and hidden from assistive tech.
 */
export function ContactPanel() {
  const entrance = useEntrance({ opacity: 0, y: 10 });

  return (
    <div>
      <p className="font-mono text-sm text-muted">
        &gt; everything here is free. Pick an offer_
      </p>
      <ul aria-label="Contact options" className="merchant-offers">
        {contactLinks.map((link, index) => {
          const external = link.kind !== "email";
          return (
            <m.li
              key={link.id}
              initial={entrance}
              animate={{ opacity: 1, y: 0 }}
              transition={stagger(index, 0.05)}
            >
              <a
                href={link.href}
                {...(external && {
                  target: "_blank",
                  rel: "noopener noreferrer",
                })}
                className="merchant-offer"
              >
                <span className="offer-action">{offerActions[link.kind]}</span>
                <span className="offer-detail">{link.label}</span>
                {external && (
                  <span className="sr-only"> (opens in a new tab)</span>
                )}
                <span aria-hidden="true" className="offer-price">
                  free
                </span>
              </a>
            </m.li>
          );
        })}
        <m.li
          initial={entrance}
          animate={{ opacity: 1, y: 0 }}
          transition={stagger(contactLinks.length, 0.05)}
        >
          {cv ? (
            <a href={cv.href} download={cv.fileName} className="merchant-offer">
              <span className="offer-action">Download the CV</span>
              <span className="offer-detail">
                PDF, updated {cv.lastUpdated}
              </span>
              <span aria-hidden="true" className="offer-price">
                free
              </span>
            </a>
          ) : (
            <p className="merchant-offer" data-sold-out>
              <span className="offer-action">CV (PDF)</span>
              <span className="offer-detail">
                Coming soon. The full record is in the other cards.
              </span>
              <span aria-hidden="true" className="offer-price">
                restocking
              </span>
            </p>
          )}
        </m.li>
      </ul>
    </div>
  );
}
