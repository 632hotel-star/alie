import { notFound } from "next/navigation";
import GLTestClient from "./Client";

/** Development-only harness used to render posters / debug the 3D props. Not served in production. */
export default function GLTestPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <GLTestClient />;
}
