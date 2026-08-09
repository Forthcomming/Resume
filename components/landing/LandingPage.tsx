import { HeroSection } from "./HeroSection";
import { StatsBar } from "./StatsBar";
import { LandingNav } from "./LandingNav";
import { FeaturesSection } from "./FeaturesSection";
import { WorkflowSection } from "./WorkflowSection";
import { MatchScoreSection } from "./MatchScoreSection";
import { StoryCardsSection } from "./StoryCardsSection";
import { FAQSection } from "./FAQSection";
import { FinalCTASection } from "./FinalCTASection";
import { LandingFooter } from "./LandingFooter";
import { ReturningUserRedirect } from "./ReturningUserRedirect";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-landing-bg">
      <ReturningUserRedirect />
      <LandingNav />
      <HeroSection />
      <StatsBar />
      <FeaturesSection />
      <WorkflowSection />
      <MatchScoreSection />
      <StoryCardsSection />
      <FAQSection />
      <FinalCTASection />
      <LandingFooter />
    </div>
  );
}
