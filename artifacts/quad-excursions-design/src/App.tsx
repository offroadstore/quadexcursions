import { useEffect } from "react";
import { applyApprovedLayout } from "./approved-layout";
import { enhance } from "./enhance";
import { wireInquiries } from "./inquiries";

export default function App() {
  useEffect(() => {
    applyApprovedLayout();
    const stopInquiries = wireInquiries();
    const stopEnhancement = enhance();
    return () => { stopInquiries(); stopEnhancement(); };
  }, []);
  return null;
}
