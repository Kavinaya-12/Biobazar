import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { consumeOnboardingRegistration } from "../redux/authSlice";
import { getOnboardingState, saveOnboardingState, shouldStartOnboarding } from "../utils/onboarding";
import "./onboarding-tour.css";

const tourSteps = [
  {
    title: "Welcome to BioBazaar",
    description: "Explore everyday products from the marketplace and review the information each listing provides.",
    target: '[data-tour="site-brand"]',
  },
  {
    title: "Explore products",
    description: "Browse Pantry, Body & care, Home & Living, and Lifestyle from the category links.",
    target: '[data-tour="categories"]',
  },
  {
    title: "Search and filters",
    description: "Search product names, choose a category, sort results, set a price limit, or filter by disclosed details.",
    target: '[data-tour="search-filters"]',
  },
  {
    title: "Product details",
    description: "Cards show the listing description, price, available stock, and information the seller has provided.",
    target: '[data-tour="product-details"]',
  },
  {
    title: "Compare products",
    description: "Add two or three products with the compare icons, then open Compare picks to review their available details side by side.",
    target: '[data-tour="compare-trigger"]',
  },
  {
    title: "Wishlist and cart",
    description: "Save products to your wishlist or add available items to your cart from their product cards. On smaller screens, open the menu for account links.",
    target: '[data-tour="wishlist-link"], [data-tour="cart-link"], [data-tour="wishlist-link-mobile"], [data-tour="cart-link-mobile"], [data-tour="mobile-menu"]',
  },
  {
    title: "Account and orders",
    description: "Open Profile to manage your account. Your wishlist and cart are available from the header; customer order history is not currently available.",
    target: '[data-tour="profile-link"], [data-tour="profile-link-mobile"]',
  },
];

export default function OnboardingTourManager() {
  const dispatch = useDispatch();
  const location = useLocation();
  const { status: authStatus, userId, onboardingRegistrationUserId } = useSelector((state) => state.auth);
  const [activeUserId, setActiveUserId] = useState("");
  const [stepIndex, setStepIndex] = useState(0);
  const dialogRef = useRef(null);

  useEffect(() => {
    if (authStatus !== "authenticated" || !userId) {
      setActiveUserId("");
      return;
    }

    const sameRegistration = String(onboardingRegistrationUserId || "") === String(userId);
    if (sameRegistration && location.pathname === "/collections") {
      const storedState = getOnboardingState(userId);
      const shouldStart = shouldStartOnboarding({ authStatus, userId, registrationUserId: onboardingRegistrationUserId, storedState });
      dispatch(consumeOnboardingRegistration());
      if (shouldStart) {
        setStepIndex(0);
        setActiveUserId(String(userId));
      } else {
        setActiveUserId("");
      }
      return;
    }

    if (activeUserId && activeUserId !== String(userId)) setActiveUserId("");
  }, [activeUserId, authStatus, dispatch, location.pathname, onboardingRegistrationUserId, userId]);

  const active = authStatus === "authenticated" && Boolean(userId) && activeUserId === String(userId);
  const step = tourSteps[stepIndex];

  useEffect(() => {
    if (!active || !step) return undefined;
    dialogRef.current?.focus({ preventScroll: true });
    const target = Array.from(document.querySelectorAll(step.target)).find((element) => element.getClientRects().length > 0);
    if (!target) return undefined;
    target.classList.add("onboarding-target-active");
    target.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    return () => target.classList.remove("onboarding-target-active");
  }, [active, location.pathname, step]);

  const finishTour = (state) => {
    saveOnboardingState(userId, state);
    setActiveUserId("");
  };

  useEffect(() => {
    if (!active) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        saveOnboardingState(userId, "dismissed");
        setActiveUserId("");
        return;
      }
      if (event.key !== "Tab") return;
      const controls = dialogRef.current?.querySelectorAll("button:not([disabled])") || [];
      if (!controls.length) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [active, userId]);

  if (!active || !step) return null;

  const next = () => {
    if (stepIndex === tourSteps.length - 1) finishTour("completed");
    else setStepIndex((current) => Math.min(current + 1, tourSteps.length - 1));
  };

  return (
    <div className="onboarding-scrim">
      <section className="onboarding-dialog" role="dialog" aria-modal="true" aria-labelledby="onboarding-title" aria-describedby="onboarding-description" tabIndex="-1" ref={dialogRef}>
        <p className="onboarding-progress" aria-live="polite">Step {stepIndex + 1} of {tourSteps.length}</p>
        <h2 id="onboarding-title">{step.title}</h2>
        <p id="onboarding-description">{step.description}</p>
        <div className="onboarding-actions">
          <button type="button" className="onboarding-skip" onClick={() => finishTour("dismissed")}>Skip Tour</button>
          <div>
            {stepIndex > 0 && <button type="button" className="onboarding-secondary" onClick={() => setStepIndex((current) => Math.max(current - 1, 0))}>Back</button>}
            <button type="button" className="onboarding-next" onClick={next}>{stepIndex === tourSteps.length - 1 ? "Finish" : "Next"}</button>
          </div>
        </div>
      </section>
    </div>
  );
}
