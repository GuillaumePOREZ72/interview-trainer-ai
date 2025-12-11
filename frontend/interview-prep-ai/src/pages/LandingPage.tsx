import { useState } from "react";

import HERO_IMG from "../assets/hero_img.png";
import { APP_FEATURES } from "../utils/data";
import { useNavigate } from "react-router-dom";
import { LuSparkles } from "react-icons/lu";
import Login from "./auth/Login";
import Signup from "./auth/Signup";
import Modal from "../components/Modal";
import { useUser } from "../hooks/useUser";
import ProfileInfoCard from "../components/cards/ProfileInfoCard";

type AuthPage = "login" | "signup";

const LandingPage = () => {
  const { user } = useUser();
  const navigate = useNavigate();

  const [openAuthModal, setOpenAuthModal] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<AuthPage>("login");

  const handleCTA = () => {
    if (!user) {
      setOpenAuthModal(true);
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <>
      <div className="w-full min-h-full  bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30">
        {/* Animated gradient blobs */}
        <div className="w-[500px] h-[500px] bg-gradient-to-br from-indigo-200/30 to-purple-200/30 blur-[80px] absolute top-0 left-0 animate-blob1" />
        <div className="w-[400px] h-[400px] bg-gradient-to-br from-purple-200/30 to-cyan-200/30 blur-[80px] absolute top-20 right-0 animate-blob2" />

        <div className="container mx-auto px-4 pt-6 pb-[200px] relative z-10">
          {/* Header */}
          <header className="flex justify-between items-center mb-16">
            <div className="text-xl text-slate-900 font-bold">
              Interview Trainer AI
            </div>
            {user ? (
              <ProfileInfoCard />
            ) : (
              <button
                className="bg-gradient-to-r from-primary to-secondary text-sm font-semibold text-white px-7 py-2.5 rounded-full hover:shadow-lg hover:shadow-primary/30 hover:scale-[1.02] border border-indigo-400/30 transition-all duration-200 cursor-pointer"
                onClick={() => setOpenAuthModal(true)}
              >
                Login / Sign Up
              </button>
            )}
          </header>

          {/* Hero Content */}
          <div className="flex flex-col md:flex-row items-center">
            <div className="w-full md:w-1/2 pr-4 mb-8 md:mb-0">
              <div className="flex items-center justify-left mb-4">
                <div className="flex items-center gap-2 text-[13px] text-indigo-700 font-semibold bg-indigo-100 px-3 py-1.5 rounded-full border border-indigo-200">
                  <LuSparkles /> AI Powered
                </div>
              </div>
              <h1 className="text-5xl text-slate-900 font-semibold mb-6 leading-tight">
                Ace Interviews with <br />
                <span className="gradient-text-primary bg-[length:200%_200%]animate-text-shine font-bold">
                  {" "}
                  AI-powered
                </span>{" "}
                Learning
              </h1>
            </div>
            <div className="w-full md:w-1/2">
              <p className="text-[17px] text-slate-700 mr-0 md:mr-20 mb-6 leading-relaxed">
                Get role-specific questions, expand answers when you need them,
                dive deeper into concepts, and organize everything your way.
                From preparation to mastery - your ultimate interview toolkit is
                here.
              </p>
              <button
                className="bg-gradient-to-r from-slate-900 to-slate-800 text-sm font-semibold text-white px-8 py-3 rounded-full hover:shadow-xl hover:shadow-slate-900/30 hover:scale-[1.02] border border-slate-700 transition-all duration-200 cursor-pointer"
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
              className="w-[80vw] rounded-2xl shadow-2xl shadow-slate-900/10 ring-1 ring-slate-900/5"
            />
          </section>
        </div>

        <div className="w-full min-h-full bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 mt-10">
          <div className="container mx-auto px-4 pt-10 pb-20">
            <section className="mt-5">
              <h2 className="text-3xl font-semibold text-center mb-12 text-slate-900">
                Features That Make You{" "}
                <span className="gradient-text-purple">Shine</span>
              </h2>

              <div className="flex flex-col items-center gap-8">
                {/* First 3 cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
                  {APP_FEATURES.slice(0, 3).map((feature) => (
                    <div
                      key={feature.id}
                      className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-lg hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 border border-slate-200/50 hover:-translate-y-1 group"
                    >
                      <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                        <span className="text-2xl">✨</span>
                      </div>
                      <h3 className="text-base font-semibold mb-3 text-slate-900">
                        {feature.title}
                      </h3>
                      <p className="text-slate-600 leading-relaxed">
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
                      className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-lg hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 border border-slate-200/50 hover:-translate-y-1 group"
                    >
                      <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                        <span className="text-2xl">🚀</span>
                      </div>
                      <h3 className="text-base font-semibold mb-3 text-slate-900">
                        {feature.title}
                      </h3>
                      <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </div>

        <div className="text-sm bg-slate-100 text-slate-600 text-center p-5 mt-5 border-t border-slate-200">
          Made with ❤️ by Guillaume... Happy Coding
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
