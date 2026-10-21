import { Header } from "@/components/ui/Header";
import { Film } from "@/components/film/director";
import { HeroScene } from "@/components/scenes/HeroScene";
import { PlanScene } from "@/components/scenes/PlanScene";
import { TrainScene } from "@/components/scenes/TrainScene";
import { FuelScene } from "@/components/scenes/FuelScene";
import { CommitScene } from "@/components/scenes/CommitScene";
import { ProgressScene } from "@/components/scenes/ProgressScene";
import { CoachScene } from "@/components/scenes/CoachScene";
import { WidgetsScene } from "@/components/scenes/WidgetsScene";
import { FinaleScene } from "@/components/scenes/FinaleScene";
import { FeatureSummary } from "@/components/ui/FeatureSummary";
import { GLCanvas } from "@/components/gl/GLCanvas";

export default function Home() {
  return (
    <>
      <Film header={<Header />}>
        <GLCanvas />
        <HeroScene />
        <PlanScene />
        <TrainScene />
        <FuelScene />
        <CommitScene />
        <ProgressScene />
        <CoachScene />
        <WidgetsScene />
        <FinaleScene />
      </Film>
      <FeatureSummary />
      <noscript>
        <p style={{ padding: 24, textAlign: "center" }}>يعمل هذا الموقع بشكل أفضل مع تفعيل JavaScript.</p>
      </noscript>
    </>
  );
}
