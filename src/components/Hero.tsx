"use client";
export default function Hero({
  onRoleChange,
  role
}: { onRoleChange: (r: "Data Analyst"|"Business Analyst"|"QA") => void; role: "Data Analyst"|"Business Analyst"|"QA" }) {
  return (
    <div className="rounded-3xl border bg-white shadow-sm p-6 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="text-3xl md:text-4xl font-semibold">Meet Samyam’s Chatbot</h1>
          <p className="mt-2 text-gray-600">
            I’m Samyam (she/her). Ask me about my experience, projects, tools, and education. 
            I answer strictly from my portfolio—if something isn’t covered, I’ll invite you to message me directly.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {(["Data Analyst","Business Analyst","QA"] as const).map(opt => (
              <button key={opt} onClick={()=>onRoleChange(opt)}
                className={`px-3 py-2 rounded-full text-sm border ${role===opt ? "bg-blue-600 text-white border-blue-600" : "bg-white hover:bg-gray-100"}`}>
                {opt}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
