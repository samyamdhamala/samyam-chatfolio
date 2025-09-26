"use client";

import Image from "next/image";

export default function ProfileHeader() {
  return (
    <div className="rounded-3xl border bg-white shadow-sm p-6 md:p-8 flex flex-col md:flex-row gap-6">
      <div className="shrink-0">
        {/* Place the photo at /public/samyam.jpg */}
        <div className="relative w-32 h-32 md:w-40 md:h-40 overflow-hidden rounded-2xl bg-gray-100">
          <Image src="/samyam.jpg" alt="Samyam Dhamala" fill className="object-cover" />
        </div>
      </div>

      <div className="flex-1">
        <h1 className="text-3xl md:text-4xl font-semibold">Hi, I’m Samyam.</h1>
        <p className="mt-2 text-gray-600">
          I’m a Data & QA Engineer (she/her) moving toward Data/Business Analyst roles. I blend SQL/Python analytics
          with a QA mindset to validate data, clarify requirements, and ship reliable insights.
        </p>

        <div className="mt-4 flex flex-wrap gap-2 text-sm text-gray-700">
          {["SQL","Python","Power BI","Tableau","QA Automation"].map((t) => (
            <span key={t} className="rounded-full bg-gray-100 px-2 py-1">{t}</span>
          ))}
        </div>

        <div className="mt-4 flex gap-2">
          <a href="/Samyam_Dhamala_Resume.pdf" download className="px-3 py-2 rounded-lg bg-gray-900 text-white text-sm">
            Download PDF
          </a>
          <a href="/SamyamDhamalaResume.docx" download className="px-3 py-2 rounded-lg border text-sm">
            Download DOCX
          </a>
        </div>
      </div>
    </div>
  );
}
