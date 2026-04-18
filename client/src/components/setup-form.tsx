import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { InsertScenario } from "@shared/schema";

const CHARACTER_TRAITS = [
  "Short-tempered", "Cunning", "Obedient", "Nice", "Patient", "Aggressive",
  "Empathetic", "Analytical", "Creative", "Stubborn", "Flexible", "Confident",
  "Insecure", "Arrogant", "Humble", "Optimistic", "Pessimistic", "Rational",
  "Emotional", "Direct", "Indirect", "Assertive", "Passive", "Diplomatic",
  "Blunt", "Supportive", "Critical", "Open-minded", "Close-minded", "Enthusiastic",
  "Reserved", "Friendly", "Cold", "Competitive", "Cooperative"
];

const CONVERSATION_TYPES = [
  { value: "Negotiation", desc: "Reach a mutual agreement" },
  { value: "Conflict resolution", desc: "Resolve a dispute calmly" },
  { value: "Pitching to a customer", desc: "Sell your idea or product" },
  { value: "Proposal", desc: "Present a formal proposal" },
  { value: "Relationship Management", desc: "Strengthen a connection" },
  { value: "Feedback", desc: "Give or receive feedback" },
  { value: "Press Release", desc: "Public communication" },
  { value: "Critique/Review", desc: "Evaluate work or ideas" },
  { value: "Crisis Management", desc: "Handle an urgent situation" },
  { value: "Discovery", desc: "Explore and learn" },
  { value: "Interrogation/Audit", desc: "Investigate or audit" },
  { value: "Arbitration", desc: "Mediate between two sides" },
  { value: "Debate", desc: "Argue opposing positions" },
  { value: "Mandate", desc: "Deliver a directive" },
];

const STEPS = ["intro", "conversation_type", "relationship", "character_traits", "core_issue", "stances", "background", "goal"];

type FormData = {
  purpose: string;
  relationship: string;
  characterProfile: string[];
  coreIssue: string;
  userStance: string;
  otherStance: string;
  backgroundStory: string;
  goal: string;
};

