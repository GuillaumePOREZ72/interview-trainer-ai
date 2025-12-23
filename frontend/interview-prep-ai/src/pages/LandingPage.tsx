import { useState } from "react";
import HERO_IMG from "../assets/hero-img.png";
import { APP_FEATURES } from "../utils/data";
import { useNavigate } from "react-router-dom";
import { LuSparkles } from "react-icons/lu";
import Login from "./auth/Login";
import Signup from "./auth/Signup";
import Modal from "../components/Modal";
import { useUser } from "../hooks/useUser";
import ProfileInfoCard from "../components/cards/ProfileInfoCard";
import { useTheme } from "../hooks/useTheme";
import { LuSun, LuMoon } from "react-icons/lu";

type AuthPage = "login" | "signup";

const LandingPage = () => {
  const { user } = useUser();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const [openAuthModal, setOpenAuthModal] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<AuthPage>("login");

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handleCTA = () => {
    if (!user) {
      setOpenAuthModal(true);
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <>
      <div className="w-full min-h-full bg-linear-to-br from-bg-primary via-indigo-50/30 to-purple-50/30 dark:from-bg-primary dark:via-indigo-950/30 dark:to-purple-950/30">
        {/* Animated gradient blobs */}
        <div className="w-[500px] h-[500px] bg-linear-to-br from-indigo-200/30 to-purple-200/30 dark:from-indigo-900/30 dark:to-purple-900/30 blur-[80px] absolute top-0 left-0 animate-blob1" />
        <div className="w-[400px] h-[400px] bg-linear-to-br from-purple-200/30 to-cyan-200/30 dark:from-purple-900/30 dark:to-cyan-900/30 blur-[80px] absolute top-20 right-0 animate-blob2" />

        <div className="container mx-auto px-4 pt-6 pb-[200px] relative z-10">
          {/* Header */}
          <header className="flex justify-between items-center mb-16">
            <div className="text-xl text-text-primary font-bold">
              Interview Trainer AI
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full hover:bg-bg-secondary text-text-secondary hover:text-primary transition-all cursor-pointer"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? (
                  <LuSun className="text-xl text-text-tertiary" />
                ) : (
                  <LuMoon className="text-xl" />
                )}
              </button>
              {user ? (
                <ProfileInfoCard />
              ) : (
                <button
                  className="bg-linear-to-r from-primary to-secondary text-sm font-semibold text-white px-7 py-2.5 rounded-full hover:shadow-lg hover:shadow-primary/30 hover:scale-[1.02] border border-indigo-400/30 transition-all duration-200 cursor-pointer"
                  onClick={() => setOpenAuthModal(true)}
                >
                  Login / Sign Up
                </button>
              )}
            </div>
          </header>

          {/* Hero Content */}
          <div className="flex flex-col md:flex-row items-center">
            <div className="w-full md:w-1/2 pr-4 mb-8 md:mb-0">
              <div className="flex items-center justify-left mb-4">
                <div className="flex items-center gap-2 text-[13px] text-indigo-700 dark:text-indigo-300 font-semibold bg-indigo-100 dark:bg-indigo-900/50 px-3 py-1.5 rounded-full border border-indigo-200 dark:border-indigo-700">
                  <LuSparkles /> Powered by AI
                </div>
              </div>
              <h1 className="text-5xl text-text-primary font-semibold mb-6 leading-tight">
                Master Your Next Interview with <br />
                <span className="gradient-text-primary bg-size-[200%_200%] animate-text-shine font-bold">
                  {" "}
                  AI-powered
                </span>{" "}
                Preparation
              </h1>
            </div>
            <div className="w-full md:w-1/2">
              <p className="text-[17px] text-text-secondary text-justify mr-0 md:mr-20 mb-6 leading-relaxed">
                Generate custom interview questions, get instant explanations,
                and organize your prep sessions like a pro. Your AI interview
                coach is ready.
              </p>
              <button
                className="bg-linear-to-r from-slate-900 to-slate-800 dark:from-slate-100 dark:to-slate-200 text-sm font-semibold text-white dark:text-slate-900 px-8 py-3 rounded-full hover:shadow-xl hover:shadow-slate-900/30 dark:hover:shadow-slate-100/20 hover:scale-[1.02] border border-slate-700 dark:border-slate-300 transition-all duration-200 cursor-pointer"
                onClick={handleCTA}
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full min-h-full relative z-10">
        <div>
          <section className="flex items-center justify-center -mt-36">
            <img
              src={HERO_IMG}
              alt="Hero image"
              className="w-[80vw] rounded-2xl shadow-2xl shadow-slate-900/10 dark:shadow-black/30 ring-1 ring-slate-900/5 dark:ring-slate-700/50"
            />
          </section>
        </div>

        <div className="w-full min-h-full bg-linear-to-br from-bg-primary via-indigo-50/30 to-purple-50/30 dark:from-bg-primary dark:via-indigo-950/30 dark:to-purple-950/30 mt-10">
          <div className="container mx-auto px-4 pt-10 pb-20">
            <section className="mt-5">
              <h2 className="text-3xl font-semibold text-center mb-12 text-text-primary">
                Your Complete{" "}
                <span className="gradient-text-purple">Interview</span> Toolkit
              </h2>

              <div className="flex flex-col items-center gap-8">
                {/* First 3 cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
                  {APP_FEATURES.slice(0, 3).map((feature) => (
                    <div
                      key={feature.id}
                      className="bg-white/80 dark:bg-bg-secondary/80 backdrop-blur-sm p-6 rounded-xl shadow-lg hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 border border-slate-200/50 dark:border-slate-700/50 hover:-translate-y-1 group"
                    >
                      <div className="w-12 h-12 bg-linear-to-br from-primary to-secondary rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                        <span className="text-2xl">✨</span>
                      </div>
                      <h3 className="text-base font-semibold mb-3 text-text-primary">
                        {feature.title}
                      </h3>
                      <p className="text-text-secondary text-justify leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Remaining 2 cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {APP_FEATURES.slice(3).map((feature) => (
                    <div
                      key={feature.id}
                      className="bg-white/80 dark:bg-bg-secondary/80 backdrop-blur-sm p-6 rounded-xl shadow-lg hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 border border-slate-200/50 dark:border-slate-700/50 hover:-translate-y-1 group"
                    >
                      <div className="w-12 h-12 bg-linear-to-br from-primary to-secondary rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                        <span className="text-2xl">🚀</span>
                      </div>
                      <h3 className="text-base font-semibold mb-3 text-text-primary">
                        {feature.title}
                      </h3>
                      <p className="text-text-secondary leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </div>

        <div className="text-sm bg-bg-secondary text-text-secondary text-center p-5 mt-5 border-t border-border-primary">
          Built by a developer, for developers. Good luck! 🚀
        </div>
      </div>
      <Modal
        title="Welcome to Interview Trainer AI"
        isOpen={openAuthModal}
        onClose={() => {
          setOpenAuthModal(false);
          setCurrentPage("login");
        }}
        hideHeader
      >
        <div>
          {currentPage === "login" && <Login setCurrentPage={setCurrentPage} />}
          {currentPage === "signup" && (
            <Signup setCurrentPage={setCurrentPage} />
          )}
        </div>
      </Modal>
    </>
  );
};

export default LandingPage;
