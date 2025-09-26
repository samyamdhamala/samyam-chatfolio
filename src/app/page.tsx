"use client";

import Link from "next/link";
import Image from "next/image";
import ProfileHeader from "../components/ProfileHeader";
import ChatAbout from "../components/ChatAbout";
import ProjectsGrid from "../components/ProjectsGrid";
import AskPanel from "../components/AskPanel";

export default function Page() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-50 text-gray-900">
      {/* Top nav with anchored sections */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8 overflow-hidden rounded-full bg-gray-200">
              <Image src="/samyam.jpg" alt="Samyam Dhamala" fill className="object-cover" />
            </div>
            <span className="font-semibold">Samyam Dhamala</span>
          </div>
          <nav className="hidden md:flex items-center gap-4 text-sm">
            <Link href="#about" className="hover:text-blue-600">About</Link>
            <Link href="#chatbot" className="hover:text-blue-600">About the Chatbot</Link>
            <Link href="#ask" className="hover:text-blue-600">Ask</Link>
            <Link href="#projects" className="hover:text-blue-600">Projects</Link>
            <a href="/Samyam_Dhamala_Resume.pdf" download className="px-3 py-1.5 rounded-lg bg-gray-900 text-white">
              Download Resume
            </a>
          </nav>
        </div>
      </header>

      {/* About Me */}
      <section id="about" className="max-w-5xl mx-auto px-6 py-8">
        <ProfileHeader />
      </section>

      {/* About the Chatbot */}
      <section id="chatbot" className="max-w-5xl mx-auto px-6 py-8">
        <ChatAbout />
      </section>

      {/* Ask (inline chat) */}
      <section id="ask" className="max-w-5xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-semibold mb-4">Ask</h2>
        <AskPanel />
      </section>

      {/* Projects */}
      <section id="projects" className="max-w-5xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-semibold mb-4">My Projects</h2>
        <ProjectsGrid />
      </section>

      <footer className="mt-8 py-8 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} Samyam Dhamala
      </footer>
    </main>
  );
}
