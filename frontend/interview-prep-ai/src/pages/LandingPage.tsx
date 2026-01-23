import { useState } from "react";
import { useTranslation } from "react-i18next";
import HERO_IMG from "../assets/hero-img.png";
import LOGO from "../assets/logo.png";
import { APP_FEATURES } from "../utils/data";
import { useNavigate } from "react-router-dom";
import { LuSparkles, LuMenu, LuX } from "react-icons/lu";
import { AnimatePresence, motion } from "framer-motion";
import Login from "./auth/Login";
import Signup from "./auth/Signup";
import Modal from "../components/Modal";
import ForgotPassword from "./auth/ForgotPassword";
import { useUser } from "../hooks/useUser";
import ProfileInfoCard from "../components/cards/ProfileInfoCard";
import { useTheme } from "../hooks/useTheme";
import { LuSun, LuMoon } from "react-icons/lu";
import LanguageSwitcher from "../components/LanguageSwitcher";

type AuthPage = "login" | "signup" | "forgotPassword";

const LandingPage = () => {
  const { t } = useTranslation();
  const { user } = useUser();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  
  const [openAuthModal, setOpenAuthModal] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<AuthPage>("login");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

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
      <div className="w-full min-h-full bg-linear-to-br from-bg-primary via-indigo-50/30 to-purple-50/30 dark:from-bg-primary dark:via-indigo-950/30 dark:to-purple-950/30 relative overflow-hidden">
        {/* Animated gradient blobs */}
        <div className="w-[500px] h-[500px] bg-linear-to-br from-indigo-200/30 to-purple-200/30 dark:from-indigo-900/30 dark:to-purple-900/30 blur-[80px] absolute top-0 left-0 animate-blob1" />
        <div className="w-[400px] h-[400px] bg-linear-to-br from-purple-200/30 to-cyan-200/30 dark:from-purple-900/30 dark:to-cyan-900/30 blur-[80px] absolute top-20 right-0 animate-blob2" />

        <div className="container mx-auto px-4 md:px-8 pt-6 pb-[200px] relative z-10">
          {/* Header */}
          <header className="flex justify-between items-center mb-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20 overflow-hidden">
                <img
                  src={LOGO}
                  alt="Interview Trainer AI Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <h2 className="text-sm md:text-xl font-bold text-text-primary tracking-tight leading-5">
                Interview Trainer <span className="text-secondary">AI</span>
              </h2>
            </div>
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4">
              <LanguageSwitcher />
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full hover:bg-bg-secondary text-text-primary hover:text-primary transition-all cursor-pointer"
                aria-label={t("nav.toggleTheme")}
              >
                {theme === "dark" ? (
                  <LuSun className="text-xl" />
                ) : (
                  <LuMoon className="text-xl" />
                )}
              </button>
              {user ? (
                <ProfileInfoCard />
              ) : (
                <button
                  className="bg-linear-to-r from-primary to-secondary text-sm font-semibold text-white px-7 py-2.5 rounded-full hover:shadow-lg hover:shadow-primary/30 hover:scale-[1.02] border border-indigo-400/30 transition-all duration-200 cursor-pointer whitespace-nowrap"
                  onClick={() => setOpenAuthModal(true)}
                >
                  {t("nav.login")}
                </button>
              )}
            </div>

            {/* Mobile Navigation */}
            <div className="md:hidden relative">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-text-primary hover:text-primary transition-colors cursor-pointer"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? (
                  <LuX className="text-2xl" />
                ) : (
                  <LuMenu className="text-2xl" />
                )}
              </button>

              <AnimatePresence>
                {isMobileMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 top-full mt-2 w-64 bg-white/90 dark:bg-bg-secondary/95 backdrop-blur-md rounded-2xl shadow-xl border border-border-primary p-4 flex flex-col gap-4 z-50"
                  >
                    {/* User Profile or Auth */}
                    {user ? (
                      <div className="pb-4 border-b border-border-primary">
                        <ProfileInfoCard />
                      </div>
                    ) : (
                      <button
                        className="w-full bg-linear-to-r from-primary to-secondary text-sm font-semibold text-white px-4 py-3 rounded-xl shadow-md hover:shadow-lg hover:shadow-primary/30 transition-all duration-200"
                        onClick={() => {
                          setOpenAuthModal(true);
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        {t("nav.login")}
                      </button>
                    )}

                    {/* Controls */}
                    <div className="flex flex-col gap-2">
                      {/* Language */}
                      <div className="flex items-center justify-between px-2">
                        <span className="text-sm font-medium text-text-secondary">
                          Language
                        </span>
                        <LanguageSwitcher />
                      </div>

                      {/* Theme */}
                      <div className="flex items-center justify-between px-2 py-2">
                        <span className="text-sm font-medium text-text-secondary">
                          Theme
                        </span>
                        <div className="flex bg-bg-tertiary rounded-lg p-1">
                          <button
                            onClick={() => setTheme("light")}
                            className={`p-1.5 rounded-md transition-all ${theme === "light" ? "bg-white shadow text-primary" : "text-text-tertiary"}`}
                          >
                            <LuSun className="text-lg" />
                          </button>
                          <button
                            onClick={() => setTheme("dark")}
                            className={`p-1.5 rounded-md transition-all ${theme === "dark" ? "bg-bg-primary shadow text-primary" : "text-text-tertiary"}`}
                          >
                            <LuMoon className="text-lg" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </header>

          {/* Hero Content */}
          <div className="flex flex-col md:flex-row items-center">
            <div className="w-full md:w-1/2 pr-4 mb-8 md:mb-0">
              <div className="flex items-center justify-left mb-4">
                <div className="flex items-center gap-2 text-[13px] text-indigo-700 dark:text-indigo-300 font-semibold bg-indigo-100 dark:bg-indigo-900/50 px-3 py-1.5 rounded-full border border-indigo-200 dark:border-indigo-700">
                  <LuSparkles /> {t("app.tagline")}
                </div>
              </div>
              <h1 className="text-5xl text-text-primary font-semibold mb-6 leading-tight">
                {t("landing.hero.title")} <br />
                <span className="gradient-text-primary bg-size-[200%_200%] animate-text-shine font-bold">
                  {" "}
                  {t("landing.hero.aiPowered")}
                </span>{" "}
                {t("landing.hero.preparation")}
              </h1>
            </div>
            <div className="w-full md:w-1/2">
              <p className="text-[17px] text-text-secondary text-justify mr-0 md:mr-20 mb-6 leading-relaxed">
                {t("landing.hero.description")}
              </p>
              <button
                className="bg-linear-to-r from-slate-900 to-slate-800 dark:from-slate-100 dark:to-slate-200 text-sm font-semibold text-white dark:text-slate-900 px-8 py-3 rounded-full hover:shadow-xl hover:shadow-slate-900/30 dark:hover:shadow-slate-100/20 hover:scale-[1.02] border border-slate-700 dark:border-slate-300 transition-all duration-200 cursor-pointer"
                onClick={handleCTA}
              >
                {t("landing.hero.cta")}
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
                {t("landing.features.sectionTitle")}{" "}
                <span className="gradient-text-purple">
                  {t("landing.features.interview")}
                </span>{" "}
                {t("landing.features.toolkit")}
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
                        {t(feature.titleKey)}
                      </h3>
                      <p className="text-text-secondary text-justify leading-relaxed">
                        {t(feature.descriptionKey)}
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
                        {t(feature.titleKey)}
                      </h3>
                      <p className="text-text-secondary leading-relaxed">
                        {t(feature.descriptionKey)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </div>

        <div className="text-sm bg-bg-secondary text-text-secondary text-center p-5 mt-5 border-t border-border-primary">
          {t("landing.footer")}
        </div>
      </div>
      <Modal
        title={t("auth.modal.title")}
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
          {currentPage === "forgotPassword" && (
            <ForgotPassword setCurrentPage={setCurrentPage} />
          )}
        </div>
      </Modal>
    </>
  );
};

export default LandingPage;