export default function SetupForm() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const urlStep = parseInt(new URLSearchParams(window.location.search).get("step") || "0"); 
  const [stepIndex, setStepIndex] = useState(urlStep);
  const [animating, setAnimating] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    purpose: "", relationship: "", characterProfile: [],
    coreIssue: "", userStance: "", otherStance: "", backgroundStory: "", goal: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  const currentStep = STEPS[stepIndex];
  const isIntro = currentStep === "intro";
  const totalQuestions = STEPS.length - 1;
  const questionNumber = stepIndex;
  const progressPercent = isIntro ? 0 : (questionNumber / totalQuestions) * 100;

  const createScenarioMutation = useMutation({
    mutationFn: async (data: InsertScenario) => {
      const response = await apiRequest("POST", "/api/scenarios", data);
      return response.json();
    },
    onSuccess: async (scenario) => {
      const response = await apiRequest("POST", `/api/scenarios/${scenario.id}/conversations`);
      const conversationData = await response.json();
      setLocation(`/conversation/${conversationData.conversation.id}`);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create scenario. Please try again.", variant: "destructive" });
    },
  });

  const validate = (): boolean => {
    const e: Partial<Record<keyof FormData, string>> = {};
    if (currentStep === "conversation_type" && !formData.purpose) e.purpose = "Please select a type";
    if (currentStep === "relationship" && !formData.relationship.trim()) e.relationship = "Please describe your relationship";
    if (currentStep === "character_traits" && formData.characterProfile.length === 0) e.characterProfile = "Select at least one trait";
    if (currentStep === "core_issue" && !formData.coreIssue.trim()) e.coreIssue = "Please describe the core issue";
    if (currentStep === "stances") {
      if (!formData.userStance.trim()) e.userStance = "Describe your stance";
      if (!formData.otherStance.trim()) e.otherStance = "Describe their stance";
    }
    if (currentStep === "goal" && !formData.goal.trim()) e.goal = "Please describe your goal";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const goNext = () => {
    if (!validate()) return;
    if (stepIndex === STEPS.length - 1) { createScenarioMutation.mutate(formData as InsertScenario); return; }
    setAnimating(true);
    setTimeout(() => { setStepIndex(i => i + 1); setAnimating(false); }, 220);
  };

  const goBack = () => {
    if (stepIndex === 0) return;
    setAnimating(true);
    setTimeout(() => { setStepIndex(i => i - 1); setErrors({}); setAnimating(false); }, 220);
  };

  const toggleTrait = (trait: string) => {
    setFormData(prev => ({
      ...prev,
      characterProfile: prev.characterProfile.includes(trait)
        ? prev.characterProfile.filter(t => t !== trait)
        : [...prev.characterProfile, trait],
    }));
    setErrors(e => ({ ...e, characterProfile: undefined }));
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f0ece6", display: "flex", flexDirection: "column", fontFamily: "'Poppins', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .sf-step { animation: sfIn 0.38s cubic-bezier(0.22,1,0.36,1) forwards; }
        .sf-step.exit { animation: sfOut 0.2s ease-in forwards; }
        @keyframes sfIn { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes sfOut { from { opacity:1; transform:translateY(0); } to { opacity:0; transform:translateY(-12px); } }

        .sf-option {
          background: #ffffff;
          border: 1.5px solid #e8e2dc;
          border-radius: 16px;
          padding: 20px 24px;
          cursor: pointer;
          transition: all 0.18s ease;
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          text-align: left;
        }
        .sf-option:hover { border-color: #e8365d; background: #fff5f7; transform: translateY(-1px); box-shadow: 0 4px 20px rgba(232,54,93,0.08); }
        .sf-option.sel { border-color: #e8365d; background: #fff5f7; }
        .sf-option-text { font-size: 15px; font-weight: 500; color: #1a1a1a; font-family: 'Poppins', sans-serif; }
        .sf-option-desc { font-size: 12px; color: #999; margin-top: 2px; font-family: 'Poppins', sans-serif; font-weight: 400; }
        .sf-option-check { width: 22px; height: 22px; border-radius: 50%; border: 1.5px solid #ddd; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all 0.16s; }
        .sf-option.sel .sf-option-check { background: #e8365d; border-color: #e8365d; color: white; font-size: 12px; }

        .sf-trait {
          padding: 9px 18px;
          border-radius: 50px;
          border: 1.5px solid #e8e2dc;
          background: #ffffff;
          cursor: pointer;
          font-size: 13px;
          font-family: 'Poppins', sans-serif;
          font-weight: 400;
          color: #555;
          transition: all 0.15s ease;
        }
        .sf-trait:hover { border-color: #e8365d; color: #e8365d; }
        .sf-trait.sel { border-color: #e8365d; background: #e8365d; color: #fff; font-weight: 500; }

        .sf-textarea, .sf-input {
          width: 100%;
          border: 1.5px solid #e8e2dc;
          border-radius: 14px;
          padding: 16px 20px;
          font-size: 15px;
          font-family: 'Poppins', sans-serif;
          font-weight: 400;
          background: #ffffff;
          color: #1a1a1a;
          resize: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          outline: none;
          line-height: 1.6;
        }
        .sf-textarea::placeholder, .sf-input::placeholder { color: #bbb; }
        .sf-textarea:focus, .sf-input:focus { border-color: #e8365d; box-shadow: 0 0 0 4px rgba(232,54,93,0.08); }

        .sf-btn {
          background: #e8365d;
          color: #fff;
          border: none;
          border-radius: 50px;
          padding: 17px 40px;
          font-size: 15px;
          font-family: 'Poppins', sans-serif;
          font-weight: 600;
          cursor: pointer;
          width: 100%;
          transition: all 0.2s ease;
          letter-spacing: 0.01em;
        }
        .sf-btn:hover:not(:disabled) { background: #d42a52; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(232,54,93,0.28); }
        .sf-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .sf-back {
          background: none;
          border: none;
          cursor: pointer;
          color: #888;
          font-size: 20px;
          padding: 8px;
          display: flex;
          align-items: center;
          transition: color 0.16s;
          line-height: 1;
        }
        .sf-back:hover { color: #333; }

        .sf-skip {
          background: none;
          border: none;
          color: #aaa;
          cursor: pointer;
          width: 100%;
          margin-top: 14px;
          font-size: 13px;
          font-family: 'Poppins', sans-serif;
          padding: 8px;
          transition: color 0.16s;
        }
        .sf-skip:hover { color: #777; }

        .sf-progress-track { height: 3px; background: #e8e2dc; }
        .sf-progress-fill { height: 100%; background: #e8365d; transition: width 0.45s cubic-bezier(0.22,1,0.36,1); border-radius: 0 2px 2px 0; }

        .sf-error { color: #e8365d; font-size: 12px; margin-top: 8px; font-family: 'Poppins', sans-serif; }
        .sf-label { display: block; font-size: 13px; font-weight: 600; color: #333; margin-bottom: 10px; }
      `}</style>

      {/* Header */}
      <header style={{ background: "#ffffff", borderBottom: "1px solid #ede8e3", height: 58, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ width: 40 }}>
          {!isIntro && <button className="sf-back" onClick={goBack}>←</button>}
        </div>
        <span style={{ fontSize: 18, fontWeight: 700, color: "#1a1a1a", letterSpacing: "-0.01em" }}>
          <svg width="200" height="30" viewBox="0 0 735 135" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.97 67.32C2.97 61.08 4.32 55.53 7.02 50.67C9.72 45.75 13.47 41.94 18.27 39.24C23.13 36.48 28.62 35.1 34.74 35.1C42.24 35.1 48.66 37.08 54 41.04C59.34 45 62.91 50.4 64.71 57.24H47.79C46.53 54.6 44.73 52.59 42.39 51.21C40.11 49.83 37.5 49.14 34.56 49.14C29.82 49.14 25.98 50.79 23.04 54.09C20.1 57.39 18.63 61.8 18.63 67.32C18.63 72.84 20.1 77.25 23.04 80.55C25.98 83.85 29.82 85.5 34.56 85.5C37.5 85.5 40.11 84.81 42.39 83.43C44.73 82.05 46.53 80.04 47.79 77.4H64.71C62.91 84.24 59.34 89.64 54 93.6C48.66 97.5 42.24 99.45 34.74 99.45C28.62 99.45 23.13 98.1 18.27 95.4C13.47 92.64 9.72 88.83 7.02 83.97C4.32 79.11 2.97 73.56 2.97 67.32ZM105.815 99.63C99.8747 99.63 94.4147 98.25 89.4347 95.49C84.5147 92.73 80.5847 88.89 77.6447 83.97C74.7647 78.99 73.3247 73.41 73.3247 67.23C73.3247 61.05 74.7647 55.5 77.6447 50.58C80.5847 45.66 84.5147 41.82 89.4347 39.06C94.4147 36.3 99.8747 34.92 105.815 34.92C111.755 34.92 117.185 36.3 122.105 39.06C127.085 41.82 130.985 45.66 133.805 50.58C136.685 55.5 138.125 61.05 138.125 67.23C138.125 73.41 136.685 78.99 133.805 83.97C130.925 88.89 127.025 92.73 122.105 95.49C117.185 98.25 111.755 99.63 105.815 99.63ZM105.815 85.59C110.855 85.59 114.875 83.91 117.875 80.55C120.935 77.19 122.465 72.75 122.465 67.23C122.465 61.65 120.935 57.21 117.875 53.91C114.875 50.55 110.855 48.87 105.815 48.87C100.715 48.87 96.6347 50.52 93.5747 53.82C90.5747 57.12 89.0747 61.59 89.0747 67.23C89.0747 72.81 90.5747 77.28 93.5747 80.64C96.6347 83.94 100.715 85.59 105.815 85.59ZM205.007 99H189.617L163.877 60.03V99H148.487V35.82H163.877L189.617 74.97V35.82H205.007V99ZM277.272 35.82L254.862 99H235.602L213.192 35.82H229.572L245.232 83.52L260.982 35.82H277.272ZM300.895 48.15V60.93H321.505V72.81H300.895V86.67H324.205V99H285.505V35.82H324.205V48.15H300.895ZM368.216 99L355.076 75.15H351.386V99H335.996V35.82H361.826C366.806 35.82 371.036 36.69 374.516 38.43C378.056 40.17 380.696 42.57 382.436 45.63C384.176 48.63 385.046 51.99 385.046 55.71C385.046 59.91 383.846 63.66 381.446 66.96C379.106 70.26 375.626 72.6 371.006 73.98L385.586 99H368.216ZM351.386 64.26H360.926C363.746 64.26 365.846 63.57 367.226 62.19C368.666 60.81 369.386 58.86 369.386 56.34C369.386 53.94 368.666 52.05 367.226 50.67C365.846 49.29 363.746 48.6 360.926 48.6H351.386V64.26ZM419.367 99.63C414.747 99.63 410.607 98.88 406.947 97.38C403.287 95.88 400.347 93.66 398.127 90.72C395.967 87.78 394.827 84.24 394.707 80.1H411.087C411.327 82.44 412.137 84.24 413.517 85.5C414.897 86.7 416.697 87.3 418.917 87.3C421.197 87.3 422.997 86.79 424.317 85.77C425.637 84.69 426.297 83.22 426.297 81.36C426.297 79.8 425.757 78.51 424.677 77.49C423.657 76.47 422.367 75.63 420.807 74.97C419.307 74.31 417.147 73.56 414.327 72.72C410.247 71.46 406.917 70.2 404.337 68.94C401.757 67.68 399.537 65.82 397.677 63.36C395.817 60.9 394.887 57.69 394.887 53.73C394.887 47.85 397.017 43.26 401.277 39.96C405.537 36.6 411.087 34.92 417.927 34.92C424.887 34.92 430.497 36.6 434.757 39.96C439.017 43.26 441.297 47.88 441.597 53.82H424.947C424.827 51.78 424.077 50.19 422.697 49.05C421.317 47.85 419.547 47.25 417.387 47.25C415.527 47.25 414.027 47.76 412.887 48.78C411.747 49.74 411.177 51.15 411.177 53.01C411.177 55.05 412.137 56.64 414.057 57.78C415.977 58.92 418.977 60.15 423.057 61.47C427.137 62.85 430.437 64.17 432.957 65.43C435.537 66.69 437.757 68.52 439.617 70.92C441.477 73.32 442.407 76.41 442.407 80.19C442.407 83.79 441.477 87.06 439.617 90C437.817 92.94 435.177 95.28 431.697 97.02C428.217 98.76 424.107 99.63 419.367 99.63ZM561.745 35.82V48.15H545.005V99H529.615V48.15H512.875V35.82H561.745ZM586.659 35.82V99H571.269V35.82H586.659ZM629.492 99.63C623.552 99.63 618.092 98.25 613.112 95.49C608.192 92.73 604.262 88.89 601.322 83.97C598.442 78.99 597.002 73.41 597.002 67.23C597.002 61.05 598.442 55.5 601.322 50.58C604.262 45.66 608.192 41.82 613.112 39.06C618.092 36.3 623.552 34.92 629.492 34.92C635.432 34.92 640.862 36.3 645.782 39.06C650.762 41.82 654.662 45.66 657.482 50.58C660.362 55.5 661.802 61.05 661.802 67.23C661.802 73.41 660.362 78.99 657.482 83.97C654.602 88.89 650.702 92.73 645.782 95.49C640.862 98.25 635.432 99.63 629.492 99.63ZM629.492 85.59C634.532 85.59 638.552 83.91 641.552 80.55C644.612 77.19 646.142 72.75 646.142 67.23C646.142 61.65 644.612 57.21 641.552 53.91C638.552 50.55 634.532 48.87 629.492 48.87C624.392 48.87 620.312 50.52 617.252 53.82C614.252 57.12 612.752 61.59 612.752 67.23C612.752 72.81 614.252 77.28 617.252 80.64C620.312 83.94 624.392 85.59 629.492 85.59ZM728.684 99H713.294L687.554 60.03V99H672.164V35.82H687.554L713.294 74.97V35.82H728.684V99Z" fill="black"/><path d="M493.509 99.001H445.766L469.628 57.5342L493.509 99.001ZM518.543 99.001H500.742L473.175 51.4443L482.062 35.8945L518.543 99.001Z" fill="black"/><path d="M518.543 99.001H500.743L473.176 51.4443L482.062 35.8945L518.543 99.001Z" fill="#ED1F5E"/></svg>
        </span>
        <div style={{ width: 40, textAlign: "right" }}>
          {!isIntro && (
            <span style={{ fontSize: 12, color: "#aaa", fontWeight: 500 }}>
              {questionNumber}/{totalQuestions}
            </span>
          )}
        </div>
      </header>

      {/* Progress bar */}
      {!isIntro && (
        <div className="sf-progress-track">
          <div className="sf-progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>
      )}

      {/* Main */}
      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px", overflow: "hidden" }}>
        <div className={`sf-step${animating ? " exit" : ""}`} style={{ width: "100%", maxWidth: 900 }}>

          {/* INTRO */}
          {currentStep === "intro" && (
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 64, height: 64, background: "#e8365d", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 28px", fontSize: 28 }}>
                💬
              </div>
              <h1 style={{ fontSize: 34, fontWeight: 700, color: "#1a1a1a", marginBottom: 32, lineHeight: 1.2, letterSpacing: "-0.02em" }}>
                Set up your ConversAItion.
              </h1>
              <div style={{ display: "flex", gap: 16, marginBottom: 10, maxWidth: 900, margin: "0 auto 32px", justifyContent: "center" }}>
                <div style={{ flex: 1, background: "white", borderRadius: 16, padding: "28px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: 14, boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
                  <svg width="40" height="40" viewBox="0 0 118 119" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M31.2796 8.57875C40.2441 6.11934 54.1503 6.11934 54.1503 6.11934C54.1503 6.11934 69.1709 5.48861 78.5763 7.12719C85.9339 8.40901 90.7671 8.17886 96.9816 12.3211C102.522 16.0137 105.693 19.0713 108.029 25.3061C111.905 35.6544 111.452 42.4576 111.905 53.6018C112.376 65.1922 110.16 83.2542 110.16 83.2542C110.16 83.2542 108.165 93.6534 104.152 98.7587C99.6504 104.486 95.1759 106.028 88.4541 108.837C77.1555 113.558 57.2536 112.914 57.2536 112.914C57.2536 112.914 39.8452 112.261 28.1803 108.837C22.2183 107.086 18.9728 104.7 15.0015 99.9215C11.2784 95.4412 10.1308 92.0264 8.79967 86.3551C6.37152 76.0097 6.16102 71.0831 6.03288 60.4349C5.91421 50.5729 6.03291 43.6751 7.83058 34.0274C9.10312 27.1978 10.378 22.9327 15.0015 17.7476C19.8573 12.3021 24.2435 10.5091 31.2796 8.57875Z" stroke="#e8365d" stroke-width="12"/><circle cx="58.9852" cy="49.6285" r="16.8175" stroke="#e8365d" stroke-width="10"/><path d="M25.2729 107.031C25.6038 86.0175 40.5693 69.0994 58.9823 69.0994C77.6026 69.0994 92.6973 86.4005 92.6973 107.742" stroke="#e8365d" stroke-width="12"/></svg>
                  <p style={{ fontSize: 14, color: "#444", margin: 0, lineHeight: 1.6, textAlign: "center", fontFamily: "'Poppins', sans-serif", fontWeight: 700, whiteSpace: 'nowrap' }}>Describe who you're talking to</p>
                </div>
                <div style={{ flex: 1, background: "white", borderRadius: 16, padding: "28px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: 14, boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
                  <svg width="40" height="40" viewBox="0 0 146 130" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M42.0462 104.896L74.3954 81.7895H91.9564C91.9564 81.7895 97.127 80.9103 100.275 78.0924C103.044 75.6138 104.896 69.7741 104.896 69.7741V19.8639C104.896 19.8639 104.507 13.5403 102.123 10.6213C99.365 7.24297 91.9564 6 91.9564 6H18.0154C18.0154 6 12.2512 6.49206 9.69705 8.77279C7.04542 11.1405 6 17.0911 6 17.0911L6.92426 69.7741C6.92426 69.7741 8.36615 74.858 10.6213 77.1682C12.6541 79.2505 17.0911 80.8652 17.0911 80.8652L32.8036 81.7895L33.7279 101.199C33.7279 101.199 33.9673 103.059 34.6521 103.972C35.6206 105.263 36.7421 105.668 38.3492 105.82C39.8308 105.96 42.0462 104.896 42.0462 104.896Z" stroke="#e8365d" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/><path d="M104.896 70.6983V46.6675H128.003C128.003 46.6675 133.069 47.4168 135.397 49.4403C137.593 51.3496 139.094 55.9101 139.094 55.9101V93.8048C139.094 93.8048 139.215 98.9678 137.245 101.199C135.643 103.014 131.7 103.972 131.7 103.972L118.76 104.896V121.533C118.76 121.533 116.67 123.229 115.063 123.381C113.581 123.521 111.366 122.457 111.366 122.457L86.4107 104.896H72.5468C72.5468 104.896 67.0086 101.139 65.1527 97.5019C63.8 94.8506 63.3042 90.1078 63.3042 90.1078L74.3953 81.7894H94.7291C94.7291 81.7894 99.1662 80.1747 101.199 78.0924C103.454 75.7822 104.896 70.6983 104.896 70.6983Z" stroke="#e8365d" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/><path d="M24.4854 42.9705H30.9552" stroke="#e8365d" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/><path d="M52.2131 42.9705H58.683" stroke="#e8365d" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/><path d="M79.9409 42.9705H86.4108" stroke="#e8365d" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  <p style={{ fontSize: 14, color: "#444", margin: 0, lineHeight: 1.6, textAlign: "center", fontFamily: "'Poppins', sans-serif", fontWeight: 700, whiteSpace: 'nowrap' }}>Explain what the topic is about</p>
                </div>
                <div style={{ flex: 1, background: "white", borderRadius: 16, padding: "28px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: 14, boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="-5 -10 110 110" width="40" height="40" fill="#e8365d"><path d="m50 5c-24.793 0-45 20.207-45 45s20.207 45 45 45 45-20.207 45-45c0-6.6641-1.4609-12.996-4.0742-18.691l-5.8242 5.8164c-0.59375 0.59375-1.2461 1.1289-1.9375 1.6016 1.1953 3.5352 1.8438 7.3281 1.8438 11.273 0 19.391-15.617 35.004-35.008 35.004s-35-15.613-35-35.004 15.609-35 35-35c3.9453 0 7.7383 0.64453 11.273 1.8398 0.47266-0.69531 1.0078-1.3477 1.6016-1.9414l5.8242-5.8203c-5.6992-2.6172-12.035-4.0781-18.699-4.0781zm26.559 0.003906c-0.65234 0.03125-1.2695 0.30078-1.7344 0.76953l-10.535 10.535c-2.4844 2.4844-3.7227 5.9492-3.375 9.4453l0.57031 5.7031-9.7852 9.7812c-0.55859-0.10938-1.125-0.16406-1.6914-0.16406-4.9297 0-8.9297 3.9961-8.9297 8.9297 0 4.9297 3.9961 8.9297 8.9297 8.9258 4.9297 0 8.9297-3.9961 8.9297-8.9258 0-0.57031-0.054688-1.1367-0.16406-1.6953l9.7891-9.7812 5.6953 0.56641c3.4961 0.34766 6.9609-0.89062 9.4414-3.3711l10.539-10.539c1.5703-1.5664 0.60938-4.2539-1.5977-4.4727l-12.133-1.207-1.207-12.133c-0.12891-1.2852-1.168-2.2852-2.4531-2.3633-0.09375-0.007812-0.1875-0.007812-0.28125-0.003906zm-26.559 18.48c-14.59 0-26.523 11.926-26.523 26.516s11.934 26.523 26.523 26.523 26.523-11.934 26.523-26.523c0-3.1055-0.53906-6.0938-1.5352-8.8672-0.3125-0.007812-0.62109-0.027343-0.92969-0.058593l-4.7617-0.47266-3.7539 3.7461v0.003906c0.63281 1.7578 0.97656 3.6602 0.97656 5.6484 0 9.1836-7.3359 16.52-16.523 16.52-9.1836 0-16.52-7.3359-16.52-16.52s7.3359-16.523 16.52-16.523c1.9922 0 3.8945 0.34375 5.6602 0.98047l3.7461-3.7383-0.47656-4.7695c-0.03125-0.30859-0.050781-0.62109-0.058593-0.93359-2.7734-0.99219-5.7617-1.5312-8.8672-1.5312z"/></svg>
                  <p style={{ fontSize: 14, color: "#444", margin: 0, lineHeight: 1.6, textAlign: "center", fontFamily: "'Poppins', sans-serif", fontWeight: 700, whiteSpace: 'nowrap' }}>Define what you want to achieve</p>
                </div>
              </div>
              <p style={{ fontSize: 14, color: "#aaa", marginBottom: 44, maxWidth: 380, margin: "0 auto 44px", lineHeight: 1.6 }}>
                
              </p>
              <button className="sf-btn" onClick={() => setShowDisclaimer(true)} style={{ maxWidth: 260, margin: "0 auto", display: "block" }}>
                Start ConversAItion
              </button>
            </div>
          )}

          {/* STEP 1 */}
          {currentStep === "conversation_type" && (
            <div>
              <h2 style={{ fontSize: 26, fontWeight: 700, color: "#1a1a1a", marginBottom: 6, letterSpacing: "-0.01em" }}>
                What type of conversation is this?
              </h2>
              <p style={{ color: "#999", fontSize: 14, marginBottom: 24, fontWeight: 400 }}>
                Tap one to continue
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {CONVERSATION_TYPES.map(type => (
                  <button key={type.value} className={`sf-option${formData.purpose === type.value ? " sel" : ""}`}
                    onClick={() => { const updated = { ...formData, purpose: type.value }; setFormData(updated); setTimeout(() => { setErrors({}); setStepIndex(i => i + 1); }, 200); }}
                    data-testid={`select-purpose-${type.value.toLowerCase().replace(/\s+/g, '-')}`}>
                    <div>
                      <div className="sf-option-text">{type.value}</div>
                      <div className="sf-option-desc">{type.desc}</div>
                    </div>
                    <div className="sf-option-check">
                      {formData.purpose === type.value && "✓"}
                    </div>
                  </button>
                ))}
              </div>
              {errors.purpose && <p className="sf-error">{errors.purpose}</p>}
            </div>
          )}

          {/* STEP 2 */}
          {currentStep === "relationship" && (
            <div>
              <h2 style={{ fontSize: 26, fontWeight: 700, color: "#1a1a1a", marginBottom: 6, letterSpacing: "-0.01em" }}>
                Who are you talking to?
              </h2>
              <p style={{ color: "#999", fontSize: 14, marginBottom: 28, fontWeight: 400 }}>
                Describe your relationship with this person
              </p>
              <textarea className="sf-textarea" rows={4}
                placeholder="e.g. My direct manager of 2 years. Professional but can be dismissive at times..."
                value={formData.relationship}
                onChange={e => { setFormData(p => ({ ...p, relationship: e.target.value })); setErrors(er => ({ ...er, relationship: undefined })); }}
                data-testid="textarea-relationship" />
              {errors.relationship && <p className="sf-error">{errors.relationship}</p>}
              <div style={{ marginTop: 24 }}><button className="sf-btn" onClick={goNext}>Continue</button></div>
            </div>
          )}

          {/* STEP 3 */}
          {currentStep === "character_traits" && (
            <div>
              <h2 style={{ fontSize: 26, fontWeight: 700, color: "#1a1a1a", marginBottom: 6, letterSpacing: "-0.01em" }}>
                How would you describe them?
              </h2>
              <p style={{ color: "#999", fontSize: 14, marginBottom: 24, fontWeight: 400 }}>
                Select all traits that apply
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }} data-testid="checkbox-group-character-profile">
                {CHARACTER_TRAITS.map(trait => (
                  <button key={trait} className={`sf-trait${formData.characterProfile.includes(trait) ? " sel" : ""}`}
                    onClick={() => toggleTrait(trait)}
                    data-testid={`checkbox-trait-${trait.toLowerCase().replace(/\s+/g, '-')}`}>
                    {trait}
                  </button>
                ))}
              </div>
              {errors.characterProfile && <p className="sf-error">{errors.characterProfile}</p>}
              {formData.characterProfile.length > 0 && (
                <p style={{ fontSize: 13, color: "#e8365d", marginTop: 12, fontWeight: 500 }}>
                  {formData.characterProfile.length} trait{formData.characterProfile.length !== 1 ? "s" : ""} selected
                </p>
              )}
              <div style={{ marginTop: 28 }}><button className="sf-btn" onClick={goNext}>Continue</button></div>
            </div>
          )}

          {/* STEP 4 */}
          {currentStep === "core_issue" && (
            <div>
              <h2 style={{ fontSize: 26, fontWeight: 700, color: "#1a1a1a", marginBottom: 6, letterSpacing: "-0.01em" }}>
                What is this conversation about?
              </h2>
              <p style={{ color: "#999", fontSize: 14, marginBottom: 28, fontWeight: 400 }}>
                Describe the core issue or topic
              </p>
              <textarea className="sf-textarea" rows={5}
                placeholder="e.g. I need to push back on an unrealistic deadline. The scope doubled but the timeline stayed the same..."
                value={formData.coreIssue}
                onChange={e => { setFormData(p => ({ ...p, coreIssue: e.target.value })); setErrors(er => ({ ...er, coreIssue: undefined })); }}
                data-testid="textarea-core-issue" />
              {errors.coreIssue && <p className="sf-error">{errors.coreIssue}</p>}
              <div style={{ marginTop: 24 }}><button className="sf-btn" onClick={goNext}>Continue</button></div>
            </div>
          )}

          {/* STEP 5 */}
          {currentStep === "stances" && (
            <div>
              <h2 style={{ fontSize: 26, fontWeight: 700, color: "#1a1a1a", marginBottom: 6, letterSpacing: "-0.01em" }}>
                What does each person believe?
              </h2>
              <p style={{ color: "#999", fontSize: 14, marginBottom: 28, fontWeight: 400 }}>
                Set the stage for both sides
              </p>
              <div style={{ marginBottom: 18 }}>
                <label className="sf-label">Your stance</label>
                <textarea className="sf-textarea" rows={3}
                  placeholder="e.g. I believe the deadline needs to move by 3 weeks to maintain quality..."
                  value={formData.userStance}
                  onChange={e => { setFormData(p => ({ ...p, userStance: e.target.value })); setErrors(er => ({ ...er, userStance: undefined })); }}
                  data-testid="textarea-user-stance" />
                {errors.userStance && <p className="sf-error">{errors.userStance}</p>}
              </div>
              <div style={{ marginBottom: 24 }}>
                <label className="sf-label">Their stance</label>
                <textarea className="sf-textarea" rows={3}
                  placeholder="e.g. They believe the deadline is fixed due to client commitments..."
                  value={formData.otherStance}
                  onChange={e => { setFormData(p => ({ ...p, otherStance: e.target.value })); setErrors(er => ({ ...er, otherStance: undefined })); }}
                  data-testid="textarea-other-stance" />
                {errors.otherStance && <p className="sf-error">{errors.otherStance}</p>}
              </div>
              <button className="sf-btn" onClick={goNext}>Continue</button>
            </div>
          )}

          {/* STEP 6 */}
          {currentStep === "background" && (
            <div>
              <h2 style={{ fontSize: 26, fontWeight: 700, color: "#1a1a1a", marginBottom: 6, letterSpacing: "-0.01em" }}>
                Any background context?
              </h2>
              <p style={{ color: "#999", fontSize: 14, marginBottom: 6, fontWeight: 400 }}>
                Share any history that helps set the scene
              </p>
              <p style={{ display: "inline-block", fontSize: 11, color: "#bbb", background: "#f5f2ef", borderRadius: 20, padding: "3px 10px", marginBottom: 24, fontWeight: 500 }}>Optional</p>
              <textarea className="sf-textarea" rows={5}
                placeholder="e.g. This manager previously promised flexibility. There was a similar situation 6 months ago..."
                value={formData.backgroundStory}
                onChange={e => setFormData(p => ({ ...p, backgroundStory: e.target.value }))}
                data-testid="textarea-background-story" />
              <div style={{ marginTop: 24 }}>
                <button className="sf-btn" onClick={goNext}>Continue</button>
                <button className="sf-skip" onClick={goNext}>Skip this step</button>
              </div>
            </div>
          )}

          {/* STEP 7 */}
          {currentStep === "goal" && (
            <div>
              <h2 style={{ fontSize: 26, fontWeight: 700, color: "#1a1a1a", marginBottom: 6, letterSpacing: "-0.01em" }}>
                What do you want to achieve?
              </h2>
              <p style={{ color: "#999", fontSize: 14, marginBottom: 28, fontWeight: 400 }}>
                Define the outcome you're hoping for
              </p>
              <input className="sf-input" type="text"
                placeholder="e.g. Agree on a 3-week extension before the call ends"
                value={formData.goal}
                onChange={e => { setFormData(p => ({ ...p, goal: e.target.value })); setErrors(er => ({ ...er, goal: undefined })); }}
                data-testid="input-goal"
                onKeyDown={e => { if (e.key === "Enter") goNext(); }} />
              {errors.goal && <p className="sf-error">{errors.goal}</p>}
              <div style={{ marginTop: 32 }}>
                <button className="sf-btn" onClick={goNext} disabled={createScenarioMutation.isPending} data-testid="button-start-simulation">
                  {createScenarioMutation.isPending ? "Starting..." : "Start Simulation"}
                </button>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Privacy Disclaimer Popup */}
      {showDisclaimer && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
          <div style={{ background: "#ffffff", borderRadius: 20, padding: 32, maxWidth: 420, width: "100%", fontFamily: "'Poppins', sans-serif", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
            <div style={{ width: 48, height: 48, background: "#fff5f7", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 24 }}>🔒</div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: "#1a1a1a", textAlign: "center", marginBottom: 12 }}>Your data is safe</h3>
            <p style={{ fontSize: 14, color: "#666", lineHeight: 1.7, textAlign: "center", marginBottom: 24 }}>
              We <strong>do not store</strong> any of your personal information or conversations. Your privacy is fully protected.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                onClick={() => { setShowDisclaimer(false); goNext(); }}
                style={{ background: "#e8365d", color: "#fff", border: "none", borderRadius: 50, padding: "15px 32px", fontSize: 15, fontFamily: "'Poppins', sans-serif", fontWeight: 600, cursor: "pointer" }}
              >
                Got it, let's continue
              </button>
              <button
                onClick={() => setShowDisclaimer(false)}
                style={{ background: "none", border: "none", color: "#aaa", fontSize: 13, fontFamily: "'Poppins', sans-serif", cursor: "pointer", padding: 8 }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}